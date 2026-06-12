// Gemini client. The key is read from .env (EXPO_PUBLIC_GEMINI_API_KEY), which is
// gitignored so it never lands in git/GitHub. ⚠️ EXPO_PUBLIC_ vars are still baked
// into the client bundle — fine for testing, but before real users move this call
// to the backend and keep the key server-side (it sees financial data).
const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export type ChatTurn = { role: 'user' | 'model'; text: string };

/**
 * Send the conversation to Gemini with a system instruction (the user's financial
 * snapshot + answer style). Returns the model's reply text, or throws on error.
 */
export async function askGemini(history: ChatTurn[], systemText: string): Promise<string> {
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
        temperature: 0.7,
        // Keep replies medium length — a few sentences, not an essay.
        maxOutputTokens: 400,
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
