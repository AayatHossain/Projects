import { Arcade, Category, Expense, Goal } from './api';

// Gemini client. The key is read from .env (EXPO_PUBLIC_GEMINI_API_KEY), which is
// gitignored so it never lands in git/GitHub. ⚠️ EXPO_PUBLIC_ vars are still baked
// into the client bundle — fine for testing, but before real users move this call
// to the backend and keep the key server-side (it sees financial data).
const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export type ChatTurn = { role: 'user' | 'model'; text: string };

type GenOpts = { temperature?: number; maxOutputTokens?: number };

/**
 * Send a conversation to Gemini with a system instruction. Returns the reply text,
 * or throws on error.
 */
export async function askGemini(
  history: ChatTurn[],
  systemText: string,
  opts: GenOpts = {},
): Promise<string> {
  if (!GEMINI_KEY) {
    throw new Error('Missing API key. Add EXPO_PUBLIC_GEMINI_API_KEY to .env and restart the dev server.');
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_KEY,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemText }] },
      contents: history.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
      generationConfig: {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.maxOutputTokens ?? 400,
        // gemini-2.5-flash is a "thinking" model — reasoning tokens otherwise eat the
        // maxOutputTokens budget and truncate short answers. We don't need it here.
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || `HTTP ${res.status}`);
  }
  const text = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') ?? '';
  if (!text.trim()) {
    const reason = json?.candidates?.[0]?.finishReason;
    throw new Error(reason ? `No answer (finishReason: ${reason}).` : 'Empty response from the model.');
  }
  return text.trim();
}

// ---- Shared financial context -------------------------------------------------

export type FinanceData = {
  name: string;
  income: number;
  categories: Category[];
  expenses: Expense[];
  goals: Goal[];
  arcade: Arcade;
  spentForCategory: (key: string) => number;
  totalSpent: () => number;
};

const taka = (n: number) => `৳${Math.round(n).toLocaleString('en-IN')}`;

/** Compact snapshot of the user's money the model can reason over (summaries only). */
export function buildSnapshot(d: FinanceData): string {
  const spent = d.totalSpent();
  const left = d.income - spent;

  const cats = d.categories
    .map((c) => `- ${c.label}: spent ${taka(d.spentForCategory(c.key))} of ${taka(c.alloc)} budget`)
    .join('\n');

  const recent = d.expenses
    .slice(0, 8)
    .map((e) => `- ${e.catLabel}: ${taka(e.amt)}${e.note ? ` (${e.note})` : ''}`)
    .join('\n');

  const goals = d.goals
    .map((g) => {
      const pct = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
      return `- ${g.name}: saved ${taka(g.saved)} of ${taka(g.target)} (${pct}%), needs ~${taka(g.perDay)}/day`;
    })
    .join('\n');

  return [
    `=== USER FINANCIAL SNAPSHOT ===`,
    `Name: ${d.name}`,
    `Monthly income: ${taka(d.income)}`,
    `Total spent this period: ${taka(spent)} (${taka(left)} remaining)`,
    ``,
    `Budget categories:`,
    cats || '(none set)',
    ``,
    `Recent expenses:`,
    recent || '(none yet)',
    ``,
    `Savings goals:`,
    goals || '(none yet)',
    ``,
    `Reward points: ${d.arcade.points}`,
    `=== END SNAPSHOT ===`,
  ].join('\n');
}

/**
 * Generate a single short insight for the home card. Pass previously shown
 * insights in `avoid` so a reload produces a fresh angle.
 */
export async function generateInsight(d: FinanceData, avoid: string[] = []): Promise<string> {
  const system = [
    `You are the financial assistant for TakaTrack, a budgeting app used in Bangladesh (currency Bangladeshi Taka, ৳).`,
    `Write ONE proactive insight for the home screen: a single tip, observation, or encouragement based on the snapshot below.`,
    `Rules: 1-2 sentences, max ~35 words. Be specific and use the user's real numbers. Friendly and practical. No greeting, no preamble, no markdown — just the insight sentence. If data is thin, give a useful general budgeting nudge.`,
    ``,
    buildSnapshot(d),
  ].join('\n');

  const ask =
    avoid.length > 0
      ? `Give me a different insight from a fresh angle. Do NOT repeat the meaning of these:\n${avoid.map((a) => `- ${a}`).join('\n')}`
      : `Give me an insight.`;

  return askGemini([{ role: 'user', text: ask }], system, {
    temperature: 1.0, // higher = more variety across reloads
    maxOutputTokens: 200,
  });
}
