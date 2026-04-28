import hashlib
import re

from loguru import logger
from sentence_transformers import SentenceTransformer

from app.core.config import settings


class EmbeddingService:
    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL_NAME
        self.model: SentenceTransformer | None = None
        self.embedding_dim = settings.EMBEDDING_DIM
        self._fallback_mode = False

    def _hash_embed(self, text: str) -> list[float]:
        """Offline-safe deterministic embedding fallback."""
        dim = self.embedding_dim
        vec = [0.0] * dim
        tokens = re.findall(r"\w+", text.lower())
        if not tokens:
            return vec

        for token in tokens:
            digest = hashlib.sha1(token.encode("utf-8")).digest()
            idx = int.from_bytes(digest[:4], "big") % dim
            sign = 1.0 if (digest[4] & 1) == 0 else -1.0
            vec[idx] += sign

        norm = sum(v * v for v in vec) ** 0.5
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec

    def _ensure_model(self) -> SentenceTransformer | None:
        if self.model is None and not self._fallback_mode:
            try:
                self.model = SentenceTransformer(self.model_name)
                dim = self.model.get_sentence_embedding_dimension()
                if dim:
                    self.embedding_dim = dim
                logger.info(f"Loaded embedding model: {self.model_name} ({self.embedding_dim}D)")
            except Exception as e:
                self._fallback_mode = True
                logger.warning(
                    f"Falling back to local hash embeddings because model load failed: {e}"
                )
        return self.model

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        
        model = self._ensure_model()
        
        # Filter out empty texts
        valid_texts = [t for t in texts if t and t.strip()]
        if not valid_texts:
            logger.warning("All texts are empty")
            return []
        
        try:
            if model is None:
                result = [self._hash_embed(t) for t in valid_texts]
                logger.info(
                    f"Generated {len(result)} fallback embeddings with dimension {self.embedding_dim}"
                )
                return result

            # Don't normalize here - let FAISS handle it
            embeddings = model.encode(
                valid_texts,
                batch_size=settings.EMBEDDING_BATCH_SIZE,
                show_progress_bar=False,
                normalize_embeddings=False,  # Changed to False
            )
            
            # Validate embeddings
            if embeddings is None or len(embeddings) == 0:
                logger.error("Model returned empty embeddings")
                return []
            
            result = embeddings.tolist()
            logger.info(f"Generated {len(result)} embeddings with dimension {len(result[0]) if result else 0}")
            return result
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}", exc_info=True)
            raise

    def embed_query(self, query: str) -> list[float]:
        if not query or not query.strip():
            logger.warning("Empty query provided")
            return [0.0] * self.embedding_dim
        
        model = self._ensure_model()
        try:
            if model is None:
                result = self._hash_embed(query)
                logger.info(f"Generated fallback query embedding with dimension {len(result)}")
                return result

            # Don't normalize here - let FAISS handle it
            result = model.encode([query], normalize_embeddings=False)[0].tolist()  # Changed to False
            logger.info(f"Generated query embedding with dimension {len(result)}")
            return result
        except Exception as e:
            logger.error(f"Failed to generate query embedding: {e}", exc_info=True)
            raise


embedding_service = EmbeddingService()
