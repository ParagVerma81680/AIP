import json
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
    async def extract_and_save_memories_llm(
        db: AsyncSession,
        user_id: int,
        user_message: str,
        assistant_reply: str
    ):
        """
        Uses intelligent LLM evaluation to selectively extract durable facts about the user:
        - Dietary constraints (vegan, halal, kosher, gluten-free, vegetarian, diabetic)
        - Allergies (peanuts, shellfish, lactose, sulfites)
        - Household details (cooking for family of 4, has a toddler, pet owner)
        - Budget preferences (student budget, organic preference)
        - Recurring goals & habits
        Does NOT save transient chatter, one-off searches, or greetings.
        """
        pref = await MemoryService.get_user_preferences(db, user_id)
        if not pref.memory_enabled:
            return

        # Skip trivial messages to conserve tokens
        lower = user_message.lower().strip()
        if len(lower.split()) < 3 or lower in ["hi", "hello", "thanks", "thank you", "bye", "ok", "okay"]:
            return

        extraction_prompt = (
            "You are a precise, privacy-conscious personal memory extractor for an AI assistant.\n"
            "Analyze the following user statement and assistant reply:\n"
            f"User: {user_message}\n"
            f"Assistant: {assistant_reply}\n\n"
            "Task: Identify any permanent, high-value personal facts about the user "
            "(e.g., diet, allergies, family size, budget rules, brand loyalties, recurring projects).\n"
            "Rules:\n"
            "1. Output ONLY a JSON array of objects: [{\"category\": \"diet|allergy|budget|preference|fact\", \"fact\": \"concise statement\", \"importance\": 1.0-2.0}]\n"
            "2. If there are NO durable facts to remember, output an empty JSON array: []\n"
            "3. Do not save temporary queries or questions. Only save confirmed facts about the user."
        )

        try:
            provider = AIProviderFactory.get_provider()
            res = await provider.generate_response(
                messages=[{"role": "user", "content": extraction_prompt}],
                temperature=0.2,
                max_tokens=250,
            )
            raw = (res.get("content") or "").strip()
            # Clean markdown code blocks if present
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()

            facts = json.loads(raw)
            if not isinstance(facts, list):
                return

            for item in facts:
                fact_text = item.get("fact", "").strip()
                category = item.get("category", "preference").strip()
                importance = float(item.get("importance", 1.0))

                if not fact_text:
                    continue

                # Check for duplicates or near-identical memories
                existing = await db.execute(
                    select(Memory).where(
                        and_(Memory.user_id == user_id, Memory.fact_text == fact_text, Memory.is_active == True)
                    )
                )
                if existing.scalar_one_or_none():
                    continue

                embedding = await provider.generate_embedding(fact_text)
                memory = Memory(
                    user_id=user_id,
                    category=category,
                    fact_text=fact_text,
                    embedding=embedding,
                    importance=importance,
                )
                db.add(memory)

            await db.commit()
            if facts:
                logger.info(f"Dynamically extracted {len(facts)} memory facts for user {user_id}")

        except Exception as e:
            logger.warning(f"Memory extraction skipped: {e}")

    @staticmethod
    async def retrieve_relevant_memories(
        db: AsyncSession,
        user_id: int,
        query: str,
        top_k: int = 4
    ) -> List[str]:
        """
        Retrieves top-K semantically relevant user memories using hybrid scoring:
        Score = (Cosine Similarity * 0.7) + (Normalized Importance * 0.3)
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
            cos_sim = cosine_similarity(query_vec, mem.embedding)
            # Factor in importance weight
            weight = mem.importance or 1.0
            hybrid_score = (cos_sim * 0.7) + (min(weight / 2.0, 1.0) * 0.3)
            scored.append((hybrid_score, mem.fact_text))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [text for score, text in scored[:top_k] if score > 0.08]

    @staticmethod
    async def clear_user_memories(db: AsyncSession, user_id: int):
        await db.execute(delete(Memory).where(Memory.user_id == user_id))
        await db.commit()
