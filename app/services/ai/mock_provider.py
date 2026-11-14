from typing import List, Dict, Any, Optional
from app.services.ai.base import BaseAIProvider
from app.services.ai.embeddings import generate_local_embedding

class MockProvider(BaseAIProvider):
    """
    Mock AI Provider for automated testing and offline development.
    Requires no external network and zero API cost.
    Supports tool execution testing.
    """

    def __init__(self, model: str = "mock-aip-v2"):
        self.model = model

    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        last_user_msg = messages[-1]["content"] if messages else "Hello"
        
        # Test tool triggering if requested
        if "calculate" in str(last_user_msg).lower() and tools:
            return {
                "content": "",
                "tool_calls": [
                    {
                        "id": "call_mock_calc",
                        "type": "function",
                        "function": {
                            "name": "calculate",
                            "arguments": '{"expression": "25 * 4"}'
                        }
                    }
                ],
                "prompt_tokens": 15,
                "completion_tokens": 10,
                "model": self.model,
                "provider": "mock",
            }

        mock_reply = (
            f"I am AIP Assistant. Regarding '{last_user_msg}': "
            "I can assist you with grocery planning, supermarket routes, documents, or answering any questions!"
        )
        return {
            "content": mock_reply,
            "tool_calls": None,
            "prompt_tokens": len(str(last_user_msg).split()) + 10,
            "completion_tokens": len(mock_reply.split()),
            "model": self.model,
            "provider": "mock",
        }

    async def generate_embedding(self, text: str) -> List[float]:
        return generate_local_embedding(text)
