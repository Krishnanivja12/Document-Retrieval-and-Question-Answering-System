from .web_search import web_search_tool
from .calculator import calculator_tool

tools = [web_search_tool, calculator_tool]
tool_by_name = {t.name: t for t in tools}
