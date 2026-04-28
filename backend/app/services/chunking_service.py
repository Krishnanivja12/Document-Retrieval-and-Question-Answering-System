from typing import Dict, List, Optional

import tiktoken
from langchain_text_splitters import RecursiveCharacterTextSplitter
from loguru import logger
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppException
from app.models.chunk import Chunk
from app.models.document import Document


def get_tokenizer():
    return tiktoken.get_encoding(settings.TOKEN_ENCODING)


def split_text(text: str, metadata: Optional[Dict] = None) -> List[Dict]:
    if not text or not text.strip():
        logger.warning("Empty text provided to split_text")
        return []
    
    tokenizer = get_tokenizer()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        length_function=lambda s: len(tokenizer.encode(s)),
        is_separator_regex=False,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks_text = splitter.split_text(text)

    result = []
    for idx, chunk_text in enumerate(chunks_text):
        # Skip empty chunks
        if not chunk_text or not chunk_text.strip():
            logger.debug(f"Skipping empty chunk at index {idx}")
            continue
        
        result.append(
            {
                "content": chunk_text.strip(),  # Strip whitespace
                "chunk_index": idx,
                "token_count": len(tokenizer.encode(chunk_text)),
                "metadata": metadata.copy() if metadata else {},
            }
        )
    
    if not result:
        logger.warning("No valid chunks generated from text")
    
    return result


def extract_pdf_hints(file_path: str) -> List[Dict]:
    import fitz

    doc = fitz.open(file_path)
    pages = []
    for page_num, page in enumerate(doc):
        pages.append({"text": page.get_text(), "page": page_num + 1})
    doc.close()
    return pages


def extract_docx_hints(file_path: str) -> List[Dict]:
    from docx import Document as DocxDocument

    doc = DocxDocument(file_path)
    sections = []
    current_heading = None
    current_text: List[str] = []

    for para in doc.paragraphs:
        if para.style.name.startswith("Heading"):
            if current_text:
                sections.append({"text": "\n".join(current_text), "heading": current_heading})
                current_text = []
            current_heading = para.text
        else:
            current_text.append(para.text)

    if current_text:
        sections.append({"text": "\n".join(current_text), "heading": current_heading})

    return sections


def chunk_document(doc: Document, db: Session) -> List[Chunk]:
    if db.query(Chunk).filter(Chunk.document_id == doc.id).first():
        logger.warning(f"Document {doc.id} already chunked.")
        return []

    all_chunks: List[Chunk] = []

    if doc.source_type == "file":
        if doc.ext == ".pdf":
            pages = extract_pdf_hints(doc.original_path)
            for page_data in pages:
                page_chunks = split_text(page_data["text"], metadata={"page": page_data["page"]})
                for chunk_data in page_chunks:
                    chunk = Chunk(
                        document_id=doc.id,
                        chunk_index=chunk_data["chunk_index"],
                        content=chunk_data["content"],
                        token_count=chunk_data["token_count"],
                        metadata_json={"page": page_data["page"]},
                    )
                    db.add(chunk)
                    all_chunks.append(chunk)
        elif doc.ext == ".docx":
            sections = extract_docx_hints(doc.original_path)
            for section in sections:
                section_chunks = split_text(
                    section["text"],
                    metadata={"heading": section.get("heading")},
                )
                for chunk_data in section_chunks:
                    heading = section.get("heading")
                    chunk = Chunk(
                        document_id=doc.id,
                        chunk_index=chunk_data["chunk_index"],
                        content=chunk_data["content"],
                        token_count=chunk_data["token_count"],
                        metadata_json={"heading": heading} if heading else None,
                    )
                    db.add(chunk)
                    all_chunks.append(chunk)
        elif doc.ext == ".txt":
            with open(doc.text_path, "r", encoding="utf-8") as file:
                text = file.read()
            for chunk_data in split_text(text):
                chunk = Chunk(
                    document_id=doc.id,
                    chunk_index=chunk_data["chunk_index"],
                    content=chunk_data["content"],
                    token_count=chunk_data["token_count"],
                    metadata_json=None,
                )
                db.add(chunk)
                all_chunks.append(chunk)
        else:
            raise AppException(detail=f"Unsupported file type {doc.ext}", status_code=400)
    elif doc.source_type == "url":
        with open(doc.text_path, "r", encoding="utf-8") as file:
            text = file.read()
        for chunk_data in split_text(text):
            chunk = Chunk(
                document_id=doc.id,
                chunk_index=chunk_data["chunk_index"],
                content=chunk_data["content"],
                token_count=chunk_data["token_count"],
                metadata_json=None,
            )
            db.add(chunk)
            all_chunks.append(chunk)
    else:
        raise AppException(detail="Unknown source type", status_code=500)

    if all_chunks:
        for i, chunk in enumerate(all_chunks):
            chunk.chunk_index = i
        doc.processed = 1
        db.commit()
        logger.info(f"Document {doc.id}: created {len(all_chunks)} chunks")

    return all_chunks
