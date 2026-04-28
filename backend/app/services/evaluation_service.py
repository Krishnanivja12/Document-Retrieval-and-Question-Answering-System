from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from typing import Any, Dict, List, Optional
import traceback

from deepeval.metrics import AnswerRelevancyMetric, ContextualPrecisionMetric, FaithfulnessMetric
from deepeval.models.base_model import DeepEvalBaseLLM
from deepeval.test_case import LLMTestCase
from langchain_cohere import ChatCohere
from loguru import logger
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.evaluation import Evaluation
from app.services.retrieval_service import hybrid_search


class EvaluationServiceError(Exception):
    def __init__(self, message: str, status_code: int = 500, error_code: str = "evaluation_error"):
        super().__init__(message)
        self.status_code = status_code
        self.error_code = error_code


class SessionNotFoundError(EvaluationServiceError):
    def __init__(self, message: str = "Session state not found"):
        super().__init__(message=message, status_code=404, error_code="session_not_found")


class NonScorableSessionError(EvaluationServiceError):
    def __init__(self, message: str):
        super().__init__(message=message, status_code=422, error_code="non_scorable_session")


class EvaluationProviderError(EvaluationServiceError):
    def __init__(self, message: str):
        super().__init__(message=message, status_code=503, error_code="evaluation_provider_error")


class EvaluationExecutionError(EvaluationServiceError):
    def __init__(self, message: str = "DeepEval evaluation failed"):
        super().__init__(message=message, status_code=500, error_code="evaluation_execution_error")


@dataclass
class EvaluationModelSelection:
    model: DeepEvalBaseLLM
    provider: str
    model_name: str


_MODEL_CACHE: Dict[tuple[str, str, int], DeepEvalBaseLLM] = {}
_MODEL_CACHE_LOCK = Lock()


def _extract_response_content(response: Any) -> str:
    if response is None:
        return ""
    if isinstance(response, str):
        return response
    content = getattr(response, "content", "")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        flattened: List[str] = []
        for item in content:
            if isinstance(item, str):
                flattened.append(item)
                continue
            if isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    flattened.append(text)
        return "\n".join(flattened).strip()
    return str(response)


class CohereDeepEvalModel(DeepEvalBaseLLM):
    def __init__(self, api_key: str, model_name: str = "c4ai-aya-expanse-32b", max_tokens: int = 1024):
        self.model_name = model_name
        self.client = ChatCohere(
            cohere_api_key=api_key,
            model=model_name,
            temperature=0,
            max_tokens=max_tokens,
        )

    def get_model_name(self) -> str:
        return f"cohere:{self.model_name}"

    def load_model(self):
        return self.client

    def generate(self, prompt: str) -> str:
        response = self.client.invoke(prompt)
        return _extract_response_content(response)

    async def a_generate(self, prompt: str) -> str:
        response = await self.client.ainvoke(prompt)
        return _extract_response_content(response)


def _compress_contexts(contexts: List[str]) -> List[str]:
    max_items = max(1, int(settings.EVAL_CONTEXT_MAX_ITEMS))
    max_chars = max(200, int(settings.EVAL_CONTEXT_MAX_CHARS_PER_ITEM))
    trimmed: List[str] = []
    for item in contexts[:max_items]:
        text = item.strip()
        if not text:
            continue
        if len(text) > max_chars:
            text = text[:max_chars]
        trimmed.append(text)
    return trimmed


def _normalize_contexts(contexts: List[str] | None) -> List[str]:
    normalized: List[str] = []
    for context in contexts or []:
        if context is None:
            continue
        cleaned = str(context).strip()
        if cleaned:
            normalized.append(cleaned)
    return normalized


def _extract_contexts_from_state(state_values: dict) -> List[str]:
    context_chunks = state_values.get("context") or []
    contexts: List[str] = []
    for chunk in context_chunks:
        if isinstance(chunk, dict):
            content = (chunk.get("content") or "").strip()
            if content:
                contexts.append(content)
        elif isinstance(chunk, str) and chunk.strip():
            contexts.append(chunk.strip())
    return contexts


def _dedupe_contexts(contexts: List[str]) -> List[str]:
    deduped: List[str] = []
    seen: set[str] = set()
    for context in contexts:
        key = context.strip()
        if not key:
            continue
        if key in seen:
            continue
        seen.add(key)
        deduped.append(key)
    return deduped


def _build_eval_model() -> EvaluationModelSelection:
    cohere_key = getattr(settings, "COHERE_API_KEY", None)

    if cohere_key:
        model_name = settings.EVALUATION_MODEL or "c4ai-aya-expanse-32b"
        cache_key = ("cohere", model_name, settings.LLM_MAX_TOKENS)
        with _MODEL_CACHE_LOCK:
            model = _MODEL_CACHE.get(cache_key)
            if model is None:
                model = CohereDeepEvalModel(
                    api_key=cohere_key,
                    model_name=model_name,
                    max_tokens=settings.LLM_MAX_TOKENS,
                )
                _MODEL_CACHE[cache_key] = model
        return EvaluationModelSelection(
            model=model,
            provider="cohere",
            model_name=model_name,
        )

    raise EvaluationProviderError(
        "No evaluation LLM API key configured. Set COHERE_API_KEY for DeepEval scoring."
    )


def _score_metric(metric_name: str, metric: Any, test_case: LLMTestCase) -> Dict[str, Any]:
    metric.measure(test_case)
    score = float(getattr(metric, "score", 0.0) or 0.0)
    reason = getattr(metric, "reason", None)
    success = bool(metric.is_successful()) if hasattr(metric, "is_successful") else None
    return {
        "name": metric_name,
        "score": score,
        "reason": reason,
        "success": success,
    }


def _evaluate_with_model(
    question: str,
    answer: str,
    retrieval_context: List[str],
    model_selection: EvaluationModelSelection,
) -> Dict[str, Any]:
    test_case = LLMTestCase(
        input=question,
        actual_output=answer,
        expected_output=answer,
        retrieval_context=retrieval_context,
    )

    faithfulness_metric = FaithfulnessMetric(model=model_selection.model, include_reason=True)
    answer_relevancy_metric = AnswerRelevancyMetric(model=model_selection.model, include_reason=True)
    context_precision_metric = ContextualPrecisionMetric(model=model_selection.model, include_reason=True)

    faithfulness_result = _score_metric("faithfulness", faithfulness_metric, test_case)
    answer_relevancy_result = _score_metric("answer_relevancy", answer_relevancy_metric, test_case)
    context_precision_result = _score_metric("context_precision", context_precision_metric, test_case)

    return {
        "faithfulness": faithfulness_result["score"],
        "answer_relevancy": answer_relevancy_result["score"],
        "context_precision": context_precision_result["score"],
        "metrics_json": {
            "framework": "deepeval",
            "provider": model_selection.provider,
            "model_name": model_selection.model.get_model_name(),
            "retrieval_context_count": len(retrieval_context),
            "metrics": {
                "faithfulness": faithfulness_result,
                "answer_relevancy": answer_relevancy_result,
                "context_precision": context_precision_result,
            },
        },
    }


def run_deepeval_evaluation(
    question: str,
    answer: str,
    contexts: List[str],
    tool_outputs: Optional[List[str]] = None,
) -> Dict:
    logger.info("DeepEval evaluation starting")

    question = (question or "").strip()
    answer = (answer or "").strip()
    contexts = _normalize_contexts(contexts)
    tool_outputs = _normalize_contexts(tool_outputs)
    retrieval_context = _compress_contexts(_dedupe_contexts(contexts + tool_outputs))

    if not question:
        raise NonScorableSessionError("Question is empty")

    if not answer:
        raise NonScorableSessionError("Answer is empty")

    if not retrieval_context:
        raise NonScorableSessionError("No contexts provided for evaluation")

    model_selection = _build_eval_model()
    logger.info(f"Using DeepEval provider: {model_selection.provider}")

    try:
        scores = _evaluate_with_model(question, answer, retrieval_context, model_selection)
        logger.info(f"DeepEval scores: {scores}")
        return scores
    except EvaluationServiceError:
        raise
    except Exception as exc:
        logger.error(f"DeepEval evaluation failed: {exc}\n{traceback.format_exc()}")
        error_text = str(exc).strip()
        if "invalid json" in error_text.lower():
            # Some models occasionally break strict JSON schema output used by DeepEval.
            # Retry once with a more JSON-stable Cohere model while keeping Aya as default.
            fallback_model = "command-r-plus-08-2024"
            if model_selection.provider == "cohere" and model_selection.model_name != fallback_model:
                try:
                    cohere_key = settings.COHERE_API_KEY
                    if cohere_key:
                        logger.warning(
                            f"Retrying DeepEval once with fallback model {fallback_model} after invalid JSON from {model_selection.model_name}."
                        )
                        cache_key = ("cohere", fallback_model, settings.LLM_MAX_TOKENS)
                        with _MODEL_CACHE_LOCK:
                            fallback_model_instance = _MODEL_CACHE.get(cache_key)
                            if fallback_model_instance is None:
                                fallback_model_instance = CohereDeepEvalModel(
                                    api_key=cohere_key,
                                    model_name=fallback_model,
                                    max_tokens=settings.LLM_MAX_TOKENS,
                                )
                                _MODEL_CACHE[cache_key] = fallback_model_instance
                        fallback_selection = EvaluationModelSelection(
                            model=fallback_model_instance,
                            provider="cohere",
                            model_name=fallback_model,
                        )
                        fallback_scores = _evaluate_with_model(question, answer, retrieval_context, fallback_selection)
                        fallback_scores["metrics_json"]["fallback_used"] = {
                            "primary_model": model_selection.model_name,
                            "fallback_model": fallback_model,
                            "reason": "invalid_json_from_primary_model",
                        }
                        logger.info(f"DeepEval fallback scores: {fallback_scores}")
                        return fallback_scores
                except Exception as fallback_exc:
                    logger.error(
                        f"DeepEval fallback model also failed: {fallback_exc}\n{traceback.format_exc()}"
                    )
            raise EvaluationExecutionError(
                f"Evaluation LLM outputted an invalid JSON. Please use a better evaluation model. {error_text}"
            ) from exc
        raise EvaluationExecutionError(error_text) from exc


def evaluate_session(session_id: str, db: Session):
    """Evaluate a session by retrieving its state and running DeepEval evaluation."""
    from app.agent.graph import compile_agent_graph_sync

    config = {"configurable": {"thread_id": session_id}}
    with compile_agent_graph_sync() as agent_graph:
        state = agent_graph.get_state(config)

    if not state or not state.values:
        raise SessionNotFoundError()

    question = (state.values.get("question") or "").strip()
    answer = (state.values.get("answer") or "").strip()
    contexts = _extract_contexts_from_state(state.values)

    # Recovery path: if context wasn't persisted in state, fetch retrieval context again.
    if not contexts and question:
        retrieval_results = hybrid_search(
            query=question,
            top_k=settings.EVAL_RECOVERY_TOP_K,
            filters=None,
            db=db,
        )
        contexts = _normalize_contexts([item.get("content") for item in retrieval_results if isinstance(item, dict)])

    tool_outputs = _normalize_contexts(state.values.get("tool_outputs") or [])

    if not question or not answer:
        raise NonScorableSessionError("Missing question or answer in session state")

    latest = (
        db.query(Evaluation)
        .filter(Evaluation.session_id == session_id)
        .order_by(Evaluation.created_at.desc())
        .first()
    )
    if latest:
        same_q = (latest.question or "").strip() == question
        same_a = (latest.answer or "").strip() == answer
        same_context = (latest.context or []) == contexts[:5]
        same_tools = (latest.tool_outputs or []) == tool_outputs
        if same_q and same_a and same_context and same_tools:
            logger.info(f"Returning cached evaluation for session {session_id}")
            return latest

    metrics = run_deepeval_evaluation(question, answer, contexts, tool_outputs)

    eval_record = Evaluation(
        session_id=session_id,
        question=question,
        answer=answer,
        context=contexts[:5],
        tool_outputs=tool_outputs,
        faithfulness=metrics.get("faithfulness"),
        answer_relevancy=metrics.get("answer_relevancy"),
        context_precision=metrics.get("context_precision"),
        metrics_json=metrics.get("metrics_json", metrics),
    )
    db.add(eval_record)
    db.commit()
    db.refresh(eval_record)
    return eval_record
