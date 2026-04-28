from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from app.agent.state import AgentState
from app.core.config import settings
from app.services.generation_service import build_context_string

generator_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            'You are a helpful AI assistant. Answer the question using the provided context and tool outputs. If the answer is not found, say "I don\'t know". Cite sources when possible.',
        ),
        (
            "user",
            """Context: {context}

Tool outputs: {tool_outputs}

Question: {question}

Answer:""",
        ),
    ]
)


def generator_node(state: AgentState) -> AgentState:
    context_chunks = state.get("context") or []
    context_str = "\n".join(build_context_string(context_chunks))
    tool_outputs = state.get("tool_outputs") or []
    tool_str = "\n".join(tool_outputs)

    feedback = state.get("auditor_feedback")
    if feedback and feedback != "Accepted":
        context_str = f"[Previous attempt failed: {feedback}]\n{context_str}"

    if not settings.GROQ_API_KEY:
        state["answer"] = "GROQ_API_KEY is not configured. Please set it to enable answer generation."
        return state

    prompt_value = generator_prompt.invoke(
        {
            "context": context_str,
            "tool_outputs": tool_str,
            "question": state["question"],
        }
    )

    model = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.LLM_MODEL,
        temperature=settings.LLM_TEMPERATURE,
        max_tokens=settings.LLM_MAX_TOKENS,
    )
    response = model.invoke(prompt_value)
    state["answer"] = response.content
    return state
