import { api, Arcade, Category, Expense, Goal } from './api';

export type ChatTurn = { role: 'user' | 'model'; text: string };

type GenOpts = { temperature?: number; maxOutputTokens?: number };

export async function askAI(
  token: string,
  history: ChatTurn[],
  systemText: string,
  opts: GenOpts = {},
): Promise<string> {
  const { text } = await api.ai.chat(token, {
    system: systemText,
    messages: history,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxOutputTokens ?? 400,
  });
  if (!text.trim()) {
    throw new Error('Empty response from the model.');
  }
  return text.trim();
}

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

export async function generateInsight(
  token: string,
  d: FinanceData,
  avoid: string[] = [],
  lang: 'en' | 'bn' = 'en',
): Promise<string> {
  const language = lang === 'bn' ? 'Bangla (বাংলা)' : 'English';
  const system = [
    `You are the financial assistant for TakaTrack, a budgeting app used in Bangladesh (currency Bangladeshi Taka, ৳).`,
    `Write ONE proactive insight for the home screen: a single tip, observation, or encouragement based on the snapshot below.`,
    `Rules: 1-2 sentences, max ~35 words. Be specific and use the user's real numbers. Friendly and practical. No greeting, no preamble, no markdown — just the insight sentence. If data is thin, give a useful general budgeting nudge.`,
    `Always write money with the ৳ sign (e.g. ৳500); never use "Tk", "TK", "BDT", "₹", "₳" or any other currency symbol.`,
    `Write the insight in ${language}.`,
    ``,
    buildSnapshot(d),
  ].join('\n');

  const ask =
    avoid.length > 0
      ? `Give me a different insight from a fresh angle. Do NOT repeat the meaning of these:\n${avoid.map((a) => `- ${a}`).join('\n')}`
      : `Give me an insight.`;

  const text = await askAI(token, [{ role: 'user', text: ask }], system, {
    temperature: 1.0,
    maxOutputTokens: 200,
  });
  return normalizeCurrency(text);
}

export function normalizeCurrency(s: string): string {
  return s
    .replace(/[₹₨₳﷼₴₦]/g, '৳')
    .replace(/à§³|â‚³|â‚¹|Ã·|â‚¨/g, '৳')
    .replace(/\b(?:BDT|Tk|TK)\.?\s?(?=\d)/g, '৳')
    .replace(/৳\s+(?=\d)/g, '৳')
    .trim();
}

function parseInsightList(text: string, count: number): string[] {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end > start) {
    try {
      const arr = JSON.parse(cleaned.slice(start, end + 1));
      if (Array.isArray(arr)) {
        const items = arr.map((x) => String(x).trim()).filter(Boolean);
        if (items.length > 0) return items.slice(0, count).map(normalizeCurrency);
      }
    } catch {}
  }

  let parts = cleaned
    .split('\n')
    .map((l) => l.replace(/^\s*(\d+[.)]|[-•*])\s*/, '').trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    parts = cleaned
      .split(/\s*(?:\d+[.)]|[-•*])\s+/)
      .map((s) => s.replace(/^["'\s]+|["',\s]+$/g, '').trim())
      .filter(Boolean);
  }

  return parts.slice(0, count).map(normalizeCurrency);
}

export async function generateInsights(
  token: string,
  d: FinanceData,
  count = 5,
  lang: 'en' | 'bn' = 'en',
): Promise<string[]> {
  const language = lang === 'bn' ? 'Bangla (বাংলা)' : 'English';
  const system = [
    `You are the financial assistant for TakaTrack, a budgeting app used in Bangladesh (currency Bangladeshi Taka, ৳).`,
    `Write ${count} DIFFERENT proactive insights based on the snapshot below — each a tip, observation, or encouragement covering a different angle (spending, a specific category, a savings goal, budget balance, a habit).`,
    `Rules per insight: 1-2 sentences, max ~35 words, specific and using the user's real numbers, friendly and practical. No markdown.`,
    `Always write money with the ৳ sign (e.g. ৳500); never use "Tk", "TK", "BDT", "₹", "₳" or any other currency symbol.`,
    `Reply with ONLY a JSON array of exactly ${count} strings, like ["first insight", "second insight"]. No object keys, no extra text, no code fences.`,
    `Write each insight in ${language}.`,
    ``,
    buildSnapshot(d),
  ].join('\n');

  const text = await askAI(token, [{ role: 'user', text: `Give me ${count} insights as a JSON array.` }], system, {
    temperature: 0.8,
    maxOutputTokens: 700,
  });

  return parseInsightList(text, count);
}
