import os
import json
import numpy as np
import faiss
from loguru import logger
from app.core.config import settings

class VectorStoreService:
    def __init__(self):
        self.index = None
        self.mapping_data = []
        self.index_path = settings.FAISS_INDEX_PATH
        self.metadata_path = settings.FAISS_MAPPING_PATH

    def _create_index(self, dimension: int | None = None):
        """Create a new FAISS index."""
        try:
            dim = dimension or settings.EMBEDDING_DIM
            # Use simple flat index without ID mapping first
            self.index = faiss.IndexFlatL2(dim)
            logger.info(f"Created new FAISS index with dimension {dim}")
        except Exception as e:
            logger.error(f"Failed to create FAISS index: {e}", exc_info=True)
            raise

    def load_or_create(self):
        """Load existing index or create new one."""
        if os.path.isdir(self.index_path):
            self.index_path = os.path.join(self.index_path, "index.faiss")
            logger.warning(f"FAISS_INDEX_PATH pointed to a directory. Using file path: {self.index_path}")

        if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
            try:
                self.index = faiss.read_index(self.index_path)
                with open(self.metadata_path, "r") as f:
                    self.mapping_data = json.load(f)
                logger.info(f"Loaded FAISS index with {self.index.ntotal} vectors")
            except Exception as e:
                logger.error(f"Failed to load index: {e}, creating new one")
                self._create_index()
                self.mapping_data = []
        else:
            self._create_index()
            self.mapping_data = []

    def save(self):
        """Save index and metadata to disk."""
        if self.index is not None:
            try:
                os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
                os.makedirs(os.path.dirname(self.metadata_path), exist_ok=True)
                
                faiss.write_index(self.index, self.index_path)
                with open(self.metadata_path, "w") as f:
                    json.dump(self.mapping_data, f)
                logger.info(f"Saved index ({self.index.ntotal} vectors)")
            except Exception as e:
                logger.error(f"Failed to save index: {e}", exc_info=True)
                raise

    def add_embeddings(self, chunk_ids: list[int], embeddings: list[list[float]],
                       metadatas: list[dict] = None):
        """Add embeddings to the index."""
        if self.index is None:
            self.load_or_create()

        if not embeddings or not chunk_ids:
            logger.warning("No embeddings or chunk_ids provided")
            return

        try:
            # Convert to numpy array
            vectors = np.array(embeddings, dtype=np.float32)
            logger.info(f"Converted {len(vectors)} embeddings to numpy array")
            
            # Validate shape
            if vectors.ndim != 2:
                raise ValueError(f"Embeddings must be 2D, got {vectors.ndim}D")
            
            logger.info(f"Embeddings shape: {vectors.shape}")
            
            # Check for NaN/inf
            nan_count = np.isnan(vectors).sum()
            inf_count = np.isinf(vectors).sum()
            if nan_count > 0 or inf_count > 0:
                logger.warning(f"Found {nan_count} NaN and {inf_count} inf values, replacing")
                vectors = np.nan_to_num(vectors, nan=0.0, posinf=0.0, neginf=0.0)
            
            # Verify dimension
            vector_dim = int(vectors.shape[1])
            if self.index is None:
                self._create_index(vector_dim)
            elif self.index.d != vector_dim:
                if self.index.ntotal == 0:
                    logger.warning(
                        f"Recreating empty FAISS index with dimension {vector_dim} (was {self.index.d})"
                    )
                    self._create_index(vector_dim)
                else:
                    raise ValueError(
                        f"Dimension mismatch: vector dim {vector_dim} vs index dim {self.index.d}"
                    )
            
            # Verify counts match
            if len(vectors) != len(chunk_ids):
                raise ValueError(f"Count mismatch: {len(vectors)} vectors vs {len(chunk_ids)} IDs")
            
            # Normalize vectors
            logger.info("Normalizing vectors...")
            faiss.normalize_L2(vectors)
            
            # Add to index
            logger.info(f"Adding {len(vectors)} vectors to FAISS index...")
            self.index.add(vectors)
            logger.info(f"Successfully added {len(vectors)} vectors")
            
            # Update metadata
            if metadatas is None:
                metadatas = [{} for _ in chunk_ids]
            
            for cid, meta in zip(chunk_ids, metadatas):
                self.mapping_data.append({"chunk_id": cid, "metadata": meta})
            
            logger.info(f"Updated metadata, total vectors: {self.index.ntotal}")
            self.save()
            
        except Exception as e:
            logger.error(f"Failed to add embeddings: {e}", exc_info=True)
            raise

    def search(self, query_embedding: list[float], top_k: int = 5,
               metadata_filter: dict = None) -> list[dict]:
        """Search the index."""
        if self.index is None or self.index.ntotal == 0:
            return []

        try:
            query_np = np.array([query_embedding], dtype=np.float32)
            faiss.normalize_L2(query_np)
            
            fetch_k = min(top_k * 4, self.index.ntotal) if metadata_filter else min(top_k, self.index.ntotal)
            distances, indices = self.index.search(query_np, fetch_k)

            results = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx == -1 or idx >= len(self.mapping_data):
                    continue
                entry = self.mapping_data[idx]
                
                if metadata_filter:
                    meta = entry["metadata"]
                    match = True
                    for k, v in metadata_filter.items():
                        if meta.get(k) != v:
                            match = False
                            break
                    if not match:
                        continue
                
                results.append({
                    "chunk_id": entry["chunk_id"],
                    "score": float(dist),
                    "metadata": entry["metadata"],
                })
            
            results.sort(key=lambda x: x["score"])
            return results[:top_k]
        except Exception as e:
            logger.error(f"Search failed: {e}", exc_info=True)
            return []

    def get_total_vectors(self):
        """Get total vectors."""
        return self.index.ntotal if self.index else 0

# Singleton
vector_store_service = VectorStoreService()
