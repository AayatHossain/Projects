"""AI proxy.

The React Native app never holds an LLM key. It sends a system instruction plus
the conversation here (authenticated with the user's JWT), and this endpoint calls
OpenAI using a server-side key (OPENAI_API_KEY env var). Keeping the key on the
server means it's never extractable from the app bundle.
"""
import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..config import settings
from ..schemas import UserOut
from .auth import current_user

router = APIRouter(prefix="/ai", tags=["ai"])

OPENAI_URL = "https://api.openai.com/v1/chat/completions"


class Turn(BaseModel):
    role: str  # "user" or "model"
    text: str


class ChatIn(BaseModel):
    system: str
    messages: list[Turn]
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=400, ge=1, le=2000)


@router.post("/chat")
def chat(body: ChatIn, user: UserOut = Depends(current_user)):
    """Forward a prompt to OpenAI and return the reply text."""
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="AI is not configured on the server.")

    messages = [{"role": "system", "content": body.system}]
    for t in body.messages:
        # OpenAI uses "assistant" where the app uses "model".
        messages.append(
            {"role": "assistant" if t.role == "model" else "user", "content": t.text}
        )

    payload = {
        "model": settings.openai_model,
        "messages": messages,
        "temperature": body.temperature,
        "max_tokens": body.max_tokens,
    }

    try:
        res = requests.post(
            OPENAI_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            timeout=30,
        )
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Could not reach the AI service.")

    data = res.json() if res.content else {}
    if not res.ok:
        detail = (data.get("error") or {}).get("message") or "AI request failed."
        raise HTTPException(status_code=res.status_code, detail=detail)

    text = (((data.get("choices") or [{}])[0]).get("message") or {}).get("content", "")
    text = text.strip()
    if not text:
        raise HTTPException(status_code=502, detail="Empty response from the AI.")
    return {"text": text}
