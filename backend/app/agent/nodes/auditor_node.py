import json

from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from loguru import logger

from app.agent.state import AgentState
from app.core.config import settings
from app.services.generation_service import build_context_string

auditor_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are an auditor that checks if an answer is fully supported by the provided context and tool outputs.
Output a strict JSON: {{"accept": true/false, "feedback": ""}}.
- Set "accept": true if the answer is fully supported, with no unsupported claims.
- Set "accept": false if the answer contains hallucinations, unsupported facts, or missing crucial information from the context.
- Write a short feedback for the generator to improve.""",
        ),
        (
            "user",
            """Question: {question}

Context: {context}

Tool outputs: {tool_outputs}

Answer: {answer}

Audit JSON:""",
        ),
    ]
)


def auditor_node(state: AgentState) -> AgentState:
    retries = state.get("retries", 0)
    if retries >= settings.AGENT_MAX_RETRIES:
        logger.info("Max retries reached, forcing accept")
        state["auditor_feedback"] = "Max retries"
        return state

    if not settings.GROQ_API_KEY:
        state["auditor_feedback"] = "Accepted"
        return state

    context_chunks = state.get("context") or []
    context_str = "\n".join(build_context_string(context_chunks))
    tool_str = "\n".join(state.get("tool_outputs") or [])

    prompt_input = {
        "question": state["question"],
        "context": context_str,
        "tool_outputs": tool_str,
        "answer": state.get("answer", ""),
    }

    model = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.LLM_MODEL,
        temperature=0,
        max_tokens=256,
    )

    try:
        msg = model.invoke(auditor_prompt.invoke(prompt_input))
        audit = json.loads(msg.content.strip())
    except Exception as exc:
        logger.error(f"Auditor parse error: {exc}, default accept")
        audit = {"accept": True, "feedback": "Parse error"}

    if audit.get("accept", True):
        state["auditor_feedback"] = "Accepted"
        return state

    state["retries"] = retries + 1
    state["auditor_feedback"] = audit.get("feedback", "Answer not fully supported")
    state["route"] = state.get("original_route", "rag")
    logger.info(
        f"Auditor rejected answer, retry {state['retries']}/{settings.AGENT_MAX_RETRIES}: {state['auditor_feedback']}"
    )
    return state
