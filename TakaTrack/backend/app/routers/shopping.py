import json
import math
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
DARAZ_URL = "https://www.daraz.com.bd/catalog/"
DARAZ_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json, text/plain, */*",
}

DEFAULT_LABELS = {"buy": "Buy it", "wait": "Wait", "alternative": "Consider an alternative"}
CURRENCY_RE = re.compile(r"^[^\d]+")
DIGITS_RE = re.compile(r"\d")

STOPWORDS = {"for", "the", "with", "and", "in", "of", "a", "to", "new", "original", "best", "buy"}
ACCESSORY_TERMS = (
    "case", "cover", "protector", "tempered", "glass", "charger", "cable",
    "adapter", "holder", "stand", "skin", "guard", "pouch", "strap", "lens",
    "earphone", "headphone", "power bank", "sticker", "film", "ring", "mount",
    "otg", "card reader", "reader", "kit", "cleaning",
)
GROCERY_TERMS = {
    "rice", "oil", "egg", "atta", "flour", "sugar", "salt", "dal", "lentil",
    "onion", "potato", "garlic", "ginger", "milk", "tea", "coffee", "biscuit",
    "chips", "soap", "shampoo", "detergent", "toothpaste", "spice", "masala",
    "ghee", "butter", "honey", "noodles", "pasta", "sauce", "snack", "water",
    "juice", "powder", "diaper", "tissue", "sanitizer", "grocery", "fish",
    "meat", "chicken", "vegetable", "fruit", "banana", "mango", "bread", "cereal",
}
ELECTRONICS_TERMS = {
    "phone", "iphone", "samsung", "laptop", "tv", "television", "tablet", "ipad",
    "watch", "earbuds", "monitor", "mouse", "keyboard", "router", "camera",
    "console", "playstation", "xbox", "powerbank", "speaker", "ssd", "ram",
    "processor", "gpu", "macbook", "redmi", "xiaomi", "oppo", "vivo", "realme",
    "nokia", "motorola", "pixel", "smartphone",
}


def _tokens(q: str) -> list[str]:
    return [t for t in re.split(r"[^a-z0-9]+", (q or "").lower()) if len(t) >= 2 and t not in STOPWORDS]


def _category(query: str) -> str:
    toks = set(_tokens(query))
    if toks & GROCERY_TERMS:
        return "grocery"
    if toks & ELECTRONICS_TERMS:
        return "electronics"
    return "general"


def _relevant(name: str, toks: list[str]) -> bool:
    if not toks:
        return True
    n = (name or "").lower()
    hits = sum(1 for t in toks if t in n)
    return hits >= math.ceil(len(toks) * 0.6)


def _is_accessory(name: str, query: str) -> bool:
    n = (name or "").lower()
    q = (query or "").lower()
    return any(term in n and term not in q for term in ACCESSORY_TERMS)


def _to_int(v) -> int | None:
    try:
        return int(str(v).replace(",", "").strip())
    except (ValueError, TypeError):
        return None


def _num(v) -> float | None:
    try:
        return float(str(v).replace(",", "").strip())
    except (ValueError, TypeError):
        return None


def _drop_price_outliers(offers: list[dict]) -> list[dict]:
    if len(offers) < 4:
        return offers
    prices = sorted(o["price"] for o in offers)
    median = prices[len(prices) // 2]
    return [o for o in offers if o["price"] >= median * 0.2]


def _finalize(offers: list[dict], query: str, limit: int) -> list[dict]:
    toks = _tokens(query)
    category = _category(query)
    offers = [o for o in offers if _relevant(o["title"], toks)]
    if category == "electronics":
        offers = [o for o in offers if not _is_accessory(o["title"], query)]
        offers = _drop_price_outliers(offers)
    offers.sort(key=lambda o: ((0 if o["inStock"] else 1), o["price"]))
    return offers[:limit]


def _offer(source, title, price, price_text, link, thumb, rating, reviews, delivery, in_stock, original):
    discount_pct = 0
    if original and original > price:
        discount_pct = round((original - price) / original * 100)
    return {
        "source": source or "Unknown",
        "title": title,
        "price": float(price),
        "priceText": price_text,
        "link": link or "",
        "thumbnail": thumb or "",
        "rating": rating,
        "reviews": reviews,
        "delivery": delivery or "",
        "inStock": bool(in_stock),
        "original": original,
        "discountPct": discount_pct,
    }


def _search_daraz(query: str, limit: int = 12) -> list[dict]:
    try:
        res = requests.get(
            DARAZ_URL,
            params={"ajax": "true", "q": query},
            headers=DARAZ_HEADERS,
            timeout=30,
        )
    except requests.RequestException:
        return []
    if not res.ok:
        return []
    try:
        data = res.json()
    except ValueError:
        return []
    offers = []
    for it in (data.get("mods") or {}).get("listItems") or []:
        price = _to_int(it.get("price"))
        if not price:
            continue
        url = it.get("itemUrl") or ""
        if url.startswith("//"):
            url = "https:" + url
        try:
            rating = float(it.get("ratingScore")) if it.get("ratingScore") else None
        except (ValueError, TypeError):
            rating = None
        original = _to_int(re.sub(r"[^\d]", "", it.get("originalPriceShow") or "")) or None
        offers.append(
            _offer(
                it.get("sellerName") or "Daraz",
                it.get("name") or query,
                price,
                (it.get("priceShow") or f"৳{price}").replace("৳ ", "৳"),
                url,
                it.get("image"),
                rating,
                _to_int(it.get("review")),
                it.get("location"),
                it.get("inStock", True),
                original,
            )
        )
    return _finalize(offers, query, limit)


def _search_serpapi(query: str, region: str, limit: int = 12) -> list[dict]:
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
        price = _num(r.get("extracted_price"))
        if not price:
            continue
        price_text = (r.get("price") or "").lower()
        if any(term in price_text for term in ("/mo", "/month", "month", "/wk", "/week", "/yr")):
            continue
        offers.append(
            _offer(
                r.get("source") or "Unknown",
                r.get("title") or query,
                price,
                r.get("price") or "",
                r.get("product_link") or r.get("link") or "",
                r.get("thumbnail"),
                r.get("rating"),
                r.get("reviews"),
                r.get("delivery"),
                True,
                None,
            )
        )
    return _finalize(offers, query, limit)


def _search_with_fallback(query: str, region: str, limit: int = 12) -> tuple[list[dict], str]:
    if region == "bd":
        offers = _search_daraz(query, limit)
        if offers:
            return offers, "bd"
    offers = _search_serpapi(query, region, limit)
    if offers:
        return offers, region
    if region != "us":
        offers = _search_serpapi(query, "us", limit)
        if offers:
            return offers, "us"
    return [], region


def _currency_of(offer: dict | None, region: str) -> str:
    text = (offer or {}).get("priceText") or ""
    m = CURRENCY_RE.match(text.strip())
    if m:
        return m.group(0).strip()
    return "৳" if region == "bd" else "$"


@router.get("/search")
def search(q: str, user: UserOut = Depends(current_user)):
    query = (q or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Enter something to search.")
    region = settings.shopping_region
    products, used_region = _search_with_fallback(query, region)
    currency = _currency_of(products[0] if products else None, used_region)
    savings = sum(
        (p["original"] - p["price"]) for p in products if p.get("original") and p["original"] > p["price"]
    )
    return {
        "query": query,
        "category": _category(query),
        "currency": currency,
        "region": used_region,
        "count": len(products),
        "potentialSavings": round(savings),
        "products": products,
    }


class AdviseIn(BaseModel):
    product: str = Field(min_length=1, max_length=120)
    price: float | None = None
    budget: float | None = None
    link: str | None = None
    context: str = ""
    region: str | None = None
    maxAlternatives: int = Field(default=2, ge=0, le=3)


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
