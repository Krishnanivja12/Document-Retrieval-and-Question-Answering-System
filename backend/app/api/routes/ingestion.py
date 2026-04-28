from fastapi import APIRouter, UploadFile, File, Depends, Form, HTTPException, Request, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.api.deps import get_db
from app.services.document_service import process_file, process_url
from app.core.errors import AppException
from app.core.middleware import limiter
from app.models.document import Document
from app.models.chunk import Chunk
from app.services.embedding_service import embedding_service
from app.services.vector_store_service import vector_store_service
from app.services.retrieval_service import build_bm25_index
from loguru import logger
import os


router = APIRouter(prefix="/api/v1/ingest", tags=["ingestion"])


class UrlIngestRequest(BaseModel):
    url: str


def _rebuild_indexes_after_delete(db: Session):
    """Keep FAISS and BM25 in sync with chunk table after document deletion."""
    indexed_chunks = db.query(Chunk).filter(Chunk.indexed == 1).all()

    # Reset in-memory vector store and on-disk files.
    if vector_store_service.index_path and os.path.isfile(vector_store_service.index_path):
        os.remove(vector_store_service.index_path)
    if vector_store_service.metadata_path and os.path.isfile(vector_store_service.metadata_path):
        os.remove(vector_store_service.metadata_path)

    vector_store_service.index = None
    vector_store_service.mapping_data = []
    vector_store_service.load_or_create()

    if indexed_chunks:
        chunk_ids = []
        texts = []
        metadatas = []
        for chunk in indexed_chunks:
            content = (chunk.content or "").strip()
            if not content:
                continue
            chunk_ids.append(chunk.id)
            texts.append(content)
            metadata = dict(chunk.metadata_json or {})
            metadata["document_id"] = chunk.document_id
            metadatas.append(metadata)

        if texts:
            embeddings = embedding_service.embed_documents(texts)
            vector_store_service.add_embeddings(chunk_ids, embeddings, metadatas)

    build_bm25_index(db)


@router.post("/file", status_code=201)
@limiter.limit("5/minute")
async def ingest_file(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        doc = await process_file(file, db)
        return {
            "id": doc.id,
            "filename": doc.filename,
            "status": "ingested",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.post("/url", status_code=201)
async def ingest_url(
    url_form: str | None = Form(default=None, description="Web page URL to ingest"),
    payload: UrlIngestRequest | None = Body(default=None),
    db: Session = Depends(get_db),
):
    try:
        url = payload.url if payload and payload.url else url_form
        if not url:
            raise HTTPException(status_code=422, detail="URL is required")
        doc = await process_url(url, db)
        return {
            "id": doc.id,
            "filename": doc.filename,
            "status": "ingested",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.delete("/document/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete a document and all its associated chunks and files.
    """
    try:
        # Find the document
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        logger.info(f"Deleting document {document_id}: {document.filename}")
        
        # Delete associated chunks
        chunks_deleted = db.query(Chunk).filter(Chunk.document_id == document_id).delete()
        logger.info(f"Deleted {chunks_deleted} chunks for document {document_id}")
        
        # Delete physical files
        files_deleted = []
        
        # Delete text file
        if document.text_path and os.path.exists(document.text_path):
            try:
                os.remove(document.text_path)
                files_deleted.append(document.text_path)
                logger.info(f"Deleted text file: {document.text_path}")
            except Exception as e:
                logger.warning(f"Failed to delete text file {document.text_path}: {e}")
        
        # Delete original file (if exists)
        if document.original_path and os.path.exists(document.original_path):
            try:
                os.remove(document.original_path)
                files_deleted.append(document.original_path)
                logger.info(f"Deleted original file: {document.original_path}")
            except Exception as e:
                logger.warning(f"Failed to delete original file {document.original_path}: {e}")
        
        # Delete document record
        db.delete(document)
        db.commit()
        _rebuild_indexes_after_delete(db)
        
        logger.info(f"Successfully deleted document {document_id}")
        
        return {
            "status": "success",
            "message": f"Document '{document.filename}' deleted successfully",
            "deleted": {
                "document_id": document_id,
                "chunks": chunks_deleted,
                "files": len(files_deleted),
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete document {document_id}: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")
