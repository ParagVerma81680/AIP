from typing import List, Dict, Any, Optional
from app.services.ai.base import BaseAIProvider
from app.services.ai.embeddings import generate_local_embedding

class MockProvider(BaseAIProvider):
    """
    Mock AI Provider for automated testing and offline development.
    Requires no internet and zero API costs.
    """

    def __init__(self, model: str = "mock-aip-v1"):
        self.model = model

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> Dict[str, Any]:
        last_user_msg = messages[-1]["content"] if messages else "Hello"
        mock_reply = (
            f"I am AIP Assistant. Regarding '{last_user_msg}': "
            "I can assist you with your grocery needs, budget planning, or answering any questions!"
        )
        return {
            "content": mock_reply,
            "prompt_tokens": len(last_user_msg.split()) + 10,
            "completion_tokens": len(mock_reply.split()),
            "model": self.model,
            "provider": "mock",
        }

    async def generate_embedding(self, text: str) -> List[float]:
        return generate_local_embedding(text)
