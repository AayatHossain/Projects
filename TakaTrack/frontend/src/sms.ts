import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';

const WATERMARK_KEY = 'takatrack_sms_watermark';
const LOOKBACK_MS = 1000 * 60 * 60 * 24 * 30;

export type RawSms = { sender: string; body: string; ts: number };

const SENDER_HINTS = ['bkash', 'nagad', 'rocket', 'upay', 'bank', 'dbbl', 'brac', 'city', 'ebl', 'islami', 'ucb', 'mtb'];
const TXN_WORDS = [
  'received', 'cash out', 'send money', 'payment', 'recharge', 'cash in',
  'add money', 'debited', 'credited', 'paid', 'withdraw', 'deposit', 'purchase',
];
const AMOUNT_RE = /(?:tk|bdt|৳)\.?\s*[\d,]+/i;

export function looksFinancial(sender: string, body: string): boolean {
  const s = (sender || '').toLowerCase();
  const b = (body || '').toLowerCase();
  if (!AMOUNT_RE.test(body || '')) return false;
  const hasSender = SENDER_HINTS.some((k) => s.includes(k));
  const hasWord = TXN_WORDS.some((w) => b.includes(w));
  return hasSender || hasWord;
}

function getNativeSms(): any {
  try {
    const name = 'react-native-get-sms-android';
    const mod = require(name);
    return mod?.default ?? mod;
  } catch {
    return null;
  }
}

export function isSmsAvailable(): boolean {
  if (Platform.OS !== 'android') return false;
  const mod = getNativeSms();
  return !!mod && typeof mod.list === 'function';
}

export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS, {
      title: 'Read transaction SMS',
      message: 'TakaTrack reads bKash, Nagad and bank SMS to auto-track your spending. Nothing else is touched.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    });
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

function listSms(minDate: number): Promise<RawSms[]> {
  const mod = getNativeSms();
  if (!mod || typeof mod.list !== 'function') return Promise.resolve([]);
  return new Promise((resolve) => {
    const filter = JSON.stringify({ box: 'inbox', minDate, maxCount: 200 });
    mod.list(
      filter,
      () => resolve([]),
      (_count: number, smsList: string) => {
        try {
          const arr = JSON.parse(smsList) as { address?: string; body?: string; date?: number }[];
          resolve(
            arr.map((m) => ({
              sender: m.address ?? '',
              body: m.body ?? '',
              ts: Number(m.date) || Date.now(),
            })),
          );
        } catch {
          resolve([]);
        }
      },
    );
  });
}

export async function scanSms(): Promise<RawSms[]> {
  if (!isSmsAvailable()) return [];
  const granted = await requestSmsPermission();
  if (!granted) return [];
  const wmRaw = await AsyncStorage.getItem(WATERMARK_KEY);
  const watermark = wmRaw ? Number(wmRaw) : Date.now() - LOOKBACK_MS;
  const all = await listSms(watermark + 1);
  const financial = all.filter((m) => looksFinancial(m.sender, m.body));
  const newest = all.reduce((mx, m) => Math.max(mx, m.ts), watermark);
  await AsyncStorage.setItem(WATERMARK_KEY, String(newest));
  return financial;
}

const SAMPLE_SMS: Omit<RawSms, 'ts'>[] = [
  {
    sender: 'bKash',
    body: 'Payment Tk 850.00 to SHWAPNO successful. Ref Grocery. Fee Tk 0.00. Balance Tk 4,441.00. TrxID 9HX2K7QP at 24/06/2026 18:45',
  },
  {
    sender: 'bKash',
    body: 'You have received Tk 5,000.00 from 01712345678. Ref Salary. Fee Tk 0.00. Balance Tk 9,441.00. TrxID 8KK1L0Z9 at 24/06/2026 11:10',
  },
  {
    sender: 'NAGAD',
    body: 'Cash Out Tk 1,200.00 successful to Agent 01898765432. Fee Tk 18.00. Balance Tk 3,223.00. TxnID NGD55A2C1 at 24/06/2026 14:05',
  },
  {
    sender: 'DBBL',
    body: 'BDT 2,300.00 debited from A/C **2841 for POS purchase at DARAZ. Avbl Bal BDT 18,540.00. Ref 77123456',
  },
  {
    sender: 'bKash',
    body: 'Your mobile recharge of Tk 200.00 to 01712345678 is successful. Balance Tk 8,241.00. TrxID 7RT9P2Q1 at 24/06/2026 09:30',
  },
];

let sampleIdx = 0;

export function sampleSms(): RawSms[] {
  const pick = SAMPLE_SMS[sampleIdx % SAMPLE_SMS.length];
  sampleIdx += 1;
  return [{ ...pick, ts: Date.now() }];
}
