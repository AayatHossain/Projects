import json
import re

import requests

from .config import settings

OPENAI_URL = "https://api.openai.com/v1/chat/completions"

FINANCIAL_SENDERS = (
    "bkash", "nagad", "rocket", "upay", "tap", "mcash", "surecash",
    "dbbl", "brac", "city", "ebl", "dutch", "islami", "sonali", "agrani",
    "pubali", "ucb", "mtb", "ific", "prime", "bank",
)

IN_WORDS = (
    "received", "cash in", "add money", "credited", "credit",
    "deposit", "deposited", "refund", "you got",
)
OUT_WORDS = (
    "cash out", "payment", "send money", "sent", "payout", "withdraw",
    "withdrawn", "debited", "debit", "paid", "purchase", "recharge", "bill",
)

AMOUNT_RE = re.compile(r"(?:tk|bdt|৳)\.?\s*([\d,]+(?:\.\d+)?)", re.IGNORECASE)
FEE_RE = re.compile(r"fee\s*(?:tk|bdt|৳)?\.?\s*([\d,]+(?:\.\d+)?)", re.IGNORECASE)
BALANCE_RE = re.compile(
    r"(?:balance|bal|avbl bal|available balance)\s*(?:tk|bdt|৳)?\.?\s*([\d,]+(?:\.\d+)?)",
    re.IGNORECASE,
)
PHONE_RE = re.compile(r"\b01\d{9}\b")
TRX_RE = re.compile(
    r"(?:trxid|txnid|trx id|txn id|trans(?:action)? id)\s*[:\-.]?\s*([a-z0-9]{4,})",
    re.IGNORECASE,
)
REF_RE = re.compile(r"ref(?:erence)?\s*(?:no)?\.?\s*[:\-.]?\s*([a-z0-9]{4,})", re.IGNORECASE)
HAS_DIGIT_RE = re.compile(r"\d")
COUNTERPARTY_RE = re.compile(
    r"(?:to|from|at)\s+([A-Za-z0-9][A-Za-z0-9 &._-]{1,38}?)\s+(?:successful|ref|fee|trxid|txnid|at|on|is|avbl|balance)",
    re.IGNORECASE,
)

SUGGESTED_CAT = {
    "recharge": ("lifestyle", "Lifestyle & Family"),
    "bill": ("utilities", "Utilities & Rent"),
    "send_money": ("lifestyle", "Lifestyle & Family"),
    "cash_out": ("others", "Others"),
    "payment": ("others", "Others"),
}


def _num(s):
    try:
        return float(str(s).replace(",", ""))
    except (ValueError, AttributeError):
        return None


def looks_financial(sender, body):
    s = (sender or "").lower()
    b = (body or "").lower()
    if not AMOUNT_RE.search(body or ""):
        return False
    has_sender = any(k in s for k in FINANCIAL_SENDERS)
    has_word = any(w in b for w in IN_WORDS + OUT_WORDS)
    return has_sender or has_word


def _provider(sender, body):
    s = (sender or "").lower() + " " + (body or "").lower()
    for name in ("bkash", "nagad", "rocket", "upay"):
        if name in s:
            return name
    if any(k in s for k in ("bank", "dbbl", "brac", "ebl", "city", "islami", "ucb", "mtb")):
        return "bank"
    return "unknown"


def _direction(body):
    b = (body or "").lower()
    if any(w in b for w in IN_WORDS):
        return "in"
    return "out"


def _kind(body):
    b = (body or "").lower()
    if "cash out" in b:
        return "cash_out"
    if "send money" in b:
        return "send_money"
    if "recharge" in b:
        return "recharge"
    if "cash in" in b or "add money" in b:
        return "cash_in"
    if "bill" in b:
        return "bill"
    if "payment" in b or "paid" in b or "purchase" in b:
        return "payment"
    if "received" in b:
        return "received"
    return "transaction"


def parse_with_regex(sender, body):
    text = body or ""
    amounts = [a for a in (_num(m) for m in AMOUNT_RE.findall(text)) if a is not None]
    if not amounts:
        return None
    fee_m = FEE_RE.search(text)
    bal_m = BALANCE_RE.search(text)
    fee = _num(fee_m.group(1)) if fee_m else 0.0
    balance = _num(bal_m.group(1)) if bal_m else None
    phone = PHONE_RE.search(text)
    if phone:
        counterparty = phone.group(0)
    else:
        cm = COUNTERPARTY_RE.search(text)
        counterparty = cm.group(1).strip(" .,-") if cm else None
    trx_m = TRX_RE.search(text) or REF_RE.search(text)
    trx_id = trx_m.group(1) if trx_m and HAS_DIGIT_RE.search(trx_m.group(1)) else None
    kind = _kind(text)
    cat = SUGGESTED_CAT.get(kind, ("others", "Others"))
    return {
        "provider": _provider(sender, body),
        "trxId": trx_id,
        "amount": amounts[0],
        "fee": fee or 0.0,
        "balance": balance,
        "direction": _direction(text),
        "kind": kind,
        "counterparty": counterparty,
        "suggestedCatKey": cat[0],
        "suggestedCatLabel": cat[1],
        "raw": text.strip(),
    }


def parse_with_ai(body):
    if not settings.openai_api_key:
        return None
    prompt = (
        "Extract the financial transaction from this Bangladeshi mobile banking or bank SMS. "
        "Reply with ONLY a JSON object using these keys: amount (number), "
        "direction ('in' for money received or 'out' for money spent), "
        "kind (one of cash_out, send_money, payment, recharge, cash_in, received, bill, transaction), "
        "counterparty (string or null), fee (number, 0 if none), balance (number or null), "
        "trxId (string or null), provider (bkash, nagad, rocket, bank, or unknown). "
        "If it is not a financial transaction, reply with {\"amount\": null}. SMS: "
        + (body or "")
    )
    payload = {
        "model": settings.openai_model,
        "messages": [
            {"role": "system", "content": "You extract structured data from SMS and reply with strict JSON only."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0,
        "max_tokens": 300,
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
        data = json.loads(content)
    except (KeyError, IndexError, ValueError):
        return None
    amount = _num(data.get("amount")) if data.get("amount") is not None else None
    if not amount:
        return None
    kind = data.get("kind") or "transaction"
    cat = SUGGESTED_CAT.get(kind, ("others", "Others"))
    balance = data.get("balance")
    return {
        "provider": data.get("provider") or "unknown",
        "trxId": data.get("trxId"),
        "amount": amount,
        "fee": _num(data.get("fee")) or 0.0,
        "balance": _num(balance) if balance not in (None, "") else None,
        "direction": "in" if data.get("direction") == "in" else "out",
        "kind": kind,
        "counterparty": data.get("counterparty"),
        "suggestedCatKey": cat[0],
        "suggestedCatLabel": cat[1],
        "raw": (body or "").strip(),
    }


def parse_sms(sender, body):
    if not looks_financial(sender, body):
        return None
    parsed = parse_with_regex(sender, body)
    if parsed and parsed.get("amount"):
        return parsed
    return parse_with_ai(body)
