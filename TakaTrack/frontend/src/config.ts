import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Port the FastAPI backend runs on (see backend/run.ps1). */
const BACKEND_PORT = 8000;

/**
 * Base URL of the FastAPI backend, auto-detected from the Expo dev server.
 *
 * The device/emulator already reached Metro at some host (the dev machine's
 * IP, e.g. "192.168.0.107:8081"). We reuse that host and swap to the backend
 * port, so this works on a physical phone, an emulator, and web without any
 * manual edits — as long as the backend is started with host 0.0.0.0 (run.ps1).
 *
 * If auto-detection ever fails, set MANUAL_URL below to your PC's LAN IP, e.g.
 *   const MANUAL_URL = 'http://192.168.0.107:8000';
 */
const MANUAL_URL: string | null = null;

function detectHost(): string | null {
  // hostUri looks like "192.168.0.107:8081" or "localhost:8081".
  const c = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    expoGoConfig?: { debuggerHost?: string };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
  };
  const hostUri =
    c.expoConfig?.hostUri ??
    c.expoGoConfig?.debuggerHost ??
    c.manifest2?.extra?.expoGo?.debuggerHost ??
    null;
  if (!hostUri) return null;
  return hostUri.split(':')[0];
}

function resolveApiUrl(): string {
  // Production / standalone builds set this (e.g. the Render URL) since there is
  // no Metro dev server to auto-detect from. Takes precedence over everything.
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  if (MANUAL_URL) return MANUAL_URL;

  const host = detectHost();
  // A real LAN IP works for both physical devices and emulators.
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${BACKEND_PORT}`;
  }

  // Fallbacks when the host is localhost (web / some emulator setups).
  // Android emulator reaches the host machine via the special 10.0.2.2 alias.
  return Platform.OS === 'android'
    ? `http://10.0.2.2:${BACKEND_PORT}`
    : `http://localhost:${BACKEND_PORT}`;
}

export const API_URL = resolveApiUrl();
