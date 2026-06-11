import { createContext, useContext, useEffect, useState } from 'react';

import { api, Arcade, Category, Expense, Goal, Overview } from './api';
import { useAuth } from './auth';

type DataState = {
  loading: boolean;
  error: string | null;
  income: number;
  categories: Category[];
  expenses: Expense[];
  goals: Goal[];
  arcade: Arcade;
  refresh: () => Promise<void>;
  spentForCategory: (key: string) => number;
  totalSpent: () => number;
  // mutations
  logExpense: (e: { catKey: string; catLabel: string; note: string; amt: number }) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setIncome: (income: number) => Promise<void>;
  saveBudget: (income: number, categories: Category[]) => Promise<void>;
  addGoal: (g: { name: string; icon: string; target: number }) => Promise<void>;
  deposit: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  completeActivity: (id: string, points: number) => Promise<void>;
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

  function apply(o: Overview) {
    setIncomeState(o.income);
    setCategories(o.categories ?? []);
    setExpenses(o.expenses ?? []);
    setGoals(o.goals ?? []);
    setArcade(o.arcade ?? EMPTY_ARCADE);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function spentForCategory(key: string) {
    return expenses.filter((e) => e.catKey === key).reduce((s, e) => s + e.amt, 0);
  }
  function totalSpent() {
    return expenses.reduce((s, e) => s + e.amt, 0);
  }

  const value: DataState = {
    loading,
    error,
    income,
    categories,
    expenses,
    goals,
    arcade,
    refresh,
    spentForCategory,
    totalSpent,

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
    addGoal: async (g) => {
      const created = await api.data.addGoal(token!, g);
      setGoals((prev) => [...prev, created]);
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
