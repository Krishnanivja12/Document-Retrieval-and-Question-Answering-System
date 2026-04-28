import heapq
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from rank_bm25 import BM25Okapi
from loguru import logger
from app.core.config import settings
from app.models.chunk import Chunk
from app.services.embedding_service import embedding_service
from app.services.vector_store_service import vector_store_service

# Global BM25 index (built once on startup)
bm25_index: Optional[BM25Okapi] = None
bm25_chunks: List[Dict] = []   # list of {id, tokens, metadata} for mapping

def tokenize(text: str) -> List[str]:
    """Simple whitespace + punctuation tokenization for BM25."""
    import re
    return re.findall(r'\w+', text.lower())

def build_bm25_index(db: Session):
    """Rebuild the BM25 index from all indexed chunks."""
    global bm25_index, bm25_chunks
    chunks = db.query(Chunk).filter(Chunk.indexed == 1).all()
    if not chunks:
        logger.warning("No indexed chunks to build BM25 index")
        bm25_index = None
        bm25_chunks = []
        return
    tokenized_corpus = []
    bm25_chunks = []
    for chunk in chunks:
        tokens = tokenize(chunk.content)
        tokenized_corpus.append(tokens)
        bm25_chunks.append({
            "id": chunk.id,
            "tokens": tokens,
            "metadata": chunk.metadata_json or {},
            "content": chunk.content,
        })
    bm25_index = BM25Okapi(tokenized_corpus)
    logger.info(f"BM25 index built with {len(bm25_chunks)} documents")

def dense_search(query_embedding: List[float], top_k: int,
                 metadata_filter: Optional[Dict] = None) -> List[Dict]:
    """Returns list of {chunk_id, score, metadata} from FAISS."""
    return vector_store_service.search(query_embedding, top_k, metadata_filter)

def sparse_search(query: str, top_k: int,
                  metadata_filter: Optional[Dict] = None) -> List[Dict]:
    """BM25 keyword search, returns list of {chunk_id, score, metadata}."""
    global bm25_index, bm25_chunks
    if not bm25_index:
        return []
    tokens = tokenize(query)
    scores = bm25_index.get_scores(tokens)
    if len(scores) == 0:
        return []
    # Avoid full O(n log n) sort for large corpora.
    indexed_scores = heapq.nlargest(top_k * 2, enumerate(scores), key=lambda x: x[1])
    results = []
    for idx, score in indexed_scores:
        if score <= 0:
            continue
        chunk_entry = bm25_chunks[idx]
        # Apply metadata filter
        if metadata_filter:
            meta = chunk_entry["metadata"]
            match = True
            for k, v in metadata_filter.items():
                if meta.get(k) != v:
                    match = False
                    break
            if not match:
                continue
        results.append({
            "chunk_id": chunk_entry["id"],
            "score": float(score),
            "metadata": chunk_entry["metadata"],
        })
        if len(results) >= top_k:
            break
    return results[:top_k]

def reciprocal_rank_fusion(results_a: List[Dict], results_b: List[Dict],
                           k: int = 60) -> List[Dict]:
    """
    Merge two ranked lists using RRF.
    Each dict must have 'chunk_id' and 'score' (original scores ignored, only ranks used).
    Returns list of {chunk_id, rrf_score}.
    """
    rrf_scores = {}
    # Process list A
    for rank, item in enumerate(results_a, start=1):
        chunk_id = item["chunk_id"]
        rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0) + 1.0 / (k + rank)
    # Process list B
    for rank, item in enumerate(results_b, start=1):
        chunk_id = item["chunk_id"]
        rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0) + 1.0 / (k + rank)
    # Sort by RRF score descending
    combined = [{"chunk_id": cid, "score": score} for cid, score in rrf_scores.items()]
    combined.sort(key=lambda x: x["score"], reverse=True)
    return combined

def hybrid_search(query: str, top_k: int = None,
                  filters: Optional[Dict] = None,
                  db: Optional[Session] = None) -> List[Dict]:
    """
    Orchestrates hybrid search. Returns list of chunk dicts with content and metadata.
    """
    if top_k is None:
        top_k = settings.RETRIEVAL_TOP_K
    fetch_k = max(top_k, top_k * settings.SEARCH_FETCH_MULTIPLIER)

    # Dense
    query_embedding = embedding_service.embed_query(query)
    dense_results = dense_search(query_embedding, fetch_k, filters)

    # Sparse
    sparse_results = sparse_search(query, fetch_k, filters)
    if not dense_results and not sparse_results:
        return []

    # Merge
    fused = reciprocal_rank_fusion(dense_results, sparse_results, k=settings.RRF_K)
    fused_top = fused[:top_k]

    # Load chunk content from DB if db session provided
    if db and fused_top:
        chunk_ids = [item["chunk_id"] for item in fused_top]
        chunks = db.query(Chunk).filter(Chunk.id.in_(chunk_ids)).all()
        chunk_map = {c.id: c for c in chunks}
        for item in fused_top:
            chunk = chunk_map.get(item["chunk_id"])
            if chunk:
                item["content"] = chunk.content
                item["metadata"] = chunk.metadata_json
                item["document_id"] = chunk.document_id
            else:
                item["content"] = None
    return fused_top
