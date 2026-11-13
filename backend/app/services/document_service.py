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
        
        if ext == "txt":
            return file_bytes.decode("utf-8", errors="ignore")
        
        elif ext == "pdf":
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            text_parts = [page.extract_text() or "" for page in reader.pages]
            return "\n\n".join(text_parts)
            
        elif ext in ["docx", "doc"]:
            import docx
            doc = docx.Document(io.BytesIO(file_bytes))
            return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            
        else:
            return file_bytes.decode("utf-8", errors="ignore")

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 400, overlap: int = 80) -> List[str]:
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
    async def query_knowledge_base(db: AsyncSession, user_id: int, query: str, top_k: int = 3) -> List[str]:
        """
        Retrieves top-K relevant chunks across user's uploaded documents.
        """
        # Get chunks owned by user
        stmt = (
            select(DocumentChunk)
            .join(Document)
            .where(Document.user_id == user_id)
        )
        result = await db.execute(stmt)
        chunks = result.scalars().all()
        if not chunks:
            return []

        provider = AIProviderFactory.get_provider()
        query_vec = await provider.generate_embedding(query)

        scored = []
        for ch in chunks:
            if not ch.embedding:
                continue
            sim = cosine_similarity(query_vec, ch.embedding)
            scored.append((sim, ch.content))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [content for sim, content in scored[:top_k] if sim > 0.08]
