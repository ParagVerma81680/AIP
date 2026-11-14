from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.conversation import Conversation, Message
from app.schemas.ai import ChatRequest, ChatResponse
from app.api.deps import get_optional_user
from app.services.ai_service import AIService
from typing import Optional

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    """
    Main conversational chat endpoint.
    Maintains 100% backward compatibility with the React frontend while
    leveraging the new AIP memory, RAG, and multi-provider engine.
    """
    # 1. Retrieve or create persistent conversation
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

    # 2. Load short-term history buffer
    history_result = await db.execute(
        select(Message).where(Message.conversation_id == conv.id).order_by(Message.id).limit(10)
    )
    history = [{"role": m.role, "content": m.content} for m in history_result.scalars().all()]

    # 3. Execute AIP Service with memory, tools, RAG, and Groq/LLM
    user_id = current_user.id if current_user else None
    ai_result = await AIService.chat(
        db=db,
        message=data.message,
        cart_product_ids=data.cart_product_ids or [],
        history=history,
        user_id=user_id,
    )

    reply_text = ai_result.get("reply", "I'm here to assist you!")

    # 4. Save user & assistant messages to persistent DB
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

    # 5. Return strict contract for frontend
    return ChatResponse(
        reply=reply_text,
        conversation_id=conv.id,
        suggested_products=ai_result.get("suggested_products", []),
        products_data=ai_result.get("products_data", []),
        route_summary=ai_result.get("route_summary"),
        route_generated=ai_result.get("route_generated", False),
        action=ai_result.get("action"),
        quick_suggestions=ai_result.get("quick_suggestions", [
            "🥗 Dinner ingredients under ₹400",
            "📍 Where is the Amul butter?",
            "🗺️ Plan shortest route for my cart",
            "🍿 Healthy snacks for kids",
        ]),
    )
