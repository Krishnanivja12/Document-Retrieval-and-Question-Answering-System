from pathlib import Path
from typing import Optional

from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ENV_FILE = (Path(__file__).resolve().parents[2] / ".env").resolve()


class Settings(BaseSettings):
    BASE_DIR: Path = Path(__file__).resolve().parents[2]
    HOST: str = "127.0.0.1"
    PORT: int = 8001
    ENV: str = "development"
    DEBUG: bool = True

    # LLM Configuration
    GROQ_API_KEY: Optional[str] = Field(default=None, validation_alias="GROQ_API_KEY")
    OPENAI_API_KEY: Optional[str] = Field(default=None, validation_alias="OPENAI_API_KEY")
    COHERE_API_KEY: Optional[str] = Field(default=None, validation_alias="COHERE_API_KEY")
    LLM_MODEL: str = "llama-3.1-8b-instant"
    EVALUATION_MODEL: str = "c4ai-aya-expanse-32b"
    LLM_TEMPERATURE: float = 0.0
    LLM_MAX_TOKENS: int = 1024
    LLM_TOP_P: float = 0.95
    SQL_ECHO: bool = False
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Embedding Configuration
    EMBEDDING_MODEL_NAME: str = Field(
        default="all-MiniLM-L6-v2",
        validation_alias=AliasChoices("EMBEDDING_MODEL_NAME", "EMBEDDING_MODEL"),
    )
    EMBEDDING_DIM: int = 384
    EMBEDDING_BATCH_SIZE: int = 32

    # Chunking Configuration
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    TOKEN_ENCODING: str = "cl100k_base"

    # Retrieval
    RETRIEVAL_TOP_K: int = 5
    RRF_K: int = 60
    SEARCH_FETCH_MULTIPLIER: int = 3
    EVAL_RECOVERY_TOP_K: int = 3

    # Evaluation performance controls
    EVAL_CONTEXT_MAX_ITEMS: int = 6
    EVAL_CONTEXT_MAX_CHARS_PER_ITEM: int = 1200

    # Database & Storage
    FAISS_INDEX_PATH: str = "data/faiss/index.faiss"
    FAISS_MAPPING_PATH: str = "data/faiss/index_mapping.json"
    METADATA_DB_URL: str = "sqlite:///./data/metadata.db"
    CHECKPOINT_DB_URL: str = "sqlite:///./data/checkpoints.db"
    AGENT_CHECKPOINT_DB: str = "sqlite:///./data/agent_checkpoints.db"
    AGENT_MAX_RETRIES: int = 3

    # External APIs
    TAVILY_API_KEY: Optional[str] = None
    TAVILY_MAX_RESULTS: int = 3

    # Feature Flags
    DEEPEVAL_ENABLED: bool = False

    # Upload Limits
    MAX_UPLOAD_SIZE_MB: int = 50

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value):
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {"1", "true", "yes", "on", "debug", "development", "dev"}:
                return True
            if lowered in {"0", "false", "no", "off", "release", "production", "prod"}:
                return False
        return value

    @field_validator("GROQ_API_KEY", "OPENAI_API_KEY", "COHERE_API_KEY", mode="before")
    @classmethod
    def normalize_api_key(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            cleaned = value.strip()
            return cleaned or None
        return value

    @field_validator("FAISS_INDEX_PATH", "FAISS_MAPPING_PATH", mode="before")
    @classmethod
    def resolve_storage_paths(cls, value):
        if not value:
            return value
        path = Path(str(value))
        if path.is_absolute():
            return str(path)
        return str((Path(__file__).resolve().parents[2] / path).resolve())

    @field_validator("METADATA_DB_URL", "CHECKPOINT_DB_URL", "AGENT_CHECKPOINT_DB", mode="before")
    @classmethod
    def resolve_sqlite_urls(cls, value):
        if not value or not isinstance(value, str):
            return value
        sqlite_prefix = "sqlite:///"
        if not value.startswith(sqlite_prefix):
            return value
        raw_path = value[len(sqlite_prefix):]
        path = Path(raw_path)
        if path.is_absolute():
            return value
        abs_path = (Path(__file__).resolve().parents[2] / path).resolve()
        return f"{sqlite_prefix}{abs_path.as_posix()}"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def normalize_embedding_config(self):
        # This codebase uses local sentence-transformers models.
        # If an OpenAI embedding model name is provided via legacy env vars, fall back safely.
        if self.EMBEDDING_MODEL_NAME.startswith("text-embedding-"):
            self.EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
            self.EMBEDDING_DIM = 384
        elif self.EMBEDDING_MODEL_NAME == "all-MiniLM-L6-v2" and self.EMBEDDING_DIM != 384:
            self.EMBEDDING_DIM = 384
        return self


settings = Settings()
