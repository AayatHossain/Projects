import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'en' | 'bn';

const LANG_KEY = 'takatrack_lang';

// English is the source of truth for the set of keys. Add a key here first, then
// give it a Bangla value below. Use {placeholders} for interpolated values.
const en = {
  'common.logout': 'Log out',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.add': 'Add',
  'common.tryAgain': 'Try again.',
  'common.couldNotSave': 'Could not save',
  'lang.english': 'EN',
  'lang.bangla': 'বাং',

  'home.welcomeBack': 'Welcome back',
  'home.greeting': 'there',
  'home.spentThisMonth': 'Spent this month',
  'home.takaPoints': '{n} TakaPoints',
  'home.categories': '{n} categories',
  'home.aiInsight': 'AI INSIGHT',
  'home.readingFinances': 'Reading your finances…',
  'home.expenseProgress': 'Expense progress (by category)',
  'home.savingsProgress': 'Savings progress (goals)',
  'home.noGoals': 'No goals yet — add one in the Goals tab.',
  'home.insightError': 'Could not load insight.',

  'expenses.title': 'Expenses',
  'expenses.subtitle': 'Log spending in a tap',
  'expenses.enterDetails': 'Enter expense details',
  'expenses.custom': '+ Custom',
  'expenses.customPlaceholder': 'Custom {label} item',
  'expenses.selectedPrefix': 'Selected:',
  'expenses.noCategory': 'No category selected — tap one above.',
  'expenses.amountPlaceholder': '৳ amount',
  'expenses.notePlaceholder': 'note (optional)',
  'expenses.recent': 'Recent transactions',
  'expenses.noTransactions': 'No transactions yet.',
  'expenses.longPressHint': 'Long-press an entry to delete.',
  'expenses.pickCategoryTitle': 'Pick a category',
  'expenses.pickCategoryMsg': 'Tap a category above first.',
  'expenses.enterAmountTitle': 'Enter an amount',
  'expenses.enterAmountMsg': 'Type how much you spent.',
  'expenses.deleteTitle': 'Delete entry?',

  // Category labels — keyed by the stable category `key` so they localize whether
  // the data comes from the backend or content.ts. Custom categories fall back to
  // their stored label.
  'cat.food': 'Food & Groceries',
  'cat.transport': 'Transport',
  'cat.utilities': 'Utilities & Rent',
  'cat.lifestyle': 'Lifestyle & Family',
  'cat.health': 'Health',
  'cat.savings': 'Savings',
  'cat.others': 'Others',
};

export type TKey = keyof typeof en;

const bn: Record<TKey, string> = {
  'common.logout': 'লগ আউট',
  'common.cancel': 'বাতিল',
  'common.delete': 'মুছুন',
  'common.add': 'যোগ করুন',
  'common.tryAgain': 'আবার চেষ্টা করুন।',
  'common.couldNotSave': 'সংরক্ষণ করা যায়নি',
  'lang.english': 'EN',
  'lang.bangla': 'বাং',

  'home.welcomeBack': 'আবার স্বাগতম',
  'home.greeting': 'বন্ধু',
  'home.spentThisMonth': 'এই মাসে খরচ',
  'home.takaPoints': '{n} টাকাপয়েন্ট',
  'home.categories': '{n} ক্যাটাগরি',
  'home.aiInsight': 'এআই পরামর্শ',
  'home.readingFinances': 'আপনার হিসাব দেখছি…',
  'home.expenseProgress': 'খরচের অগ্রগতি (ক্যাটাগরি অনুযায়ী)',
  'home.savingsProgress': 'সঞ্চয়ের অগ্রগতি (লক্ষ্য)',
  'home.noGoals': 'এখনো কোনো লক্ষ্য নেই — Goals ট্যাবে একটি যোগ করুন।',
  'home.insightError': 'পরামর্শ লোড করা যায়নি।',

  'expenses.title': 'খরচ',
  'expenses.subtitle': 'এক ট্যাপে খরচ লিখুন',
  'expenses.enterDetails': 'খরচের বিবরণ দিন',
  'expenses.custom': '+ কাস্টম',
  'expenses.customPlaceholder': 'কাস্টম {label} আইটেম',
  'expenses.selectedPrefix': 'নির্বাচিত:',
  'expenses.noCategory': 'কোনো ক্যাটাগরি নির্বাচন করা হয়নি — উপরে একটি ট্যাপ করুন।',
  'expenses.amountPlaceholder': '৳ পরিমাণ',
  'expenses.notePlaceholder': 'নোট (ঐচ্ছিক)',
  'expenses.recent': 'সাম্প্রতিক লেনদেন',
  'expenses.noTransactions': 'এখনো কোনো লেনদেন নেই।',
  'expenses.longPressHint': 'মুছতে এন্ট্রিতে চাপ ধরে রাখুন।',
  'expenses.pickCategoryTitle': 'ক্যাটাগরি বাছুন',
  'expenses.pickCategoryMsg': 'আগে উপরে একটি ক্যাটাগরি ট্যাপ করুন।',
  'expenses.enterAmountTitle': 'পরিমাণ লিখুন',
  'expenses.enterAmountMsg': 'আপনি কত খরচ করেছেন লিখুন।',
  'expenses.deleteTitle': 'এন্ট্রি মুছবেন?',

  'cat.food': 'খাবার ও বাজার',
  'cat.transport': 'যাতায়াত',
  'cat.utilities': 'ইউটিলিটি ও ভাড়া',
  'cat.lifestyle': 'জীবনযাপন ও পরিবার',
  'cat.health': 'স্বাস্থ্য',
  'cat.savings': 'সঞ্চয়',
  'cat.others': 'অন্যান্য',
};

const dictionaries: Record<Lang, Record<TKey, string>> = { en, bn };

function interpolate(str: string, vars?: Record<string, string | number>) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBnDigits = (s: string) => s.replace(/[0-9]/g, (d) => BN_DIGITS[+d]);

// Thousands-grouped integer (Hermes-safe), with digits localized per language.
function formatNumber(n: number, lang: Lang) {
  const grouped = Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return lang === 'bn' ? toBnDigits(grouped) : grouped;
}

type LangState = {
  language: Lang;
  setLanguage: (l: Lang) => void;
  toggle: () => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
  // Localize a category by its stable key; falls back to the stored label for
  // custom categories that have no translation.
  catLabel: (key: string, fallback: string) => string;
  // Thousands-grouped number with digits localized to the current language
  // (Bangla numerals in bn). Use for all amounts, counts, and percentages.
  fmtN: (n: number) => string;
};

const LangContext = createContext<LangState | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Lang>('en');

  // Restore the saved choice on startup.
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(LANG_KEY);
      if (saved === 'en' || saved === 'bn') setLang(saved);
    })();
  }, []);

  const value = useMemo<LangState>(() => {
    const setLanguage = (l: Lang) => {
      setLang(l);
      AsyncStorage.setItem(LANG_KEY, l).catch(() => {});
    };
    return {
      language,
      setLanguage,
      toggle: () => setLanguage(language === 'en' ? 'bn' : 'en'),
      t: (key, vars) => interpolate(dictionaries[language][key] ?? key, vars),
      catLabel: (key, fallback) => {
        const dict = dictionaries[language] as Record<string, string>;
        return dict[`cat.${key}`] ?? fallback;
      },
      fmtN: (n) => formatNumber(n, language),
    };
  }, [language]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within a LanguageProvider');
  return ctx;
}
