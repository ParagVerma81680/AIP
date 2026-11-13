import logging
from app.core.config import settings
from app.services.ai.base import BaseAIProvider
from app.services.ai.groq_provider import GroqProvider
from app.services.ai.mock_provider import MockProvider

logger = logging.getLogger(__name__)

class AIProviderFactory:
    _instance: BaseAIProvider = None

    @classmethod
    def get_provider(cls) -> BaseAIProvider:
        if cls._instance is not None:
            return cls._instance

        provider_name = (settings.AI_PROVIDER or "").lower().strip()
        api_key = (settings.AI_API_KEY or "").strip()

        if provider_name == "groq" and api_key and api_key != "your-api-key-here":
            logger.info(f"Initialized GroqProvider with model: {settings.AI_MODEL}")
            cls._instance = GroqProvider(
                api_key=api_key,
                model=settings.AI_MODEL or "openai/gpt-oss-120b",
                base_url=settings.AI_BASE_URL or "https://api.groq.com/openai/v1"
            )
        else:
            logger.info("Initialized MockProvider (offline / test mode)")
            cls._instance = MockProvider()

        return cls._instance

    @classmethod
    def reset(cls):
        """Allows test suites to swap providers dynamically."""
        cls._instance = None
