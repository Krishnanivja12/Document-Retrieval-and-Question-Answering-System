from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from loguru import logger

from app.agent.state import AgentState
from app.core.config import settings

router_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are a router that decides how to answer a question. Choose exactly one tool: 'rag', 'web_search', or 'calculator'.
- Choose 'rag' if the answer likely exists in internal documents (general knowledge, uploaded files).
- Choose 'web_search' if the question is about current events or requires recent data.
- Choose 'calculator' if the question is a pure math expression.
Reply ONLY with the tool name, nothing else.""",
        ),
        ("user", "{question}"),
    ]
)


def _resolve_route_with_llm(question: str) -> str:
    if not settings.GROQ_API_KEY:
        return "rag"

    model = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.LLM_MODEL,
        temperature=0,
    )
    chain = router_prompt | model
    result = chain.invoke({"question": question})
    return result.content.strip().lower()


def router_node(state: AgentState) -> AgentState:
    route = _resolve_route_with_llm(state["question"])
    if route not in ["rag", "web_search", "calculator"]:
        logger.warning(f"Router returned unexpected: {route}, defaulting to rag")
        route = "rag"

    state["route"] = route
    state["original_route"] = route
    state["retries"] = state.get("retries", 0)
    return state
