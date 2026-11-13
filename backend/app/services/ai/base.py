"""
Abstract base class for all AI model providers.
Ensures provider independence across Groq, OpenAI, Anthropic, Gemini, and Mock.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> Dict[str, Any]:
        """
        Generates a text completion given message history.
        Returns dict:
        {
            "content": str,
            "prompt_tokens": int,
            "completion_tokens": int,
            "model": str,
            "provider": str
        }
        """
        pass

    @abstractmethod
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generates a vector embedding for the input text (default 384-dim or 1536-dim).
        """
        pass
