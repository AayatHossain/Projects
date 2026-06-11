# 04 — Architecture & Data

How the four feature docs fit the **existing stack**:

- **Frontend:** Expo / React Native (TypeScript) — the 5 tabs you have today.
- **Backend:** FastAPI + Python (`app.main:app`, run via `backend/run.ps1`, uvicorn on :8000).
- **AI:** Claude (the চ্যাটবট already wired in the AI সহকারী tab).
- **Storage:** whatever the app uses now (local store / the backend `storage.py`).

Nothing here requires a new language or a new service. It's new modules on the stack you have.

---

## Component map

```
┌──────────────────────────── FRONTEND (Expo / RN) ────────────────────────────┐
│  হোম        খরচ        লক্ষ্য       AI সহকারী      গেম (new)      সেটিং        │
│   │          │          │            │              │             │            │
│   │  verdict │  log     │ goals      │ chat +       │ quests /    │ budget,    │
│   │  card +  │  expense │ deposit    │ advisor      │ score /     │ risk       │
│   │  chart   │          │            │ proactive    │ simulator   │ profile    │
└───┼──────────┼──────────┼────────────┼──────────────┼─────────────┼────────────┘
    │          │          │            │              │             │
    └──────────┴──────────┴──── HTTPS / JSON ─────────┴─────────────┘
                                  │
┌─────────────────────────── BACKEND (FastAPI) ────────────────────────────────┐
│  routers/                                                                     │
│    expenses.py   goals.py   advisor.py(new)   predict.py(new)   game.py(new)  │
│                                  │                  │               │         │
│  services/                       ▼                  ▼               ▼         │
│    snapshot.py ──── builds the "financial state" (file 01 §2)                 │
│    predictor.py ─── project() + simulate_forward() (file 02)                  │
│    advisor.py ───── gate + instrument match, then calls Claude                │
│    scoring.py ───── Financial Health Score (file 03)                          │
│                                  │                                            │
│  storage.py (existing) ── expenses, goals, settings, game progress            │
└──────────────────────────────────┼───────────────────────────────────────────┘
                                    ▼
                              Claude API (Bangla explanation layer)
```

**Golden rule:** Python computes the numbers (deterministic, correct, testable). Claude only turns
numbers into Bangla persuasion. Never ask the LLM to do the arithmetic.

---

## Data model (additions)

```jsonc
// settings (extend existing)
{
  "monthly_budget": 22000,
  "income_band": 25000,
  "risk_profile": "conservative",     // conservative | balanced | growth
  "islamic_only": false,
  "recurring_bills": [                 // helps tier-2 prediction (file 02)
    { "name": "বাড়িভাড়া", "amount": 8000, "due_day": 1, "bucket": "needs" }
  ]
}

// expense (extend existing) — add a bucket for 50/30/20
{ "id": "...", "amount": 450, "note": "CNG", "category": "যানবাহন",
  "bucket": "needs", "date": "2026-06-18", "is_oneoff": false }

// goal (existing) — unchanged

// game_progress (new)
{ "level": 3, "xp": 740, "badges": ["budget_master", "save_first"],
  "health_score": 62, "streak": 11 }

// prediction_log (new — to measure accuracy over time, file 02)
{ "month": "2026-06", "predicted_end": 23992, "actual_end": null }
```

The one schema change that touches everything: **every expense gets a `bucket`** (needs / wants /
savings). Auto-classify by category (rent→needs, eating out→wants, DPS→savings) with a manual
override. This single field powers 50/30/20 in the advisor, the prediction categories, and the game.

---

## API endpoints (new)

| Method | Path | Returns |
|--------|------|---------|
| `GET`  | `/api/snapshot` | The full financial-state snapshot (file 01 §2) |
| `GET`  | `/api/predict` | `{ status, projected_month_end, broke_on_day, timeline[] }` |
| `POST` | `/api/advisor/verdict` | Daily verdict card (calls Claude with snapshot) |
| `POST` | `/api/advisor/chat` | Existing chat, now with snapshot context |
| `GET`  | `/api/advisor/invest` | Eligible instruments after the gate (file 01 §4) |
| `GET`  | `/api/game/state` | level, xp, badges, health_score |
| `POST` | `/api/game/event` | submit a quest/challenge result → XP, unlocks |

---

## Sequence: logging an expense (the whole system in one flow)

```
User logs ৳450 CNG
   → POST /api/expenses           (existing)
   → services/snapshot.py rebuilds state
   → services/predictor.py updates projection
   → if status worsened to at_risk/overspending:
        services/advisor.py calls Claude → verdict
        → push notification + হোম card
   → services/scoring.py updates Health Score
   → frontend refreshes হোম (bar, streak, score, verdict)
```

---

## Privacy & safety

- Financial data is sensitive — keep computation **on the backend you control**, send Claude only
  the minimal snapshot needed (no names, no account numbers).
- Ship the **not-licensed-advice disclaimer** (README) on every investment recommendation.
- Rate-limit / cache Claude calls — don't call the API on every keystroke; build the verdict at most
  once per logged expense or once daily.

---

## Suggested phasing (maps to README build order)

1. **Phase 1:** `bucket` field + `snapshot.py` + `predictor.py` tier 1 + হোম chart. *(predictive)*
2. **Phase 2:** `advisor.py` verdict + chat-with-context. *(prescriptive)*
3. **Phase 3:** investment gate + instrument menu.
4. **Phase 4:** game level 1, XP/streak wiring, Health Score.

See [flow.html](flow.html) for the same plan as an interactive diagram.
