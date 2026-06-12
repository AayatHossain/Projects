import { Arcade, Category, Expense, Goal } from './api';

// OpenAI client. The key is read from .env (EXPO_PUBLIC_OPENAI_API_KEY), which is
// gitignored so it never lands in git/GitHub. ⚠️ EXPO_PUBLIC_ vars are still baked
// into the client bundle — fine for testing, but before real users move this call
// to the backend and keep the key server-side (it sees financial data).
const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const MODEL = 'gpt-4o-mini';
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export type ChatTurn = { role: 'user' | 'model'; text: string };

type GenOpts = { temperature?: number; maxOutputTokens?: number };

/**
 * Send a conversation to the model with a system instruction. Returns the reply
 * text, or throws on error.
 */
export async function askAI(
  history: ChatTurn[],
  systemText: string,
  opts: GenOpts = {},
): Promise<string> {
  if (!OPENAI_KEY) {
    throw new Error('Missing API key. Add EXPO_PUBLIC_OPENAI_API_KEY to .env and restart the dev server.');
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemText },
        // OpenAI uses 'assistant' where our ChatTurn uses 'model'.
        ...history.map((t) => ({ role: t.role === 'model' ? 'assistant' : 'user', content: t.text })),
      ],
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxOutputTokens ?? 400,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || `HTTP ${res.status}`);
  }
  const text = json?.choices?.[0]?.message?.content ?? '';
  if (!text.trim()) {
    throw new Error('Empty response from the model.');
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
export async function generateInsight(
  d: FinanceData,
  avoid: string[] = [],
  lang: 'en' | 'bn' = 'en',
): Promise<string> {
  const language = lang === 'bn' ? 'Bangla (বাংলা)' : 'English';
  const system = [
    `You are the financial assistant for TakaTrack, a budgeting app used in Bangladesh (currency Bangladeshi Taka, ৳).`,
    `Write ONE proactive insight for the home screen: a single tip, observation, or encouragement based on the snapshot below.`,
    `Rules: 1-2 sentences, max ~35 words. Be specific and use the user's real numbers. Friendly and practical. No greeting, no preamble, no markdown — just the insight sentence. If data is thin, give a useful general budgeting nudge.`,
    `Write the insight in ${language}.`,
    ``,
    buildSnapshot(d),
  ].join('\n');

  const ask =
    avoid.length > 0
      ? `Give me a different insight from a fresh angle. Do NOT repeat the meaning of these:\n${avoid.map((a) => `- ${a}`).join('\n')}`
      : `Give me an insight.`;

  return askAI([{ role: 'user', text: ask }], system, {
    temperature: 1.0, // higher = more variety across reloads
    maxOutputTokens: 200,
  });
}

/**
 * Generate several distinct insights in a single API call (cheaper than N calls).
 * Returns an array of insight strings.
 */
export async function generateInsights(
  d: FinanceData,
  count = 5,
  lang: 'en' | 'bn' = 'en',
): Promise<string[]> {
  const language = lang === 'bn' ? 'Bangla (বাংলা)' : 'English';
  const system = [
    `You are the financial assistant for TakaTrack, a budgeting app used in Bangladesh (currency Bangladeshi Taka, ৳).`,
    `Write ${count} DIFFERENT proactive insights based on the snapshot below — each a tip, observation, or encouragement covering a different angle (spending, a specific category, a savings goal, budget balance, a habit).`,
    `Rules per insight: 1-2 sentences, max ~35 words, specific and using the user's real numbers, friendly and practical. No markdown.`,
    `Output format: exactly ${count} insights, ONE per line, with NO numbering, bullets, or blank lines between them.`,
    `Write everything in ${language}.`,
    ``,
    buildSnapshot(d),
  ].join('\n');

  const text = await askAI([{ role: 'user', text: `Give me ${count} insights.` }], system, {
    temperature: 1.0,
    maxOutputTokens: 500,
  });

  // Split into lines, strip any stray numbering/bullets the model may add.
  return text
    .split('\n')
    .map((l) => l.replace(/^\s*(\d+[.)]|[-•*])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, count);
}
