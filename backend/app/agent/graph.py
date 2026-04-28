from pathlib import Path
from contextlib import asynccontextmanager, contextmanager

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langgraph.graph import END, StateGraph

from app.agent.nodes.auditor_node import auditor_node
from app.agent.nodes.generator_node import generator_node
from app.agent.nodes.retriever_node import retriever_node
from app.agent.nodes.router import router_node
from app.agent.nodes.tool_node import tool_node
from app.agent.state import AgentState
from app.core.config import settings

builder = StateGraph(AgentState)

builder.add_node("router", router_node)
builder.add_node("retrieve", retriever_node)
builder.add_node("tool_executor", tool_node)
builder.add_node("generate", generator_node)
builder.add_node("auditor", auditor_node)

builder.set_entry_point("router")


def route_decision(state: AgentState) -> str:
    route = state.get("route", "rag")
    if route == "rag":
        return "retrieve"
    if route in ["web_search", "calculator"]:
        return "tool_executor"
    return "retrieve"


builder.add_conditional_edges(
    "router",
    route_decision,
    {"retrieve": "retrieve", "tool_executor": "tool_executor"},
)

builder.add_edge("retrieve", "generate")
builder.add_edge("tool_executor", "generate")
builder.add_edge("generate", "auditor")


def auditor_decision(state: AgentState) -> str:
    feedback = state.get("auditor_feedback", "")
    retries = state.get("retries", 0)
    if feedback == "Accepted" or retries >= settings.AGENT_MAX_RETRIES:
        return "end"

    orig_route = state.get("original_route", "rag")
    if orig_route == "rag":
        return "retrieve"
    if orig_route in ["web_search", "calculator"]:
        return "tool_executor"
    return "retrieve"


builder.add_conditional_edges(
    "auditor",
    auditor_decision,
    {
        "retrieve": "retrieve",
        "tool_executor": "tool_executor",
        "end": END,
    },
)

checkpoint_db_path = settings.AGENT_CHECKPOINT_DB.replace("sqlite:///", "")
Path(checkpoint_db_path).parent.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def compile_agent_graph():
    async with AsyncSqliteSaver.from_conn_string(checkpoint_db_path) as checkpointer:
        yield builder.compile(checkpointer=checkpointer)


@contextmanager
def compile_agent_graph_sync():
    with SqliteSaver.from_conn_string(checkpoint_db_path) as checkpointer:
        yield builder.compile(checkpointer=checkpointer)
