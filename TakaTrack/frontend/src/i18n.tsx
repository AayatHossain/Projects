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
  'common.save': 'Save',
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
  'home.seeMore': 'See More Suggestions',

  'insights.title': 'AI Suggestions',
  'insights.subtitle': 'Personalized tips from your finances',
  'insights.generate': 'Generate 5 new',
  'insights.loading': 'Generating suggestions…',
  'insights.error': 'Could not load suggestions.',

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

  'goals.title': 'My Goals',
  'goals.subtitle': 'Save toward what matters',
  'goals.noGoals': 'No goals yet — create one below.',
  'goals.edit': '✎ Edit',
  'goals.daysLeft': '~{n} days left',
  'goals.reached': '🎉 reached!',
  'goals.deposited': 'Deposited (৳)',
  'goals.targetAmountField': 'Target amount (৳)',
  'goals.targetDays': 'Target days',
  'goals.dailyTargetUpdates': 'Daily target updates to ৳{n}/day.',
  'goals.amountPlaceholder': 'amount',
  'goals.deposit': '+ Deposit',
  'goals.createHeading': 'Create a goal',
  'goals.createSub': 'Start from a template or create your own goal',
  'goals.suggested': 'suggested ৳{n}',
  'goals.iconLabel': 'Icon',
  'goals.nameLabel': 'Goal name',
  'goals.namePlaceholder': 'e.g. "New laptop"',
  'goals.targetAmount': 'Target amount',
  'goals.perDayNote': "That's ৳{n}/day to reach it on time.",
  'goals.addGoal': '+ Add goal',
  'goals.couldNotDeposit': 'Could not deposit',
  'goals.checkDepositedTitle': 'Check deposited',
  'goals.checkDepositedMsg': 'Enter a valid saved amount.',
  'goals.checkTargetTitle': 'Check target',
  'goals.checkTargetMsg': 'Enter a target greater than 0.',
  'goals.checkDaysTitle': 'Check days',
  'goals.checkDaysMsg': 'Enter target days greater than 0.',
  'goals.deleteTitle': 'Delete goal?',
  'goals.nameNeededTitle': 'Name needed',
  'goals.nameNeededMsg': 'Give your goal a name.',
  'goals.amountNeededTitle': 'Amount needed',
  'goals.amountNeededMsg': 'Enter how much you need to save.',
  'goals.daysNeededTitle': 'Days needed',
  'goals.daysNeededMsg': 'Enter how many days you want to reach it in.',
  'goals.existsTitle': 'Already exists',
  'goals.existsMsg': 'You already have a goal called "{name}".',
  'goals.couldNotAdd': 'Could not add goal',

  'budget.title': 'Budget Core',
  'budget.subtitle': 'Your monthly plan',
  'budget.monthlyIncome': 'Monthly income',
  'budget.incomePlaceholder': '30000',
  'budget.set': 'Set',
  'budget.legendSafe': 'Safe',
  'budget.legendApproaching': 'Approaching',
  'budget.legendOverspent': 'Overspent',
  'budget.totalAllocated': 'Total allocated',
  'budget.overBy': '⚠️ Allocations exceed income by ৳{n}. Trim a category or raise your income.',
  'budget.unallocated': '✅ ৳{n} of income still unallocated.',
  'budget.catVsSpent': 'Categories — allocated vs spent',
  'budget.editHintEditing': 'Set how much of your income goes to each category, then Save.',
  'budget.editHintDefault': 'Logging an expense fills the matching category. Tap Edit to change allocations.',
  'budget.enterIncomeTitle': 'Enter income',
  'budget.enterIncomeMsg': 'Type your monthly income.',
  'budget.savedTitle': 'Saved',
  'budget.savedMsg': 'Monthly income updated.',

  'assistant.title': 'Assistant',
  'assistant.subtitle': 'Powered by your TakaTrack data',
  'assistant.greeting':
    "Hi! I'm your TakaTrack assistant. Ask me about your spending, budget, or goals — like “Am I overspending?” or “How do I reach my savings goal faster?”",
  'assistant.thinking': 'Thinking…',
  'assistant.error': 'Something went wrong.',
  'assistant.inputPlaceholder': 'Ask about your money…',
  'assistant.suggest1': 'Am I overspending?',
  'assistant.suggest2': 'Where can I save money?',
  'assistant.suggest3': 'How are my goals doing?',

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
  'common.save': 'সংরক্ষণ',
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
  'home.seeMore': 'আরও পরামর্শ দেখুন',

  'insights.title': 'এআই পরামর্শ',
  'insights.subtitle': 'আপনার হিসাব থেকে ব্যক্তিগত পরামর্শ',
  'insights.generate': '৫টি নতুন তৈরি করুন',
  'insights.loading': 'পরামর্শ তৈরি হচ্ছে…',
  'insights.error': 'পরামর্শ লোড করা যায়নি।',

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

  'goals.title': 'আমার লক্ষ্য',
  'goals.subtitle': 'যা গুরুত্বপূর্ণ তার জন্য সঞ্চয় করুন',
  'goals.noGoals': 'এখনো কোনো লক্ষ্য নেই — নিচে একটি তৈরি করুন।',
  'goals.edit': '✎ এডিট',
  'goals.daysLeft': '~{n} দিন বাকি',
  'goals.reached': '🎉 পূর্ণ হয়েছে!',
  'goals.deposited': 'জমা (৳)',
  'goals.targetAmountField': 'লক্ষ্য পরিমাণ (৳)',
  'goals.targetDays': 'লক্ষ্য দিন',
  'goals.dailyTargetUpdates': 'দৈনিক লক্ষ্য হবে ৳{n}/দিন।',
  'goals.amountPlaceholder': 'পরিমাণ',
  'goals.deposit': '+ জমা',
  'goals.createHeading': 'নতুন লক্ষ্য তৈরি করুন',
  'goals.createSub': 'টেমপ্লেট থেকে শুরু করুন বা নিজের লক্ষ্য তৈরি করুন',
  'goals.suggested': 'প্রস্তাবিত ৳{n}',
  'goals.iconLabel': 'আইকন',
  'goals.nameLabel': 'লক্ষ্যের নাম',
  'goals.namePlaceholder': 'যেমন "নতুন ল্যাপটপ"',
  'goals.targetAmount': 'লক্ষ্য পরিমাণ',
  'goals.perDayNote': 'অর্থাৎ সময়মতো পৌঁছাতে ৳{n}/দিন।',
  'goals.addGoal': '+ লক্ষ্য যোগ করুন',
  'goals.couldNotDeposit': 'জমা করা যায়নি',
  'goals.checkDepositedTitle': 'জমা যাচাই করুন',
  'goals.checkDepositedMsg': 'একটি সঠিক জমা পরিমাণ লিখুন।',
  'goals.checkTargetTitle': 'লক্ষ্য যাচাই করুন',
  'goals.checkTargetMsg': '০ এর বেশি একটি লক্ষ্য লিখুন।',
  'goals.checkDaysTitle': 'দিন যাচাই করুন',
  'goals.checkDaysMsg': '০ এর বেশি লক্ষ্য দিন লিখুন।',
  'goals.deleteTitle': 'লক্ষ্য মুছবেন?',
  'goals.nameNeededTitle': 'নাম প্রয়োজন',
  'goals.nameNeededMsg': 'আপনার লক্ষ্যের একটি নাম দিন।',
  'goals.amountNeededTitle': 'পরিমাণ প্রয়োজন',
  'goals.amountNeededMsg': 'কত সঞ্চয় করতে চান লিখুন।',
  'goals.daysNeededTitle': 'দিন প্রয়োজন',
  'goals.daysNeededMsg': 'কত দিনে পৌঁছাতে চান লিখুন।',
  'goals.existsTitle': 'ইতিমধ্যে আছে',
  'goals.existsMsg': 'আপনার ইতিমধ্যে "{name}" নামে একটি লক্ষ্য আছে।',
  'goals.couldNotAdd': 'লক্ষ্য যোগ করা যায়নি',

  'budget.title': 'বাজেট কোর',
  'budget.subtitle': 'আপনার মাসিক পরিকল্পনা',
  'budget.monthlyIncome': 'মাসিক আয়',
  'budget.incomePlaceholder': '৩০০০০',
  'budget.set': 'সেট',
  'budget.legendSafe': 'নিরাপদ',
  'budget.legendApproaching': 'কাছাকাছি',
  'budget.legendOverspent': 'অতিরিক্ত খরচ',
  'budget.totalAllocated': 'মোট বরাদ্দ',
  'budget.overBy': '⚠️ বরাদ্দ আয়ের চেয়ে ৳{n} বেশি। একটি ক্যাটাগরি কমান বা আয় বাড়ান।',
  'budget.unallocated': '✅ আয়ের ৳{n} এখনো বরাদ্দ হয়নি।',
  'budget.catVsSpent': 'ক্যাটাগরি — বরাদ্দ বনাম খরচ',
  'budget.editHintEditing': 'প্রতিটি ক্যাটাগরিতে আয়ের কত যাবে নির্ধারণ করুন, তারপর সংরক্ষণ করুন।',
  'budget.editHintDefault': 'খরচ লিখলে সংশ্লিষ্ট ক্যাটাগরি পূরণ হয়। বরাদ্দ পরিবর্তন করতে এডিট চাপুন।',
  'budget.enterIncomeTitle': 'আয় লিখুন',
  'budget.enterIncomeMsg': 'আপনার মাসিক আয় লিখুন।',
  'budget.savedTitle': 'সংরক্ষিত',
  'budget.savedMsg': 'মাসিক আয় হালনাগাদ হয়েছে।',

  'assistant.title': 'সহকারী',
  'assistant.subtitle': 'আপনার TakaTrack তথ্য দিয়ে চালিত',
  'assistant.greeting':
    'হ্যালো! আমি আপনার TakaTrack সহকারী। আপনার খরচ, বাজেট বা লক্ষ্য নিয়ে জিজ্ঞেস করুন — যেমন "আমি কি বেশি খরচ করছি?" বা "কীভাবে দ্রুত সঞ্চয়ের লক্ষ্যে পৌঁছাব?"',
  'assistant.thinking': 'ভাবছি…',
  'assistant.error': 'কিছু একটা সমস্যা হয়েছে।',
  'assistant.inputPlaceholder': 'আপনার টাকা নিয়ে জিজ্ঞেস করুন…',
  'assistant.suggest1': 'আমি কি বেশি খরচ করছি?',
  'assistant.suggest2': 'কোথায় টাকা সাশ্রয় করতে পারি?',
  'assistant.suggest3': 'আমার লক্ষ্যগুলো কেমন চলছে?',

  'cat.food': 'খাবার ও বাজার',
  'cat.transport': 'যাতায়াত',
  'cat.utilities': 'ইউটিলিটি ও ভাড়া',
  'cat.lifestyle': 'জীবনযাপন ও পরিবার',
  'cat.health': 'স্বাস্থ্য',
  'cat.savings': 'সঞ্চয়',
  'cat.others': 'অন্যান্য',
};

const dictionaries: Record<Lang, Record<TKey, string>> = { en, bn };

// Expense item chips from content.ts. Keyed by the English (canonical) value, which
// stays the stored identity — only the display is translated. Custom/free-text
// items fall back to themselves.
const ITEM_BN: Record<string, string> = {
  Bazar: 'বাজার',
  Restaurant: 'রেস্টুরেন্ট',
  'Tea / Snacks (tong)': 'চা / নাস্তা (টং)',
  Rickshaw: 'রিকশা',
  CNG: 'সিএনজি',
  'Uber / Pathao': 'উবার / পাঠাও',
  Bus: 'বাস',
  'Metro rail': 'মেট্রোরেল',
  'House rent': 'বাসা ভাড়া',
  'Current bill': 'বিদ্যুৎ বিল',
  'Gas bill': 'গ্যাস বিল',
  'Internet / Wasa': 'ইন্টারনেট / ওয়াসা',
  'Family sending': 'পরিবারকে পাঠানো',
  Shopping: 'কেনাকাটা',
  'Mobile recharge': 'মোবাইল রিচার্জ',
  'Hospital bill': 'হাসপাতাল বিল',
  'Medicine bill': 'ওষুধের বিল',
  'Doctor visit': 'ডাক্তার দেখানো',
  'Zakat / Donation': 'যাকাত / দান',
  Repairs: 'মেরামত',
};

// Goal names from templates / seeded defaults. Keyed by the English stored name;
// custom user-typed names fall back to themselves.
const GOAL_BN: Record<string, string> = {
  'Hajj / Umrah': 'হজ্জ / ওমরাহ',
  'Eid Shopping': 'ঈদের কেনাকাটা',
  'Emergency Fund': 'জরুরি তহবিল',
  'New Phone': 'নতুন ফোন',
  'Flat Deposit': 'ফ্ল্যাট ডিপোজিট',
  'Wedding (Biye)': 'বিয়ে',
  'Send Home (village)': 'বাড়িতে পাঠানো (গ্রাম)',
};

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
  // Localize a known expense item; falls back to the value itself (custom/free text).
  itemLabel: (item: string) => string;
  // Localize a known goal name (templates/seeded); falls back to the name itself.
  goalLabel: (name: string) => string;
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
      itemLabel: (item) => (language === 'bn' ? ITEM_BN[item] ?? item : item),
      goalLabel: (name) => (language === 'bn' ? GOAL_BN[name] ?? name : name),
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
