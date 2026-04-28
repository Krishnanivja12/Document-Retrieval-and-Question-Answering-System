from langchain_core.tools import StructuredTool
from tavily import TavilyClient
from app.core.config import settings

def web_search(query: str) -> str:
    """Search the web for current information."""
    if not settings.TAVILY_API_KEY:
        return "Error: TAVILY_API_KEY not configured."
    client = TavilyClient(api_key=settings.TAVILY_API_KEY)
    try:
        response = client.search(query=query, max_results=settings.TAVILY_MAX_RESULTS)
        results = response.get("results", [])
        if not results:
            return "No results found."
        return "\n\n".join([f"Source: {r['url']}\n{r['content']}" for r in results])
    except Exception as e:
        return f"Web search error: {str(e)}"

web_search_tool = StructuredTool.from_function(
    func=web_search,
    name="web_search",
    description="Search the internet for recent information. Input should be a search query string."
)
