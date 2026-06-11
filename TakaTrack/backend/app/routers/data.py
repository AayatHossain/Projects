"""User financial data: budget envelopes, expenses, goals, and the arcade.

Everything is stored under the authenticated user's uid in the Realtime
Database:

    /data/{uid}/budget                 = { income, categories: [ {key,label,icon,alloc} ] }
    /data/{uid}/expenses/{expId}       = { catKey, catLabel, note, amt, ts }
    /data/{uid}/goals/{goalId}         = { name, icon, target, saved, perDay }
    /data/{uid}/arcade                 = { points, done: { activityId: true } }

Per-category "spent" is derived from expenses (single source of truth), so
deleting an expense automatically frees its envelope.
"""
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..firebase import ref
from ..schemas import UserOut
from .auth import current_user

router = APIRouter(prefix="/data", tags=["data"])


# ---- defaults seeded for a brand-new user (mirrors the prototype) ----
DEFAULT_INCOME = 30000
DEFAULT_CATEGORIES = [
    {"key": "food", "label": "Food & Groceries", "icon": "🍚", "alloc": 9000},
    {"key": "transport", "label": "Transport", "icon": "🚍", "alloc": 4000},
    {"key": "utilities", "label": "Utilities & Rent", "icon": "🏠", "alloc": 11000},
    {"key": "lifestyle", "label": "Lifestyle & Family", "icon": "👨‍👩‍👧", "alloc": 4000},
    {"key": "savings", "label": "Savings", "icon": "🏦", "alloc": 2000},
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


def _list_with_ids(node: dict | None) -> list[dict]:
    if not node:
        return []
    return [{"id": k, **v} for k, v in node.items()]


# ---------------- schemas ----------------
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


class DepositIn(BaseModel):
    amount: float = Field(gt=0)


class CompleteIn(BaseModel):
    id: str
    points: int = Field(ge=0, le=1000)


# ---------------- endpoints ----------------
@router.get("/overview")
def overview(user: UserOut = Depends(current_user)):
    """Everything the app needs in one call (used by every tab)."""
    _seed_if_empty(user.uid)
    root = ref(_root(user.uid)).get() or {}
    budget = root.get("budget", {})
    expenses = _list_with_ids(root.get("expenses"))
    expenses.sort(key=lambda e: e.get("ts", 0), reverse=True)
    goals = _list_with_ids(root.get("goals"))
    arcade = root.get("arcade", {"points": 0, "done": {}})
    return {
        "income": budget.get("income", DEFAULT_INCOME),
        "categories": budget.get("categories", DEFAULT_CATEGORIES),
        "expenses": expenses,
        "goals": goals,
        "arcade": arcade,
    }


@router.put("/budget")
def set_budget(body: BudgetIn, user: UserOut = Depends(current_user)):
    ref(f"{_root(user.uid)}/budget").set(
        {"income": body.income, "categories": [c.model_dump() for c in body.categories]}
    )
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


@router.post("/goals/{gid}/deposit")
def deposit(gid: str, body: DepositIn, user: UserOut = Depends(current_user)):
    node = ref(f"{_root(user.uid)}/goals/{gid}").get()
    if not node:
        raise HTTPException(status_code=404, detail="Goal not found.")
    saved = min(node["target"], node.get("saved", 0) + body.amount)
    ref(f"{_root(user.uid)}/goals/{gid}/saved").set(saved)
    return {"id": gid, **node, "saved": saved}


@router.delete("/goals/{gid}")
def delete_goal(gid: str, user: UserOut = Depends(current_user)):
    ref(f"{_root(user.uid)}/goals/{gid}").delete()
    return {"ok": True}


@router.post("/arcade/complete")
def complete_activity(body: CompleteIn, user: UserOut = Depends(current_user)):
    """Award points the first time an activity (quiz/scenario) is completed."""
    arcade = ref(f"{_root(user.uid)}/arcade").get() or {"points": 0, "done": {}}
    done = arcade.get("done") or {}
    if not done.get(body.id):
        done[body.id] = True
        arcade = {"points": arcade.get("points", 0) + body.points, "done": done}
        ref(f"{_root(user.uid)}/arcade").set(arcade)
    return arcade
