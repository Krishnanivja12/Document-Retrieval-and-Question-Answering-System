from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.chunk import Chunk
from app.services.embedding_service import embedding_service
from app.services.vector_store_service import vector_store_service
from loguru import logger
from app.services.retrieval_service import build_bm25_index
import os
import shutil

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

@router.post("/index/build")
async def build_index(db: Session = Depends(get_db)):
    """Embed all unindexed chunks and add them to FAISS."""
    try:
        chunks = db.query(Chunk).filter(Chunk.indexed == 0).all()
        if not chunks:
            logger.info("No new chunks to index")
            return {"message": "No new chunks to index", "indexed_count": 0}
        
        logger.info(f"Starting to index {len(chunks)} chunks")
        
        chunk_ids = []
        texts = []
        metadatas = []
        
        for chunk in chunks:
            # Skip empty chunks
            if not chunk.content or not chunk.content.strip():
                logger.warning(f"Skipping empty chunk {chunk.id}")
                continue
            
            texts.append(chunk.content)
            chunk_ids.append(chunk.id)
            
            # Build metadata dict from chunk
            meta = {}
            if chunk.metadata_json:
                meta.update(chunk.metadata_json)
            # Also include document_id for filtering
            meta["document_id"] = chunk.document_id
            metadatas.append(meta)
        
        if not texts:
            logger.warning("No valid chunks to index after filtering")
            return {"message": "No valid chunks to index", "indexed_count": 0}
        
        logger.info(f"Generating embeddings for {len(texts)} chunks")
        
        # Generate embeddings in batches
        try:
            all_embeddings = embedding_service.embed_documents(texts)
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")
        
        if not all_embeddings:
            logger.error("No embeddings generated")
            raise HTTPException(status_code=500, detail="No embeddings generated")
        
        logger.info(f"Generated {len(all_embeddings)} embeddings")
        
        # Validate embeddings before adding to FAISS
        import numpy as np
        try:
            embeddings_array = np.array(all_embeddings, dtype=np.float32)
            logger.info(f"Embeddings shape: {embeddings_array.shape}")
            logger.info(f"Embeddings dtype: {embeddings_array.dtype}")
            logger.info(f"Embeddings min: {embeddings_array.min()}, max: {embeddings_array.max()}")
            logger.info(f"Embeddings sample: {embeddings_array[0][:5]}")  # First 5 values of first embedding
        except Exception as e:
            logger.error(f"Failed to validate embeddings: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Embedding validation failed: {str(e)}")
        
        # Add to FAISS
        try:
            logger.info(f"About to add {len(chunk_ids)} embeddings to vector store")
            vector_store_service.add_embeddings(chunk_ids, all_embeddings, metadatas)
            logger.info("Successfully added embeddings to vector store")
        except Exception as e:
            logger.error(f"Failed to add embeddings to vector store: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Vector store update failed: {str(e)}")
        
        # Mark only successfully processed chunks as indexed
        for chunk in chunks:
            if chunk.id in chunk_ids:
                chunk.indexed = 1
        db.commit()

        # After commit
        build_bm25_index(db)
        logger.info("BM25 index updated after build")
        logger.info(f"Successfully indexed {len(chunk_ids)} chunks")
        return {"message": f"Indexed {len(chunk_ids)} chunks", "indexed_count": len(chunk_ids)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Index build failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/reset-db")
async def reset_database(db: Session = Depends(get_db)):
    """
    Reset the entire database:
    - Delete FAISS index files
    - Clear metadata
    - Reset all chunks to unindexed
    - Clear chat history
    """
    try:
        logger.info("Starting database reset...")
        
        # 1. Delete FAISS index files
        from app.core.config import settings
        
        faiss_index_path = settings.FAISS_INDEX_PATH
        faiss_mapping_path = settings.FAISS_MAPPING_PATH
        
        # Handle directory paths
        if os.path.isdir(faiss_index_path):
            faiss_index_path = os.path.join(faiss_index_path, "index.faiss")
        
        deleted_vectors = 0
        if os.path.exists(faiss_index_path):
            try:
                os.remove(faiss_index_path)
                logger.info(f"Deleted FAISS index: {faiss_index_path}")
            except Exception as e:
                logger.error(f"Failed to delete FAISS index: {e}")
        
        if os.path.exists(faiss_mapping_path):
            try:
                os.remove(faiss_mapping_path)
                logger.info(f"Deleted FAISS mapping: {faiss_mapping_path}")
            except Exception as e:
                logger.error(f"Failed to delete FAISS mapping: {e}")
        
        # 2. Reset vector store service
        deleted_vectors = vector_store_service.get_total_vectors()
        vector_store_service.index = None
        vector_store_service.mapping_data = []
        logger.info(f"Reset vector store service (was {deleted_vectors} vectors)")
        
        # 3. Reset all chunks to unindexed
        chunks_count = db.query(Chunk).count()
        db.query(Chunk).update({"indexed": 0})
        db.commit()
        logger.info(f"Reset {chunks_count} chunks to unindexed")
        
        # 4. Clear evaluation records
        from app.models.evaluation import Evaluation
        evals_count = db.query(Evaluation).count()
        db.query(Evaluation).delete()
        db.commit()
        logger.info(f"Cleared {evals_count} evaluation records")
        
        # 5. Rebuild BM25 index (empty)
        build_bm25_index(db)
        logger.info("Rebuilt empty BM25 index")
        
        logger.info("Database reset completed successfully")
        
        return {
            "status": "success",
            "message": "Database reset complete",
            "cleared": {
                "faiss_vectors": deleted_vectors,
                "chunks": chunks_count,
                "evaluations": evals_count,
            }
        }
    
    except Exception as e:
        logger.error(f"Database reset failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")
