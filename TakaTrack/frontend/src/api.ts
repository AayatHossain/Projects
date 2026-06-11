import { API_URL } from './config';

export type ApiUser = { uid: string; name: string; email: string };
export type AuthResponse = { token: string; user: ApiUser };

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
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  me: (token: string) => request<ApiUser>('/auth/me', { token }),
};
