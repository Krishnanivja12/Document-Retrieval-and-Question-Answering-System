from typing import TypedDict, Annotated, Sequence, Optional, Any
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    question: str
    messages: Annotated[list, add_messages]
    route: Optional[str]
    original_route: Optional[str]        # preserved for retries
    context: Optional[list[dict]]
    tool_outputs: Optional[list[str]]
    answer: Optional[str]
    session_id: str
    retries: int                         # number of retry attempts
    auditor_feedback: Optional[str]      # why the answer was rejected                       # for checkpointing
