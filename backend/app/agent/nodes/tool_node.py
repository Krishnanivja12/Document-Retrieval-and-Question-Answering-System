from app.agent.state import AgentState
from app.agent.tools import tool_by_name
from langchain_core.messages import HumanMessage, AIMessage
from loguru import logger

def tool_node(state: AgentState) -> AgentState:
    route = state.get("route", "rag")
    if route == "web_search":
        tool = tool_by_name["web_search"]
        query = state["question"]
        output = tool.invoke(query)
    elif route == "calculator":
        tool = tool_by_name["calculator"]
        # Extract expression; assume the question is the expression
        # For better usability, we could ask LLM to extract expression, but keep simple
        expression = state["question"].replace(" ", "")
        output = tool.invoke(expression)
    else:
        output = ""
    state["tool_outputs"] = [output] if output else []
    return state
