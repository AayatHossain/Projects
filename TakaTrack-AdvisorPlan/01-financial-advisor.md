# 01 — The AI Financial Advisor

The advisor is the brain. It has two jobs:

1. **Expense control** — keep you inside a healthy budget and coach better habits.
2. **Investment guidance** — once you have surplus, point it at the right Bangladeshi instrument.

It is built on the **Claude chatbot you already have** (the 🤖 AI সহকারী tab), but upgraded from
"answers questions" to "proactively advises with numbers."

---

## 1. From chatbot to advisor

| Today (chatbot) | Next version (advisor) |
|-----------------|------------------------|
| Reactive — waits for you to ask | Proactive — sends a daily/weekly verdict |
| Knows your raw numbers | Knows your numbers **+ predictions + goals + risk profile** |
| General Bangla advice | Specific, numeric, actionable: "do X, save ৳Y" |
| No memory of past advice | Remembers what it told you and checks if you followed it |

### How it works (the loop)

```
Every time you log an expense (or once a day):
  1. Backend recomputes spend, run-rate, and the prediction (see file 02).
  2. A "financial state" snapshot is built (JSON).
  3. That snapshot is injected into Claude as context.
  4. Claude returns: a verdict + 1–3 concrete actions, in Bangla.
  5. The app shows it as a card on হোম and (optionally) a push notification.
```

The key change: **Claude never sees a blank slate.** Every call carries the full computed state so
its advice is grounded in real math, not vibes. The numbers are computed in Python (deterministic,
correct); Claude only does the *explaining and persuading* (what LLMs are good at).

---

## 2. The "financial state" snapshot (what Claude sees)

```jsonc
{
  "income_band": 25000,
  "month_day": 18,                 // today is the 18th
  "days_left": 12,
  "budget": 22000,
  "spent_so_far": 17400,
  "daily_run_rate": 966,           // spent_so_far / month_day
  "safe_daily_rate": 383,          // (budget - spent) / days_left
  "projection": {                  // from the prediction engine (file 02)
    "status": "at_risk",
    "projected_month_end": 23992,  // > budget → overspend
    "overspend_amount": 1992,
    "broke_on_day": 27
  },
  "categories": {                  // 50/30/20 buckets, auto-classified
    "needs":   { "spent": 12800, "target": 11000, "over": true },
    "wants":   { "spent": 4100,  "target": 6600,  "over": false },
    "savings": { "spent": 500,   "target": 4400,  "over": false }
  },
  "goals": [
    { "name": "ঈদের কেনাকাটা", "target": 15000, "saved": 6000, "deadline_days": 40 }
  ],
  "risk_profile": "conservative",
  "last_advice": "CNG-তে দিনে ৳40 কমান",   // did they follow it?
  "followed_last_advice": false
}
```

This snapshot is the single most important artifact — every advisor feature reads from it.

---

## 3. Expense-control coaching

The advisor turns the prediction into **specific, smallest-possible changes**. Principles:

- **Target the wants bucket first**, never the needs. Telling someone to skip rent is useless.
- **One lever at a time.** "Cut ৳40/day on CNG" beats "spend less overall."
- **Show the payoff in their goal's terms.** "That ৳40/day = ঈদ shopping funded 9 days early."
- **Bangla, warm, non-judgmental.** A finance app that scolds gets deleted.

### Example outputs

> 🟡 **এই মাসে ৳1,992 বেশি খরচ হতে পারে।**
> বাইরে খাওয়া (wants) বাজেটের ১৩% বেশি। সপ্তাহে ২ দিন বাসায় খেলে ৳1,600 বাঁচবে — তখন ঈদের
> লক্ষ্য সময়ের আগেই পূরণ হবে।

> 🟢 **দারুণ! এই সপ্তাহে আপনি safe-rate এর নিচে আছেন।**
> ৳1,100 surplus জমেছে। চাইলে এটা DPS-এ রাখলে বছরে ~৳1,400 রিটার্ন আসবে।

---

## 4. Investment guidance (Bangladesh-specific)

Once the advisor detects **consistent surplus** (savings bucket regularly funded + an emergency
fund exists), it switches from "save more" to "make your money work." This is the part generic
budget apps don't do.

### The gate: don't invest before you're ready

The advisor enforces an order — it will **refuse** to recommend stocks to someone with no
emergency fund:

```
1. Emergency fund first  → 3 months of Needs, parked in bKash/Nagad savings or a bank account.
2. Kill high-interest debt → any loan/credit above ~12% APR beats most investments.
3. THEN invest the surplus → matched to risk profile + horizon (below).
```

### Bangladesh instrument menu (the advisor picks from these)

| Instrument | Risk | Typical return* | Horizon | When the advisor suggests it |
|------------|------|-----------------|---------|------------------------------|
| **bKash/Nagad savings, DPS** | Very low | ~7–9% | Short | Emergency fund, first-time saver |
| **Sanchayapatra** (সঞ্চয়পত্র) | Very low (govt-backed) | ~11–12% | 3–5 yr | Stable income, lump sum, low risk appetite |
| **FDR** (fixed deposit) | Low | ~7–9% | 1–3 yr | Has a lump sum, wants flexibility |
| **Mutual funds / DSE index** | Medium | variable | 3+ yr | Comfortable with ups/downs, long horizon |
| **Individual stocks (DSE)** | High | variable | 5+ yr | Experienced, surplus they can lose |
| **Gold** | Medium | inflation hedge | Long | Cultural store of value, diversification |
| **Shariah / Mudaraba / Islamic DPS** | Low–Med | variable | Varies | User wants interest-free (riba-free) options |

\* Rates change — the app shows them as *illustrative* and links to verify. **Never** present a
return as guaranteed.

### Risk profiling (3 questions on first run)

1. If your investment dropped 20% in a month, would you sell, hold, or buy more?
2. When do you need this money — under 1 year, 1–3 years, or 3+ years?
3. Do you want interest-free (Islamic) options only?

→ Produces `risk_profile: conservative | balanced | growth` + `islamic_only: bool`, stored and fed
to the advisor.

### How Claude is used here (safely)

- **Python decides** *what* is eligible (the gate, the risk match) — deterministic rules.
- **Claude explains** *why*, in Bangla, with the user's actual numbers, and answers follow-ups
  ("DPS আর Sanchayapatra এর মধ্যে আমার জন্য কোনটা ভালো?").
- Every investment message carries the disclaimer from the README.

---

## 5. Quick-prompt buttons (extend what exists)

Add advisor-aware prompts to the existing quick-prompt row:

- "আমি কোথায় বেশি খরচ করছি?" → reads categories, names the top over-budget bucket.
- "এই মাসে টিকতে পারব?" → reads the prediction, gives the date + the one fix.
- "আমার ৳5,000 কোথায় রাখব?" → runs the investment gate + suggests.
- "৫০/৩০/২০ আমার জন্য কেমন?" → explains the rule against their real split.

---

## 6. What to build first

1. Build the **snapshot builder** in the backend (pure Python, testable).
2. Wire it into the existing Claude call as context.
3. Add the **daily verdict card** on হোম.
4. Add the **investment gate + menu** as a second advisor mode.

Files this depends on: [02-prediction-engine.md](02-prediction-engine.md) (provides `projection`),
[04-architecture-and-data.md](04-architecture-and-data.md) (data model + endpoints).
