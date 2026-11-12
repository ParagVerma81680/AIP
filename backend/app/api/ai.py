from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.conversation import Conversation, Message
from app.schemas.ai import ChatRequest, ChatResponse
from app.api.deps import get_optional_user
from app.services.ai_service import AIService
from typing import Optional
import json

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    # Get or create conversation
    conv = None
    if data.conversation_id:
        result = await db.execute(select(Conversation).where(Conversation.id == data.conversation_id))
        conv = result.scalar_one_or_none()
    
    if not conv:
        conv = Conversation(
            user_id=current_user.id if current_user else None,
            session_id=data.session_id or "anonymous",
        )
        db.add(conv)
        await db.flush()

    # Load history
    history_result = await db.execute(
        select(Message).where(Message.conversation_id == conv.id).order_by(Message.id).limit(10)
    )
    history = [{"role": m.role, "content": m.content} for m in history_result.scalars().all()]

    # Process query with AI service (handles tools, location, recipes, routes, fallback)
    ai_result = await AIService.chat(
        db=db,
        message=data.message,
        cart_product_ids=data.cart_product_ids or [],
        history=history,
    )

    reply_text = ai_result.get("reply", "I'm here to help you shop at SwiftMart!")

    # Persist messages
    db.add(Message(conversation_id=conv.id, role="user", content=data.message))
    db.add(
        Message(
            conversation_id=conv.id,
            role="assistant",
            content=reply_text,
            tool_calls={
                "action": ai_result.get("action"),
                "suggested_products": ai_result.get("suggested_products"),
                "route_generated": ai_result.get("route_generated"),
            } if ai_result.get("action") else None
        )
    )
    await db.commit()

    return ChatResponse(
        reply=reply_text,
        conversation_id=conv.id,
        suggested_products=ai_result.get("suggested_products", []),
        products_data=ai_result.get("products_data", []),
        route_generated=ai_result.get("route_generated", False),
        route_summary=ai_result.get("route_summary"),
        action=ai_result.get("action"),
        quick_suggestions=ai_result.get("quick_suggestions", []),
    )
