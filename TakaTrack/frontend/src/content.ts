// Static content for the Expense Logger, Goals, and Literacy Arcade.
// AI-generated scenarios/quizzes will replace the arcade content later.

export const CATEGORY_GROUPS = [
  { key: 'food', label: 'Food & Groceries', icon: '🍚', items: ['Bazar', 'Restaurant', 'Tea / Snacks (tong)'] },
  { key: 'transport', label: 'Transport', icon: '🚍', items: ['Rickshaw', 'CNG', 'Uber / Pathao', 'Bus', 'Metro rail'] },
  { key: 'utilities', label: 'Utilities & Rent', icon: '🏠', items: ['House rent', 'Current bill', 'Gas bill', 'Internet / Wasa'] },
  { key: 'lifestyle', label: 'Lifestyle & Family', icon: '👨‍👩‍👧', items: ['Family sending', 'Shopping', 'Mobile recharge'] },
  { key: 'health', label: 'Health', icon: '🏥', items: ['Hospital bill', 'Medicine bill', 'Doctor visit'] },
  { key: 'others', label: 'Others', icon: '🗂️', items: ['Zakat / Donation', 'Repairs'] },
];

export const GOAL_TEMPLATES = [
  { name: 'Hajj / Umrah', icon: '🕋', target: 400000 },
  { name: 'Eid Shopping', icon: '🛍️', target: 15000 },
  { name: 'Emergency Fund', icon: '🛡️', target: 60000 },
  { name: 'New Phone', icon: '📱', target: 45000 },
  { name: 'Flat Deposit', icon: '🏢', target: 200000 },
  { name: 'Wedding (Biye)', icon: '💍', target: 300000 },
];

export type Scenario = {
  id: string;
  text: string;
  points: number;
  options: { label: string; good: boolean; feedback: string }[];
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'scn-rent',
    points: 15,
    text:
      "It's the 5th. Salary just landed. bKash shows a 20% cashback on a clothing brand — but rent isn't paid yet. What do you do?",
    options: [
      {
        label: 'Pay rent first, skip the offer',
        good: true,
        feedback:
          '✅ Smart move! Rent is a fixed need — chasing a 20% cashback while skipping rent risks late fees and stress. Needs before wants.',
      },
      {
        label: "Buy now to 'save' 20%",
        good: false,
        feedback:
          "⚠️ A 20% 'saving' on something you didn't need isn't saving — and unpaid rent can cost far more.",
      },
    ],
  },
];

export type QuizQuestion = {
  id: string;
  q: string;
  a: string[];
  correct: number;
  why: string;
  points: number;
};

export const QUIZ: QuizQuestion[] = [
  {
    id: 'quiz-inflation',
    q: 'Inflation is high. Where does idle cash lose value fastest?',
    a: ['Cash under the mattress', 'A savings/DPS account', 'Gold'],
    correct: 0,
    why: 'Cash kept at home earns 0% while prices rise — its real value shrinks the fastest.',
    points: 10,
  },
  {
    id: 'quiz-dps',
    q: 'What does a DPS mainly help you build?',
    a: ['Instant spending power', 'A disciplined monthly savings habit', 'A credit score'],
    correct: 1,
    why: 'A DPS auto-saves a fixed amount monthly — great for building a savings habit.',
    points: 10,
  },
  {
    id: 'quiz-sub',
    q: 'A free app trial auto-charges yearly after 7 days. This is a…',
    a: ['Good deal', 'Subscription trap', 'Cashback'],
    correct: 1,
    why: 'Auto-renewing trials are a classic subscription trap — set a reminder to cancel.',
    points: 10,
  },
];

export const BADGES = [
  { icon: '🧮', label: 'Budgeter', threshold: 0 },
  { icon: '🎓', label: 'Quiz Pro', threshold: 30 },
  { icon: '🛡️', label: 'Safety Net', threshold: 60 },
  { icon: '🏦', label: 'Investor', threshold: 100 },
];
