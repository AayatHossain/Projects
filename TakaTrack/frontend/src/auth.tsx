import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { api, ApiUser } from './api';

const TOKEN_KEY = 'takatrack_token';

type AuthState = {
  token: string | null;
  user: ApiUser | null;
  loading: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On startup, restore a saved token and validate it against the backend.
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(TOKEN_KEY);
        if (saved) {
          const me = await api.me(saved);
          setToken(saved);
          setUser(me);
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY); // expired / invalid
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function persist(t: string, u: ApiUser) {
    await AsyncStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
  }

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      loading,
      register: async (name, email, password) => {
        const res = await api.register(name, email, password);
        await persist(res.token, res.user);
      },
      login: async (email, password) => {
        const res = await api.login(email, password);
        await persist(res.token, res.user);
      },
      logout: async () => {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      },
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
