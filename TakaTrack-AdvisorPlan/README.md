# TakaTrack — Advanced Financial Advisor Plan

This folder is the **design + planning** package for the next phase of টাকাট্র্যাক (TakaTrack):
turning the budget tracker into an **AI financial advisor** that controls spending, guides
investment, **predicts your future financial condition**, and teaches money habits through a
**game system**.

Nothing here is final code — it's the blueprint. Read it, push back on it, then we build.

---

## The big idea

Right now TakaTrack is **descriptive** — it tells you what you spent.
The next version is **predictive + prescriptive** — it tells you what *will* happen and what to
*do about it*.

```
Today's app:   "You spent ৳12,400 this month on food."
Next version:  "At this pace you run out of money on the 24th. Cut CNG by ৳40/day
                and you'll instead finish ৳1,800 ahead — enough to start a DPS."
```

---

## What's in this folder

| File | What it covers |
|------|----------------|
| [01-financial-advisor.md](01-financial-advisor.md) | The AI advisor: expense control coaching + investment guidance (Bangladesh-specific instruments) |
| [02-prediction-engine.md](02-prediction-engine.md) | The model that forecasts your end-of-month condition if you keep overspending |
| [03-money-game.md](03-money-game.md) | The gamified learning system — the **50/30/20 rule** and other habits as quests/levels |
| [04-architecture-and-data.md](04-architecture-and-data.md) | How it all fits the existing Expo + FastAPI + Claude stack, data model, APIs |
| [prototype.html](prototype.html) | **Open this in a browser** — the finalized English MVP, fully interactive (log expenses, deposit to goals, take quizzes). AI text is dummy placeholder. |
| [flow.html](flow.html) | **Open this in a browser** — diagram of how the system fits together (data flow) |

---

## ⚠️ First, the rule you asked about

You wrote "50 30 30" and said you weren't sure. Here's the correct version:

### The 50/30/20 rule

Split your **after-tax monthly income** into three buckets:

| Bucket | Share | Means | TakaTrack categories |
|--------|-------|-------|----------------------|
| **Needs (প্রয়োজন)** | **50%** | Things you *must* pay | বাড়িভাড়া, যানবাহন, mobile/internet, groceries, utilities |
| **Wants (ইচ্ছা)** | **30%** | Nice but optional | eating out, shopping, entertainment, upgrades |
| **Savings + Debt (সঞ্চয়)** | **20%** | Future you | DPS, Sanchayapatra, emergency fund, loan repayment |

50 + 30 + 20 = **100%**. (50 + 30 + 30 = 110% — that's why it felt off.)

### Why we won't use it blindly for Bangladesh

The 50/30/20 rule was designed for higher-income Western households. For many Bangladeshi income
bands (৳5k–৳50k in your settings presets), **Needs already eat more than 50%** — rent and
transport alone can be 60%+. So TakaTrack will:

1. **Start** every user on 50/30/20 as the teaching baseline.
2. **Auto-adapt** the ratios to their real spending and income band (e.g. a **60/20/20** or
   **70/15/15** "survival mode" for tight months, or **40/20/40** "wealth-building mode" once
   income rises).
3. Explain *why* it changed the target — in Bangla — so the user learns, not just obeys.

The game (file 03) teaches the **canonical** 50/30/20 so the user understands the ideal; the
advisor (file 01) coaches them toward a **realistic, personalised** version.

---

## Build order (suggested)

1. **Prediction engine v1** (heuristic run-rate) — biggest "wow", smallest effort. → file 02
2. **Advisor coaching** wired to predictions + existing Claude chatbot. → file 01
3. **Investment guidance** module (Bangladesh instruments). → file 01
4. **Game system** layered on the existing fire-streak. → file 03

Each is independently shippable. We don't need all four to launch.

---

## Disclaimer to ship in the app

> TakaTrack provides general financial education, not licensed investment advice. Returns on
> Sanchayapatra, DPS, FDR, stocks, and mutual funds are not guaranteed. Verify current rates with
> your bank or Bangladesh Bank before investing.

This needs to be visible wherever the app recommends an investment product.
