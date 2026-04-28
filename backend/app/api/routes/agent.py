import json
import uuid
from typing import Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from loguru import logger
from app.agent.graph import compile_agent_graph
from app.agent.state import AgentState

router = APIRouter(prefix="/api/v1/agent", tags=["agent"])

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = None  # if not provided, create new

async def stream_agent_response(question: str, session_id: str):
    """Generator that yields SSE events during agent execution and then the answer tokens."""
    config = {"configurable": {"thread_id": session_id}}
    inputs: AgentState = {
        "question": question,
        "messages": [],
        "session_id": session_id,
    }
    
    final_answer = ""
    final_context = []
    
    try:
        # First event: Send session ID
        yield f"data: {json.dumps({'session_id': session_id, 'type': 'session'})}\n\n"
        
        async with compile_agent_graph() as agent_graph:
            # Stream graph execution
            async for event in agent_graph.astream(inputs, config, stream_mode="updates"):
                node_name = list(event.keys())[0]
                yield f"data: {json.dumps({'event': 'node_complete', 'node': node_name})}\n\n"

            # After graph finishes, retrieve the final state to get the answer
            final_state = await agent_graph.aget_state(config)
            if final_state and final_state.values:
                final_answer = final_state.values.get("answer", "")
                final_context = final_state.values.get("context", [])
                
                if final_answer:
                    # Stream answer word by word
                    words = final_answer.split()
                    for word in words:
                        yield f"data: {json.dumps({'token': word + ' '})}\n\n"
                    
                    # Chat complete - evaluation is done separately on Evaluation Page
                    logger.info(f"✓ Chat completed for session {session_id}")
                    yield "data: [DONE]\n\n"
                else:
                    yield f"data: {json.dumps({'error': 'No answer generated.'})}\n\n"
            else:
                yield f"data: {json.dumps({'error': 'Agent failed to produce answer.'})}\n\n"
    except Exception as e:
        logger.error(f"Agent stream error: {e}", exc_info=True)
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

@router.post("/chat")
async def agent_chat(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())
    return StreamingResponse(
        stream_agent_response(request.question, session_id),
        media_type="text/event-stream",
        headers={"X-Session-Id": session_id}
    )
