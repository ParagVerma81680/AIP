"""
Abstract base class for all AI model providers.
Ensures provider independence across Groq, OpenAI, Anthropic, Gemini, and Mock.
Supports tool schemas and structured tool call responses.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Generates a text completion given message history and optional tools.
        Returns dict:
        {
            "content": str,
            "tool_calls": List[Dict[str, Any]] (optional),
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
        Generates a vector embedding for the input text (384-dim unit vector).
        """
        pass
