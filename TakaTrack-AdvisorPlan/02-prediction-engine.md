# 02 — The Prediction Engine

> "predict my condition if I continue to exceed my expenditure per day"

This is the feature that makes TakaTrack feel intelligent. It answers one question:

**"If I keep spending like this, what happens — and when?"**

It outputs three things the rest of the app consumes:

1. A **status**: `on_track` / `at_risk` / `overspending`.
2. A **projected month-end number** (will you finish over or under budget).
3. A **"broke day"** — the date you run out of money if nothing changes.

We build it in **three tiers**. Ship tier 1, upgrade later. Don't start with ML.

---

## Tier 1 — Heuristic run-rate (ship this first)

Pure arithmetic. No training data needed. Works on day one for a brand-new user.

```python
def project(spent_so_far, month_day, days_in_month, budget):
    daily_run_rate = spent_so_far / month_day
    days_left      = days_in_month - month_day
    projected      = spent_so_far + daily_run_rate * days_left
    safe_daily     = (budget - spent_so_far) / days_left if days_left else 0

    if projected <= budget * 0.95:
        status = "on_track"
    elif projected <= budget * 1.05:
        status = "at_risk"
    else:
        status = "overspending"

    # The "broke day": when cumulative projected spend crosses the budget
    broke_day = None
    if daily_run_rate > 0:
        day = ceil(budget / daily_run_rate)
        if day <= days_in_month:
            broke_day = day

    return {
        "status": status,
        "projected_month_end": round(projected),
        "overspend_amount": round(max(0, projected - budget)),
        "safe_daily_rate": round(safe_daily),
        "broke_on_day": broke_day,
    }
```

### The "what if I continue" scenario (the core ask)

This is a **simulation**, not just a projection. Roll the daily run-rate forward day by day and
record the running balance — that's what powers the chart and the warning.

```python
def simulate_forward(spent_so_far, daily_run_rate, month_day, days_in_month, budget):
    timeline = []
    cumulative = spent_so_far
    for day in range(month_day + 1, days_in_month + 1):
        cumulative += daily_run_rate
        timeline.append({
            "day": day,
            "cumulative_spend": round(cumulative),
            "remaining": round(budget - cumulative),   # goes negative = trouble
        })
    return timeline
```

Feed `timeline` to a chart on the dashboard: a **line that crosses zero** is far more visceral than
a number. Red zone after the crossing day.

---

## Tier 2 — Statistical (when you have ~1 month of data)

Run-rate assumes every day is average. Reality isn't: rent hits on the 1st, salary on the 7th,
weekends cost more. Tier 2 fixes the obvious errors cheaply.

- **Exclude one-off spikes** from the run-rate (rent, a one-time medical bill) so a single big day
  doesn't make the forecast scream. Detect via category (`needs/recurring`) or an outlier check
  (a day > 3× the median day).
- **Day-of-week weighting** — if Fridays/Saturdays are consistently 1.5× a weekday, weight the
  remaining days accordingly.
- **Exponential moving average (EMA)** instead of a flat mean, so recent behaviour counts more:
  `ema = α * today + (1 - α) * ema_prev` (α ≈ 0.3).
- **Known upcoming bills** — if the user marked a recurring expense (rent due on the 1st), add it to
  the forecast explicitly instead of smearing it across the month.

All still pure Python (`statistics` / a little `numpy`). No model files, no training job.

---

## Tier 3 — Machine learning (only if it earns its keep)

Add this **only** when tiers 1–2 are clearly leaving accuracy on the table and you have 2–3 months
of per-user history.

| Approach | Good for | Cost |
|----------|----------|------|
| **Holt-Winters / triple exponential smoothing** | Captures weekly seasonality with little data | Low — `statsmodels`, no GPU |
| **Prophet** (or a lightweight port) | Trend + multiple seasonalities + holidays (Eid spikes!) | Medium |
| **Small gradient-boosted regressor** (features: day-of-week, days-since-salary, category mix, rolling means) | Best accuracy, predicts *next-day* spend | Medium — `scikit-learn` |
| **Classifier for the status label** | Directly predict `on_track/at_risk/overspending` | Low |

**Eid is the killer feature for ML here** — spending spikes massively before Eid, and a model that
knows the Islamic calendar can warn users *weeks ahead* ("রমজানে খরচ সাধারণত ৪০% বাড়ে — এখন থেকে
৳200/দিন আলাদা রাখুন"). That's something no run-rate can do and a real reason to invest in tier 3.

**Where it runs:** all tiers run in the **FastAPI backend**, on-demand when the snapshot is built.
Tier 3 models are tiny — load once at startup, predict in milliseconds. No separate ML service
needed for an MVP.

---

## Turning prediction into a "future condition" narrative

The numbers are computed in Python; **Claude writes the story** (file 01). Example, from the same
projection:

> 🔴 **সতর্কতা: এই গতিতে চললে ২৭ তারিখে টাকা শেষ হয়ে যাবে।**
> মাস শেষে ৳1,992 ঘাটতি হবে। গত মাসেও একই হয়েছিল। আজ থেকে দিনে ৳383 এর মধ্যে থাকলে ঠিক
> থাকবেন — এখন আপনি দিনে ৳966 খরচ করছেন।

Optionally, a **"two futures" comparison** — the single most motivating screen you can build:

```
        If you continue            If you follow the plan
        ───────────────            ──────────────────────
Day 30   −৳1,992 (ঘাটতি)            +৳1,800 (উদ্বৃত্ত)
Goal     ঈদ: delayed 2 weeks        ঈদ: funded early
Streak   broken                     🔥 28 days
```

---

## Accuracy + honesty

- Always show prediction as a **range or "at this pace,"** never a false certainty.
- Track prediction error (predicted vs actual month-end) and **show the model improving** over time
  — "TakaTrack এর হিসাব এখন ৯২% সঠিক।" Builds trust.
- New users get tier 1 with a clear "এটা একটা আনুমানিক হিসাব, ডেটা বাড়লে আরও নিখুঁত হবে।"

---

## Build first

1. `project()` + `simulate_forward()` (tier 1) — a few hours, fully testable with fake data.
2. The dashboard chart (line crossing zero).
3. Feed `projection` into the advisor snapshot (file 01).
4. Defer tiers 2–3 until you have real usage data.
