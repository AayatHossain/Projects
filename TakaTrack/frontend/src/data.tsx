import { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { api, Arcade, Category, Expense, Goal, Overview, Pending, Transaction } from './api';
import { useAuth } from './auth';
import { notifyTransaction, setupNotifications } from './notify';
import { RawSms, sampleSms, scanSms } from './sms';

type DataState = {
  loading: boolean;
  error: string | null;
  income: number;
  categories: Category[];
  expenses: Expense[];
  goals: Goal[];
  arcade: Arcade;
  pending: Pending[];
  transactions: Transaction[];
  refresh: () => Promise<void>;
  spentForCategory: (key: string) => number;
  totalSpent: () => number;
  logExpense: (e: { catKey: string; catLabel: string; note: string; amt: number }) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setIncome: (income: number) => Promise<void>;
  saveBudget: (income: number, categories: Category[]) => Promise<void>;
  resetBudget: () => Promise<void>;
  addGoal: (g: { name: string; icon: string; target: number; perDay?: number }) => Promise<void>;
  updateGoal: (
    id: string,
    patch: { name?: string; icon?: string; target?: number; saved?: number; perDay?: number },
  ) => Promise<void>;
  deposit: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  completeActivity: (id: string, points: number) => Promise<void>;
  scanForSms: () => Promise<void>;
  simulateSms: () => Promise<void>;
  categorizePending: (id: string, catKey: string, catLabel: string, note?: string) => Promise<void>;
  savePendingToGoal: (id: string, goalId: string) => Promise<void>;
  dismissPending: (id: string) => Promise<void>;
};

const DataContext = createContext<DataState | undefined>(undefined);

const EMPTY_ARCADE: Arcade = { points: 0, done: {} };

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [income, setIncomeState] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [arcade, setArcade] = useState<Arcade>(EMPTY_ARCADE);
  const [pending, setPending] = useState<Pending[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  function apply(o: Overview) {
    setIncomeState(o.income);
    setCategories(o.categories ?? []);
    setExpenses(o.expenses ?? []);
    setGoals(o.goals ?? []);
    setArcade(o.arcade ?? EMPTY_ARCADE);
    setPending(o.pending ?? []);
    setTransactions(o.transactions ?? []);
  }

  async function ingest(messages: RawSms[]) {
    if (!token || messages.length === 0) return;
    try {
      const { added } = await api.data.ingestSms(token, messages);
      if (added.length === 0) return;
      setPending((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const fresh = added.filter((a) => !seen.has(a.id));
        return [...fresh, ...prev].sort((a, b) => b.ts - a.ts);
      });
      const top = added[0];
      await notifyTransaction(
        top.direction === 'in' ? 'Money received' : 'New transaction',
        `৳${Math.round(top.amount).toLocaleString('en-IN')}${top.counterparty ? ` · ${top.counterparty}` : ''} — tap to categorize`,
      );
    } catch {}
  }

  async function scanForSms() {
    const messages = await scanSms();
    await ingest(messages);
  }

  async function simulateSms() {
    await ingest(sampleSms());
  }

  async function refresh() {
    if (!token) return;
    setError(null);
    try {
      apply(await api.data.overview(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setupNotifications();
    scanForSms();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') scanForSms();
    });
    return () => sub.remove();
  }, [token]);

  function isThisMonth(ts: number) {
    const d = new Date(ts);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  function spentForCategory(key: string) {
    return expenses
      .filter((e) => e.catKey === key && isThisMonth(e.ts))
      .reduce((s, e) => s + e.amt, 0);
  }
  function totalSpent() {
    return expenses.filter((e) => isThisMonth(e.ts)).reduce((s, e) => s + e.amt, 0);
  }

  const value: DataState = {
    loading,
    error,
    income,
    categories,
    expenses,
    goals,
    arcade,
    pending,
    transactions,
    refresh,
    spentForCategory,
    totalSpent,
    scanForSms,
    simulateSms,

    categorizePending: async (id, catKey, catLabel, note = '') => {
      const { expense } = await api.data.categorizePending(token!, id, { catKey, catLabel, note });
      setExpenses((prev) => [expense, ...prev]);
      setPending((prev) => prev.filter((p) => p.id !== id));
    },
    savePendingToGoal: async (id, goalId) => {
      const { goal } = await api.data.savePendingToGoal(token!, id, goalId);
      setGoals((prev) => prev.map((g) => (g.id === goalId ? goal : g)));
      setPending((prev) => prev.filter((p) => p.id !== id));
    },
    dismissPending: async (id) => {
      await api.data.dismissPending(token!, id);
      setPending((prev) => prev.filter((p) => p.id !== id));
    },

    logExpense: async (e) => {
      const created = await api.data.addExpense(token!, e);
      setExpenses((prev) => [created, ...prev]);
    },
    deleteExpense: async (id) => {
      await api.data.deleteExpense(token!, id);
      setExpenses((prev) => prev.filter((x) => x.id !== id));
    },
    setIncome: async (value) => {
      await api.data.setBudget(token!, value, categories);
      setIncomeState(value);
    },
    saveBudget: async (newIncome, newCategories) => {
      await api.data.setBudget(token!, newIncome, newCategories);
      setIncomeState(newIncome);
      setCategories(newCategories);
    },
    resetBudget: async () => {
      await api.data.resetBudget(token!);
      await refresh();
    },
    addGoal: async (g) => {
      const created = await api.data.addGoal(token!, g);
      setGoals((prev) => [...prev, created]);
    },
    updateGoal: async (id, patch) => {
      const updated = await api.data.updateGoal(token!, id, patch);
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    },
    deposit: async (id, amount) => {
      const updated = await api.data.deposit(token!, id, amount);
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    },
    deleteGoal: async (id) => {
      await api.data.deleteGoal(token!, id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    },
    completeActivity: async (id, points) => {
      const updated = await api.data.completeActivity(token!, id, points);
      setArcade(updated);
    },
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
