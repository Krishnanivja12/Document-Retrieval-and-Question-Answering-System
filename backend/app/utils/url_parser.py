import httpx
from bs4 import BeautifulSoup
from loguru import logger
from app.core.errors import AppException

async def fetch_text_from_url(url: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text
    except httpx.HTTPStatusError as e:
        raise AppException(detail=f"URL returned status {e.response.status_code}", status_code=400)
    except Exception as e:
        raise AppException(detail=f"Failed to fetch URL: {str(e)}", status_code=400)

    # Extract text with BeautifulSoup
    soup = BeautifulSoup(html, "html.parser")
    # Remove script and style elements
    for tag in soup(["script", "style"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    if not text.strip():
        raise AppException(detail="No text content found at URL", status_code=400)
    logger.info(f"Extracted {len(text)} chars from {url}")
    return text
