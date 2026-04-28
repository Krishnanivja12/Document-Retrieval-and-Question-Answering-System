import numexpr
from langchain_core.tools import StructuredTool

def evaluate_math(expression: str) -> str:
    """Evaluate a mathematical expression safely using numexpr."""
    try:
        result = numexpr.evaluate(expression).item()
        return f"Result: {result}"
    except Exception as e:
        return f"Error evaluating expression: {str(e)}"

calculator_tool = StructuredTool.from_function(
    func=evaluate_math,
    name="calculator",
    description="Perform mathematical calculations. Input should be a valid arithmetic expression (e.g., '2+2', 'sqrt(16)')."
)
