from typing import List, AsyncGenerator, Optional
from groq import AsyncGroq
from loguru import logger
from app.core.config import settings

# System prompt template
SYSTEM_PROMPT = """You are a helpful, accurate assistant. Answer the question based solely on the provided context. 
If the context does not contain enough information to answer, say "I don't know." 
Always cite the source document if possible."""

USER_PROMPT_TEMPLATE = """Context:
{context}

Question: {question}
Answer:"""

_groq_client: AsyncGroq | None = None


def _get_groq_client() -> AsyncGroq:
    global _groq_client
    if _groq_client is None:
        _groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _groq_client

async def generate_answer(
    question: str,
    context_chunks: List[str],
    stream: bool = False,
    temperature: Optional[float] = None,
) -> AsyncGenerator[str, None]:
    """Generate answer via Groq, optionally streaming token by token."""
    if not settings.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not configured")

    client = _get_groq_client()
    context_text = "\n\n---\n\n".join(context_chunks)
    user_content = USER_PROMPT_TEMPLATE.format(context=context_text, question=question)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]

    # Call Groq
    kwargs = {
        "model": settings.LLM_MODEL,
        "messages": messages,
        "temperature": temperature if temperature is not None else settings.LLM_TEMPERATURE,
        "max_tokens": settings.LLM_MAX_TOKENS,
        "top_p": settings.LLM_TOP_P,
        "stream": stream,
    }

    if stream:
        completion = await client.chat.completions.create(**kwargs)
        async for chunk in completion:
            delta = chunk.choices[0].delta.content if chunk.choices else ""
            if delta:
                yield delta
    else:
        completion = await client.chat.completions.create(**kwargs)
        answer = completion.choices[0].message.content
        yield answer

def build_context_string(chunks: List[dict]) -> List[str]:
    """Transform retrieval results into text strings for the prompt."""
    contexts = []
    for chunk in chunks:
        src = chunk.get("document_id", "unknown")
        content = (chunk.get("content") or "").strip()
        if not content:
            continue
        contexts.append(f"[Doc {src}] {content}")
    return contexts
