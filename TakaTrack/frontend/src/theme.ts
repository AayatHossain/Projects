export const colors = {
  // brand — teal family
  teal: '#0d9488',
  tealDark: '#0f766e',
  tealDeep: '#115e59',
  teal2: '#14b8a6',
  tealTint: '#ecfdf5',
  tealTint2: '#d1fae5',

  // text — stronger contrast for readability
  ink: '#0b1220', // headings (near-black)
  ink2: '#1e293b', // strong body
  body: '#334155', // default body
  muted: '#51607a', // secondary (darker than a typical slate-500)
  faint: '#94a3b8', // hints only

  // surfaces & lines
  bg: '#e8edf3', // app background (cool, so white cards pop)
  card: '#ffffff',
  line: '#e3e8ef', // subtle border
  lineStrong: '#cbd5e1', // dividers

  // semantic
  red: '#dc2626',
  redTint: '#fef2f2',
  amber: '#f59e0b',
  amberTint: '#fffbeb',
  green: '#16a34a',
  greenTint: '#f0fdf4',
  violet: '#7c3aed',
  violetTint: '#f5f3ff',

  white: '#ffffff',
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 22 };

export const shadow = {
  card: {
    shadowColor: '#0b1220',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};
