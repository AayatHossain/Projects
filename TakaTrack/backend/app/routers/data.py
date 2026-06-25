import hashlib
import re
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..firebase import ref
from ..schemas import UserOut
from ..sms import parse_sms
from .auth import current_user

router = APIRouter(prefix="/data", tags=["data"])


DEFAULT_INCOME = 30000
DEFAULT_CATEGORIES = [
    {"key": "food", "label": "Food & Groceries", "icon": "🍚", "alloc": 9000},
    {"key": "transport", "label": "Transport", "icon": "🚍", "alloc": 4000},
    {"key": "utilities", "label": "Utilities & Rent", "icon": "🏠", "alloc": 11000},
    {"key": "lifestyle", "label": "Lifestyle & Family", "icon": "👨‍👩‍👧", "alloc": 4000},
    {"key": "health", "label": "Health", "icon": "🏥", "alloc": 2000},
    {"key": "others", "label": "Others", "icon": "🗂️", "alloc": 0},
]
DEFAULT_GOALS = [
    {"name": "Eid Shopping", "icon": "🛍️", "target": 15000, "saved": 0, "perDay": 200},
    {"name": "Emergency Fund", "icon": "🛡️", "target": 60000, "saved": 0, "perDay": 500},
    {"name": "Send Home (village)", "icon": "🏡", "target": 5000, "saved": 0, "perDay": 250},
]


def _root(uid: str) -> str:
    return f"data/{uid}"


def _seed_if_empty(uid: str) -> None:
    if ref(_root(uid)).get():
        return
    ref(f"{_root(uid)}/budget").set(
        {"income": DEFAULT_INCOME, "categories": DEFAULT_CATEGORIES}
    )
    goals = {uuid.uuid4().hex: dict(g) for g in DEFAULT_GOALS}
    ref(f"{_root(uid)}/goals").set(goals)
    ref(f"{_root(uid)}/arcade").set({"points": 0, "done": {}})


def _ensure_default_categories(uid: str, budget: dict) -> list[dict]:
    cats = budget.get("categories") or []
    existing = {c.get("key") for c in cats}
    missing = [dict(dc) for dc in DEFAULT_CATEGORIES if dc["key"] not in existing]
    if missing:
        cats = cats + missing
        ref(f"{_root(uid)}/budget/categories").set(cats)
    return cats


def _list_with_ids(node: dict | None) -> list[dict]:
    if not node:
        return []
    return [{"id": k, **v} for k, v in node.items()]


class CategoryIn(BaseModel):
    key: str
    label: str
    icon: str = "💰"
    alloc: float = Field(ge=0)


class BudgetIn(BaseModel):
    income: float = Field(ge=0)
    categories: list[CategoryIn]


class ExpenseIn(BaseModel):
    catKey: str
    catLabel: str
    note: str = ""
    amt: float = Field(gt=0)


class GoalIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    icon: str = "🎯"
    target: float = Field(gt=0)
    perDay: float = Field(default=300, gt=0)


class GoalUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=60)
    icon: str | None = None
    target: float | None = Field(default=None, gt=0)
    saved: float | None = Field(default=None, ge=0)
    perDay: float | None = Field(default=None, gt=0)


class DepositIn(BaseModel):
    amount: float = Field(gt=0)


class CompleteIn(BaseModel):
    id: str
    points: int = Field(ge=0, le=1000)


class SmsMessage(BaseModel):
    sender: str = ""
    body: str
    ts: int | None = None


class IngestIn(BaseModel):
    messages: list[SmsMessage]


class CategorizeIn(BaseModel):
    catKey: str
    catLabel: str
    note: str = ""


class SaveGoalIn(BaseModel):
    goalId: str


def _safe_key(s: str) -> str:
    return re.sub(r"[.#$\[\]/]", "_", s)[:120]


def _dedup_key(sender: str, body: str, parsed: dict) -> str:
    trx = parsed.get("trxId")
    if trx:
        return _safe_key(f"{parsed.get('provider', 'x')}_{trx}")
    base = f"{sender}|{parsed.get('amount')}|{body}"
    return "h_" + hashlib.sha1(base.encode("utf-8")).hexdigest()[:24]


def _log_txn(uid: str, ttype: str, direction: str, amount: float, label: str, **extra) -> dict:
    tid = uuid.uuid4().hex
    entry = {
        "type": ttype,
        "direction": direction,
        "amount": float(amount or 0),
        "label": label or "",
        "note": extra.get("note", ""),
        "provider": extra.get("provider", ""),
        "catLabel": extra.get("catLabel", ""),
        "goalName": extra.get("goalName", ""),
        "source": extra.get("source", "manual"),
        "ts": int(extra.get("ts") or time.time() * 1000),
    }
    ref(f"{_root(uid)}/transactions/{tid}").set(entry)
    return {"id": tid, **entry}


@router.get("/overview")
def overview(user: UserOut = Depends(current_user)):
    _seed_if_empty(user.uid)
    root = ref(_root(user.uid)).get() or {}
    budget = root.get("budget", {}) or {}
    categories = _ensure_default_categories(user.uid, budget)
    expenses = _list_with_ids(root.get("expenses"))
    expenses.sort(key=lambda e: e.get("ts", 0), reverse=True)
    goals = _list_with_ids(root.get("goals"))
    arcade = root.get("arcade", {"points": 0, "done": {}})
    pending = _list_with_ids(root.get("pending"))
    pending.sort(key=lambda e: e.get("ts", 0), reverse=True)

    if root.get("transactions") is None and expenses:
        for e in expenses:
            _log_txn(
                user.uid,
                "expense",
                "out",
                e.get("amt", 0),
                e.get("note") or e.get("catLabel", ""),
                catLabel=e.get("catLabel", ""),
                source="manual",
                ts=e.get("ts"),
            )
    transactions = _list_with_ids(ref(f"{_root(user.uid)}/transactions").get())
    transactions.sort(key=lambda t: t.get("ts", 0), reverse=True)

    return {
        "income": budget.get("income", DEFAULT_INCOME),
        "categories": categories,
        "expenses": expenses,
        "goals": goals,
        "arcade": arcade,
        "pending": pending,
        "transactions": transactions,
    }


@router.put("/budget")
def set_budget(body: BudgetIn, user: UserOut = Depends(current_user)):
    ref(f"{_root(user.uid)}/budget").set(
        {"income": body.income, "categories": [c.model_dump() for c in body.categories]}
    )
    return {"ok": True}


@router.post("/reset")
def reset_budget(user: UserOut = Depends(current_user)):
    root = _root(user.uid)
    budget = ref(f"{root}/budget").get() or {}
    income = budget.get("income", DEFAULT_INCOME)
    categories = [{**dict(c), "alloc": 0} for c in DEFAULT_CATEGORIES]
    ref(f"{root}/budget").set({"income": income, "categories": categories})
    ref(f"{root}/expenses").delete()
    return {"ok": True}


@router.post("/expenses", status_code=201)
def add_expense(body: ExpenseIn, user: UserOut = Depends(current_user)):
    eid = uuid.uuid4().hex
    entry = {
        "catKey": body.catKey,
        "catLabel": body.catLabel,
        "note": body.note.strip(),
        "amt": body.amt,
        "ts": int(time.time() * 1000),
    }
    ref(f"{_root(user.uid)}/expenses/{eid}").set(entry)
    _log_txn(
        user.uid,
        "expense",
        "out",
        body.amt,
        entry["note"] or body.catLabel,
        catLabel=body.catLabel,
        source="manual",
        ts=entry["ts"],
    )
    return {"id": eid, **entry}


@router.delete("/expenses/{eid}")
def delete_expense(eid: str, user: UserOut = Depends(current_user)):
    ref(f"{_root(user.uid)}/expenses/{eid}").delete()
    return {"ok": True}


@router.post("/goals", status_code=201)
def add_goal(body: GoalIn, user: UserOut = Depends(current_user)):
    gid = uuid.uuid4().hex
    goal = {
        "name": body.name.strip(),
        "icon": body.icon,
        "target": body.target,
        "saved": 0,
        "perDay": body.perDay,
    }
    ref(f"{_root(user.uid)}/goals/{gid}").set(goal)
    return {"id": gid, **goal}


@router.put("/goals/{gid}")
def update_goal(gid: str, body: GoalUpdate, user: UserOut = Depends(current_user)):
    path = f"{_root(user.uid)}/goals/{gid}"
    node = ref(path).get()
    if not node:
        raise HTTPException(status_code=404, detail="Goal not found.")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    new_target = updates.get("target", node["target"])
    new_saved = updates.get("saved", node.get("saved", 0))
    updates["saved"] = max(0, min(new_saved, new_target))

    ref(path).update(updates)
    return {"id": gid, **node, **updates}


@router.post("/goals/{gid}/deposit")
def deposit(gid: str, body: DepositIn, user: UserOut = Depends(current_user)):
    node = ref(f"{_root(user.uid)}/goals/{gid}").get()
    if not node:
        raise HTTPException(status_code=404, detail="Goal not found.")
    saved = min(node["target"], node.get("saved", 0) + body.amount)
    ref(f"{_root(user.uid)}/goals/{gid}/saved").set(saved)
    _log_txn(
        user.uid,
        "saving",
        "out",
        body.amount,
        node.get("name", "Goal"),
        goalName=node.get("name", ""),
        source="manual",
    )
    return {"id": gid, **node, "saved": saved}


@router.delete("/goals/{gid}")
def delete_goal(gid: str, user: UserOut = Depends(current_user)):
    ref(f"{_root(user.uid)}/goals/{gid}").delete()
    return {"ok": True}


@router.post("/arcade/complete")
def complete_activity(body: CompleteIn, user: UserOut = Depends(current_user)):
    arcade = ref(f"{_root(user.uid)}/arcade").get() or {"points": 0, "done": {}}
    done = arcade.get("done") or {}
    if not done.get(body.id):
        done[body.id] = True
        arcade = {"points": arcade.get("points", 0) + body.points, "done": done}
        ref(f"{_root(user.uid)}/arcade").set(arcade)
    return arcade


@router.post("/sms/ingest")
def ingest_sms(body: IngestIn, user: UserOut = Depends(current_user)):
    root = _root(user.uid)
    seen = ref(f"{root}/seenTrx").get() or {}
    added = []
    for m in body.messages:
        parsed = parse_sms(m.sender, m.body)
        if not parsed or not parsed.get("amount"):
            continue
        key = _dedup_key(m.sender, m.body, parsed)
        if key in seen:
            continue
        seen[key] = True
        ts = m.ts or int(time.time() * 1000)
        pid = uuid.uuid4().hex
        entry = {
            "trxId": parsed.get("trxId") or "",
            "provider": parsed.get("provider") or "unknown",
            "kind": parsed.get("kind") or "transaction",
            "direction": parsed.get("direction") or "out",
            "amount": float(parsed.get("amount") or 0),
            "fee": float(parsed.get("fee") or 0),
            "counterparty": parsed.get("counterparty") or "",
            "suggestedCatKey": parsed.get("suggestedCatKey") or "others",
            "suggestedCatLabel": parsed.get("suggestedCatLabel") or "Others",
            "raw": parsed.get("raw") or m.body,
            "ts": ts,
        }
        if parsed.get("balance") is not None:
            entry["balance"] = float(parsed["balance"])
        ref(f"{root}/pending/{pid}").set(entry)
        ref(f"{root}/seenTrx/{key}").set(ts)
        added.append({"id": pid, **entry})
    added.sort(key=lambda e: e["ts"], reverse=True)
    return {"added": added, "count": len(added)}


@router.post("/pending/{pid}/categorize")
def categorize_pending(pid: str, body: CategorizeIn, user: UserOut = Depends(current_user)):
    root = _root(user.uid)
    node = ref(f"{root}/pending/{pid}").get()
    if not node:
        raise HTTPException(status_code=404, detail="Pending transaction not found.")
    eid = uuid.uuid4().hex
    entry = {
        "catKey": body.catKey,
        "catLabel": body.catLabel,
        "note": (body.note or node.get("counterparty") or "").strip(),
        "amt": float(node.get("amount") or 0),
        "ts": int(node.get("ts") or time.time() * 1000),
    }
    ref(f"{root}/expenses/{eid}").set(entry)
    kind = node.get("kind") or "transaction"
    _log_txn(
        user.uid,
        "sent" if kind == "send_money" else "expense",
        "out",
        entry["amt"],
        node.get("counterparty") or body.catLabel,
        catLabel=body.catLabel,
        provider=node.get("provider", ""),
        note=entry["note"],
        source="sms",
        ts=entry["ts"],
    )
    ref(f"{root}/pending/{pid}").delete()
    return {"expense": {"id": eid, **entry}}


@router.post("/pending/{pid}/save-goal")
def save_pending_to_goal(pid: str, body: SaveGoalIn, user: UserOut = Depends(current_user)):
    root = _root(user.uid)
    node = ref(f"{root}/pending/{pid}").get()
    if not node:
        raise HTTPException(status_code=404, detail="Pending transaction not found.")
    goal = ref(f"{root}/goals/{body.goalId}").get()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")
    saved = min(goal["target"], goal.get("saved", 0) + float(node.get("amount") or 0))
    ref(f"{root}/goals/{body.goalId}/saved").set(saved)
    _log_txn(
        user.uid,
        "income",
        "in",
        float(node.get("amount") or 0),
        node.get("counterparty") or "Received",
        provider=node.get("provider", ""),
        goalName=goal.get("name", ""),
        note=f"Saved to {goal.get('name', '')}",
        source="sms",
        ts=node.get("ts"),
    )
    ref(f"{root}/pending/{pid}").delete()
    return {"goal": {"id": body.goalId, **goal, "saved": saved}}


@router.delete("/pending/{pid}")
def dismiss_pending(pid: str, user: UserOut = Depends(current_user)):
    ref(f"{_root(user.uid)}/pending/{pid}").delete()
    return {"ok": True}
