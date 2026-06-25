import json
import re

import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..config import settings
from ..schemas import UserOut
from .auth import current_user

router = APIRouter(prefix="/shopping", tags=["shopping"])

SERPAPI_URL = "https://serpapi.com/search.json"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"

DEFAULT_LABELS = {"buy": "Buy it", "wait": "Wait", "alternative": "Consider an alternative"}
CURRENCY_RE = re.compile(r"^[^\d]+")


class AdviseIn(BaseModel):
    product: str = Field(min_length=1, max_length=120)
    price: float | None = None
    budget: float | None = None
    link: str | None = None
    context: str = ""
    region: str | None = None
    maxAlternatives: int = Field(default=2, ge=0, le=3)


def _search_offers(query: str, region: str, limit: int = 8) -> list[dict]:
    if not settings.serpapi_key:
        return []
    params = {
        "engine": "google_shopping",
        "q": query,
        "gl": region,
        "hl": "en",
        "api_key": settings.serpapi_key,
    }
    try:
        res = requests.get(SERPAPI_URL, params=params, timeout=30)
    except requests.RequestException:
        return []
    if not res.ok:
        return []
    try:
        data = res.json()
    except ValueError:
        return []
    offers = []
    for r in data.get("shopping_results") or []:
        price = r.get("extracted_price")
        if not price:
            continue
        price_text = (r.get("price") or "").lower()
        if any(term in price_text for term in ("/mo", "/month", "month", "/wk", "/week", "/yr")):
            continue
        offers.append(
            {
                "source": r.get("source") or "Unknown",
                "title": r.get("title") or query,
                "price": float(price),
                "priceText": r.get("price") or "",
                "link": r.get("product_link") or r.get("link") or "",
                "thumbnail": r.get("thumbnail") or "",
                "rating": r.get("rating"),
                "reviews": r.get("reviews"),
                "delivery": r.get("delivery") or "",
                "inStock": True,
            }
        )
    offers.sort(key=lambda o: ((0 if o["inStock"] else 1), o["price"]))
    return offers[:limit]


def _search_with_fallback(query: str, region: str, limit: int = 8) -> tuple[list[dict], str]:
    offers = _search_offers(query, region, limit)
    if offers:
        return offers, region
    if region != "us":
        offers = _search_offers(query, "us", limit)
        if offers:
            return offers, "us"
    return [], region


def _currency_of(offer: dict | None, region: str) -> str:
    text = (offer or {}).get("priceText") or ""
    m = CURRENCY_RE.match(text.strip())
    if m:
        return m.group(0).strip()
    return "৳" if region == "bd" else "$"


def _ai_verdict(product: str, price_str: str, budget, context: str) -> dict | None:
    if not settings.openai_api_key:
        return None
    system = (
        "You are the purchase advisor for TakaTrack, a budgeting app used in Bangladesh "
        "(currency Bangladeshi Taka, ৳). Given a product, its best market price, and the "
        "user's financial snapshot, decide whether they should buy it now. "
        "Reply with ONLY a JSON object: {\"verdict\": one of 'buy' | 'wait' | 'alternative', "
        "\"label\": a short 2-4 word verdict headline, "
        "\"reason\": one or two sentences that reference the user's real numbers, "
        "\"alternatives\": up to 2 cheaper but comparable real product names as strings}. "
        "Use 'buy' when it fits their budget and goals, 'wait' when timing or affordability is poor, "
        "'alternative' when a cheaper comparable product would serve them better."
    )
    user = (
        f"Product: {product}\n"
        f"Best market price: {price_str}\n"
        f"User's max budget for this: {('৳' + str(round(budget))) if budget else 'not specified'}\n\n"
        f"{context or 'No financial snapshot provided.'}"
    )
    payload = {
        "model": settings.openai_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.5,
        "max_tokens": 350,
        "response_format": {"type": "json_object"},
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
        return None
    if not res.ok:
        return None
    try:
        content = res.json()["choices"][0]["message"]["content"]
        return json.loads(content)
    except (KeyError, IndexError, ValueError):
        return None


@router.post("/advise")
def advise(body: AdviseIn, user: UserOut = Depends(current_user)):
    if not settings.serpapi_key:
        raise HTTPException(status_code=503, detail="Shopping search is not configured on the server.")

    region = body.region or settings.shopping_region
    offers, used_region = _search_with_fallback(body.product, region)
    best = offers[0] if offers else None
    best_price = best["price"] if best else body.price
    currency = _currency_of(best, used_region)
    price_str = f"{currency}{round(best_price)}" if best_price else "unknown"

    verdict_data = _ai_verdict(body.product, price_str, body.budget, body.context) or {}
    verdict = verdict_data.get("verdict")
    if verdict not in ("buy", "wait", "alternative"):
        verdict = "wait"

    alternatives = []
    for name in (verdict_data.get("alternatives") or [])[: body.maxAlternatives]:
        if not isinstance(name, str) or not name.strip():
            continue
        alt, _ = _search_with_fallback(name.strip(), used_region, limit=1)
        if not alt:
            continue
        ao = alt[0]
        savings = (best_price - ao["price"]) if best_price else 0
        alternatives.append(
            {
                "name": name.strip(),
                "price": ao["price"],
                "priceText": ao["priceText"],
                "source": ao["source"],
                "link": ao["link"],
                "thumbnail": ao["thumbnail"],
                "savings": round(savings) if savings > 0 else 0,
                "savingsPct": round(savings / best_price * 100) if best_price and savings > 0 else 0,
            }
        )

    return {
        "product": body.product,
        "queryPrice": body.price,
        "currency": currency,
        "region": used_region,
        "best": best,
        "offers": offers,
        "verdict": verdict,
        "label": verdict_data.get("label") or DEFAULT_LABELS[verdict],
        "reason": verdict_data.get("reason") or "",
        "alternatives": alternatives,
    }
