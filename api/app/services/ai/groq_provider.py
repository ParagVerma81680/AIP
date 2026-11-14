import httpx
import logging
from typing import List, Dict, Any, Optional
from app.services.ai.base import BaseAIProvider
from app.services.ai.embeddings import generate_local_embedding

logger = logging.getLogger(__name__)

class GroqProvider(BaseAIProvider):
    """
    Groq OpenAI-compatible provider.
    Runs high-throughput reasoning models (e.g. openai/gpt-oss-120b).
    Fully supports OpenAI-standard Tool Calling schemas and function execution.
    """

    def __init__(self, api_key: str, model: str = "openai/gpt-oss-120b", base_url: str = "https://api.groq.com/openai/v1"):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")

    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        formatted_messages.extend(messages)

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if tools and len(tools) > 0:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code != 200:
                logger.error(f"Groq API Error {resp.status_code}: {resp.text}")
                resp.raise_for_status()

            data = resp.json()
            choice = data["choices"][0]
            msg = choice["message"]
            content = msg.get("content") or ""
            if not content.strip() and msg.get("reasoning"):
                content = msg.get("reasoning")

            tool_calls = msg.get("tool_calls")
            usage = data.get("usage", {})
            return {
                "content": content.strip() if content else "",
                "tool_calls": tool_calls,
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "model": self.model,
                "provider": "groq",
            }

    async def generate_embedding(self, text: str) -> List[float]:
        return generate_local_embedding(text)
