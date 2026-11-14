import io
import re
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from app.models.document import Document, DocumentChunk
from app.services.ai.embeddings import generate_local_embedding, cosine_similarity
from app.services.ai.factory import AIProviderFactory

logger = logging.getLogger(__name__)

class DocumentService:
    @staticmethod
    def extract_text(file_bytes: bytes, filename: str) -> str:
        ext = filename.split(".")[-1].lower() if "." in filename else "txt"
        
        if ext == "txt" or ext == "md":
            return file_bytes.decode("utf-8", errors="ignore")
        
        elif ext == "pdf":
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            parts = []
            for page_idx, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    parts.append(f"[Page {page_idx}]\n{page_text.strip()}")
            return "\n\n".join(parts)
            
        elif ext in ["docx", "doc"]:
            import docx
            doc = docx.Document(io.BytesIO(file_bytes))
            return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            
        else:
            return file_bytes.decode("utf-8", errors="ignore")

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 350, overlap: int = 70) -> List[str]:
        """Sliding-window overlapping chunker to preserve semantic context across chunk boundaries."""
        words = text.split()
        if not words:
            return []
        
        chunks = []
        i = 0
        while i < len(words):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk.strip())
            i += (chunk_size - overlap)
        return chunks

    @staticmethod
    async def process_and_store_document(
        db: AsyncSession,
        user_id: int,
        filename: str,
        file_bytes: bytes,
    ) -> Document:
        file_type = filename.split(".")[-1].lower() if "." in filename else "txt"
        text = DocumentService.extract_text(file_bytes, filename)
        
        doc = Document(
            user_id=user_id,
            title=filename,
            file_type=file_type,
            file_size=len(file_bytes)
        )
        db.add(doc)
        await db.flush()

        chunks = DocumentService.chunk_text(text)
        provider = AIProviderFactory.get_provider()

        for idx, chunk_content in enumerate(chunks):
            embedding = await provider.generate_embedding(chunk_content)
            chunk = DocumentChunk(
                document_id=doc.id,
                chunk_index=idx,
                content=chunk_content,
                embedding=embedding,
            )
            db.add(chunk)

        await db.commit()
        await db.refresh(doc)
        logger.info(f"Processed document '{filename}' with {len(chunks)} chunks.")
        return doc

    @staticmethod
    async def query_knowledge_base(
        db: AsyncSession,
        user_id: int,
        query: str,
        top_k: int = 3
    ) -> List[str]:
        """
        Retrieves top-K relevant chunks across user's uploaded documents with source citations.
        Strict tenant isolation enforced: user A can NEVER retrieve user B's documents.
        """
        stmt = (
            select(DocumentChunk, Document.title)
            .join(Document, DocumentChunk.document_id == Document.id)
            .where(Document.user_id == user_id)
        )
        result = await db.execute(stmt)
        rows = result.all()
        if not rows:
            return []

        provider = AIProviderFactory.get_provider()
        query_vec = await provider.generate_embedding(query)

        scored = []
        for chunk, doc_title in rows:
            if not chunk.embedding:
                continue
            sim = cosine_similarity(query_vec, chunk.embedding)
            citation = f"Source: '{doc_title}' (Chunk {chunk.chunk_index + 1})\nExcerpt: \"{chunk.content}\""
            scored.append((sim, citation))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [citation for sim, citation in scored[:top_k] if sim > 0.08]
