import { API_URL } from './config';

export type ApiUser = { uid: string; name: string; email: string };
export type AuthResponse = { token: string; user: ApiUser };

export type Category = { key: string; label: string; icon: string; alloc: number };
export type Expense = {
  id: string;
  catKey: string;
  catLabel: string;
  note: string;
  amt: number;
  ts: number;
};
export type Goal = {
  id: string;
  name: string;
  icon: string;
  target: number;
  saved: number;
  perDay: number;
};
export type Arcade = { points: number; done: Record<string, boolean> };
export type Overview = {
  income: number;
  categories: Category[];
  expenses: Expense[];
  goals: Goal[];
  arcade: Arcade;
};

export class ApiError extends Error {}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const { method = 'GET', body, token } = options;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      `Cannot reach the server at ${API_URL}. Is the backend running, and is the URL correct for your device?`,
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (data as { detail?: unknown }).detail;
    throw new ApiError(typeof detail === 'string' ? detail : 'Something went wrong.');
  }
  return data as T;
}

export const api = {
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: { name, email, password } }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),

  me: (token: string) => request<ApiUser>('/auth/me', { token }),

  ai: {
    // Proxy to the server-side LLM. The app never holds an AI key.
    chat: (
      token: string,
      body: {
        system: string;
        messages: { role: 'user' | 'model'; text: string }[];
        temperature?: number;
        max_tokens?: number;
      },
    ) => request<{ text: string }>('/ai/chat', { method: 'POST', token, body }),
  },

  data: {
    overview: (token: string) => request<Overview>('/data/overview', { token }),

    setBudget: (token: string, income: number, categories: Category[]) =>
      request<{ ok: boolean }>('/data/budget', {
        method: 'PUT',
        token,
        body: { income, categories },
      }),

    addExpense: (
      token: string,
      e: { catKey: string; catLabel: string; note: string; amt: number },
    ) => request<Expense>('/data/expenses', { method: 'POST', token, body: e }),

    deleteExpense: (token: string, id: string) =>
      request<{ ok: boolean }>(`/data/expenses/${id}`, { method: 'DELETE', token }),

    addGoal: (
      token: string,
      g: { name: string; icon: string; target: number; perDay?: number },
    ) => request<Goal>('/data/goals', { method: 'POST', token, body: g }),

    updateGoal: (
      token: string,
      id: string,
      patch: { name?: string; icon?: string; target?: number; saved?: number; perDay?: number },
    ) => request<Goal>(`/data/goals/${id}`, { method: 'PUT', token, body: patch }),

    deposit: (token: string, id: string, amount: number) =>
      request<Goal>(`/data/goals/${id}/deposit`, { method: 'POST', token, body: { amount } }),

    deleteGoal: (token: string, id: string) =>
      request<{ ok: boolean }>(`/data/goals/${id}`, { method: 'DELETE', token }),

    completeActivity: (token: string, id: string, points: number) =>
      request<Arcade>('/data/arcade/complete', { method: 'POST', token, body: { id, points } }),
  },
};
