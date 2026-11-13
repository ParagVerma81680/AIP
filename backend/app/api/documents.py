from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User
from app.models.document import Document
from app.api.deps import get_current_user
from app.services.document_service import DocumentService

router = APIRouter()

class DocumentOut(BaseModel):
    id: int
    title: str
    file_type: str
    file_size: int
    model_config = {"from_attributes": True}

class QueryRequest(BaseModel):
    query: str
    top_k: int = 3

@router.get("", response_model=List[DocumentOut])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List documents uploaded by the user."""
    res = await db.execute(select(Document).where(Document.user_id == current_user.id))
    return res.scalars().all()

@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a PDF, DOCX, or TXT document for vector chunking and RAG."""
    filename = file.filename or "uploaded_document.txt"
    ext = filename.split(".")[-1].lower() if "." in filename else "txt"
    if ext not in ["pdf", "docx", "doc", "txt", "md"]:
        raise HTTPException(400, "Unsupported file format. Please upload PDF, DOCX, or TXT.")

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(400, "File size exceeds 10MB limit.")

    doc = await DocumentService.process_and_store_document(
        db=db,
        user_id=current_user.id,
        filename=filename,
        file_bytes=file_bytes,
    )
    return doc

@router.post("/query")
async def query_documents(
    req: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Perform semantic vector retrieval across uploaded documents."""
    chunks = await DocumentService.query_knowledge_base(db, current_user.id, req.query, req.top_k)
    return {"query": req.query, "matches": chunks}

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete document and all associated vector chunks."""
    res = await db.execute(select(Document).where(Document.id == document_id, Document.user_id == current_user.id))
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Document not found")
    await db.delete(doc)
    await db.commit()
    return {"status": "deleted"}
