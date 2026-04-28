from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from loguru import logger

# Custom exception base
class AppException(Exception):
    def __init__(self, detail: str, status_code: int = 500):
        self.detail = detail
        self.status_code = status_code

class DocumentProcessingError(AppException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, status_code=422)

class RetrievalError(AppException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, status_code=500)

class LLMError(AppException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, status_code=502)

class ConfigurationError(AppException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, status_code=500)


def register_exception_handlers(app: FastAPI):
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        logger.error(f"AppException: {exc.detail}", exc_info=True)
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "type": type(exc).__name__},
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "type": type(exc).__name__},
        )
