import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from app.models.memory import Memory, UserPreference
from app.services.ai.embeddings import generate_local_embedding, cosine_similarity
from app.services.ai.factory import AIProviderFactory

logger = logging.getLogger(__name__)

class MemoryService:
    @staticmethod
    async def get_user_preferences(db: AsyncSession, user_id: int) -> UserPreference:
        result = await db.execute(select(UserPreference).where(UserPreference.user_id == user_id))
        pref = result.scalar_one_or_none()
        if not pref:
            pref = UserPreference(user_id=user_id)
            db.add(pref)
            await db.commit()
            await db.refresh(pref)
        return pref

    @staticmethod
    async def extract_and_save_memories(db: AsyncSession, user_id: int, user_message: str, assistant_reply: str):
        """
        Extracts persistent user preferences or dietary facts selectively.
        Doesn't save arbitrary small-talk.
        """
        pref = await MemoryService.get_user_preferences(db, user_id)
        if not pref.memory_enabled:
            return

        text = user_message.lower()
        extracted_facts = []

        # Selective rule-based fact detection
        if any(w in text for w in ["i am vegetarian", "i'm vegetarian", "pure veg", "strict veg"]):
            extracted_facts.append(("diet", "User follows a strict vegetarian diet."))
        elif any(w in text for w in ["i am vegan", "i'm vegan"]):
            extracted_facts.append(("diet", "User follows a vegan diet."))
        elif any(w in text for w in ["allergic to nuts", "nut allergy"]):
            extracted_facts.append(("allergy", "User has a severe allergy to nuts/peanuts."))
        elif any(w in text for w in ["lactose intolerant", "avoid dairy", "no milk"]):
            extracted_facts.append(("diet", "User is lactose intolerant and avoids dairy."))
        elif any(w in text for w in ["budget under", "keep it under"]):
            extracted_facts.append(("budget", f"User stated budget constraint: '{user_message}'."))
        elif any(w in text for w in ["prefer organic", "only organic"]):
            extracted_facts.append(("preference", "User strongly prefers organic and chemical-free products."))

        for category, fact in extracted_facts:
            # Check if duplicate exists
            existing = await db.execute(
                select(Memory).where(
                    and_(Memory.user_id == user_id, Memory.fact_text == fact, Memory.is_active == True)
                )
            )
            if existing.scalar_one_or_none():
                continue

            provider = AIProviderFactory.get_provider()
            embedding = await provider.generate_embedding(fact)
            memory = Memory(
                user_id=user_id,
                category=category,
                fact_text=fact,
                embedding=embedding,
                importance=1.5 if category in ["allergy", "diet"] else 1.0,
            )
            db.add(memory)

        if extracted_facts:
            await db.commit()
            logger.info(f"Extracted {len(extracted_facts)} memories for user {user_id}")

    @staticmethod
    async def retrieve_relevant_memories(db: AsyncSession, user_id: int, query: str, top_k: int = 3) -> List[str]:
        """
        Retrieves top-K semantically relevant user memories using cosine similarity.
        """
        pref = await MemoryService.get_user_preferences(db, user_id)
        if not pref.memory_enabled:
            return []

        result = await db.execute(select(Memory).where(and_(Memory.user_id == user_id, Memory.is_active == True)))
        memories = result.scalars().all()
        if not memories:
            return []

        provider = AIProviderFactory.get_provider()
        query_vec = await provider.generate_embedding(query)

        scored = []
        for mem in memories:
            if not mem.embedding:
                continue
            sim = cosine_similarity(query_vec, mem.embedding)
            # Boost higher importance facts (allergies, diets)
            sim = sim * mem.importance
            scored.append((sim, mem.fact_text))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [text for sim, text in scored[:top_k] if sim > 0.05]

    @staticmethod
    async def clear_user_memories(db: AsyncSession, user_id: int):
        await db.execute(delete(Memory).where(Memory.user_id == user_id))
        await db.commit()
