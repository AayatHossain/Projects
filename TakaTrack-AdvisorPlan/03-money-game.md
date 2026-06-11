# 03 — The Money-Habits Game

> "maybe a game system to learn important money habits like the 50/30/20 rule"

People don't learn money habits from a lecture — they learn from **consequences they can feel
without real risk**. The game turns financial principles into quests, levels, and a simulated life
where mistakes are cheap. It plugs into the **fire-streak you already have**.

---

## Design principle

**Teach by doing, reward by streak, reinforce with the real app.**

The game isn't separate trivia — its lessons map 1:1 to actions in the real app. Finish the
"Emergency Fund" quest in the game → the app nudges you to start a real emergency-fund goal.

---

## The core curriculum (what the game teaches)

Ordered easiest → hardest. Each is a **level** with a quest, a simulation, and a badge.

| Lvl | Habit | Core lesson | Badge |
|----|-------|-------------|-------|
| 1 | **50/30/20 rule** | Split income into Needs/Wants/Savings (see README for the correct ratios) | 🧮 বাজেট মাস্টার |
| 2 | **Pay yourself first** | Move savings *before* spending, not from leftovers | 💰 আগে সঞ্চয় |
| 3 | **Emergency fund** | Build 3 months of Needs before anything else | 🛡️ নিরাপত্তা বলয় |
| 4 | **Needs vs Wants** | Classify real expenses correctly under pressure | 🎯 সঠিক হিসাব |
| 5 | **Avoid bad debt** | High-interest loans beat most investments — kill them first | ⛓️‍💥 ঋণমুক্ত |
| 6 | **Compounding** | Why ৳500/month for 10 years ≠ ৳60,000 | 📈 চক্রবৃদ্ধি |
| 7 | **Invest by horizon/risk** | Match instrument to goal (DPS vs Sanchayapatra vs stocks) | 🏦 বিনিয়োগকারী |
| 8 | **Beat lifestyle inflation** | When income rises, raise savings — not just spending | 🚀 সম্পদ গঠন |

---

## Game mechanics

### 1. Scenario simulator ("Your Bengali Life")

The flagship mode. The player lives a simulated month and makes real-feeling decisions:

```
💸 বেতন এসেছে: ৳25,000
   কীভাবে ভাগ করবেন?
   [ প্রয়োজন ___ ]  [ ইচ্ছা ___ ]  [ সঞ্চয় ___ ]

   → Player picks 70/30/0.
   → "সঞ্চয় ০? এই মাসে একটা দুর্ঘটনা হলে কী করবেন?"

⚡ হঠাৎ: মোবাইল নষ্ট, সারাতে ৳3,000 লাগবে।
   [ সঞ্চয় থেকে দিন ]  [ ধার করুন (১৫% সুদ) ]  [ ইচ্ছা বাদ দিন ]

   → No savings → forced to borrow → debt spiral demonstrated, harmlessly.
```

Events are **Bangladesh-real**: Eid shopping pressure, family remittance requests (গ্রামে পাঠানো),
CNG fare hikes, a wedding invitation, a medical bill, a bonus. Each teaches one principle.

### 2. XP, levels, and streaks (reuse the fire-streak)

- **XP** for completing quests and for *real* good behaviour in the app (logging daily, staying
  under safe-rate, funding the savings bucket).
- The existing **🔥 fire-streak** becomes the game's streak — logging daily already feeds it.
- **Levels unlock** the next lesson, so it's paced, not overwhelming.

### 3. Daily challenges (tie game ↔ real app)

- "আজ wants বাজেটের নিচে থাকুন" → +20 XP, checked against real logged spend.
- "৩ দিন টানা log করুন" → streak bonus.
- "একটা goal-এ ৳100 deposit করুন" → +XP, and it's a real deposit.

This is the trick: **the game rewards real financial behaviour**, so playing it literally improves
the user's finances.

### 4. Badges + a "Financial Health Score"

A single 0–100 score the user can grow, computed from real data:

```
score = w1 * (savings_rate vs 20% target)
      + w2 * (emergency_fund_months / 3, capped)
      + w3 * (logging_streak)
      + w4 * (staying under safe-rate)
      − w5 * (high-interest debt load)
```

Show it on হোম next to the streak. It's the long-term number the whole app moves toward.

---

## The 50/30/20 level in detail (Level 1)

Because this is the rule you asked about, here's the full lesson loop:

1. **Teach** — short Bangla card: the three buckets, the percentages, *why* 20% savings matters.
2. **Practice** — drag ৳25,000 into three buckets; the game shows if it sums to 100% and whether
   the split is healthy.
3. **Apply** — classify 8 real-style expenses (বাড়িভাড়া → Needs, Netflix → Wants, DPS → Savings).
4. **Reflect** — the game pulls the player's **actual last-month split** from TakaTrack and compares
   it to 50/30/20: "আপনার গত মাস: 64/30/6 — সঞ্চয় কম। কীভাবে ২০% এ যাবেন?"
5. **Reward** — 🧮 badge + unlock Level 2, and the advisor (file 01) now references the rule the user
   just learned.

> Note: the game teaches the **canonical 50/30/20** as the ideal. The advisor adapts it to the
> user's real income band (README explains why). Game = the principle; advisor = the personalised
> reality.

---

## Why gamification works here (and the trap to avoid)

- ✅ **Works:** low-risk practice, immediate feedback, streaks build habit, scores give a goal.
- ⚠️ **Trap:** don't reward *playing* over *real saving*. Tie XP to real behaviour wherever
  possible, or you train people to grind a game instead of managing money.

---

## Build first

1. Level 1 (50/30/20) as a self-contained screen — drag-to-bucket + classify quiz.
2. Wire XP/streak to the existing fire-streak counter.
3. The scenario simulator (Level-by-level events) — build the engine once, add events as content.
4. Financial Health Score on হোম (reads the same snapshot as the advisor).
