# TakaTrack

A Bengali-first budget planner. **Phase 1: authentication** (register / login).

- **frontend/** — React Native (Expo SDK 54 + expo-router) app
- **backend/** — FastAPI service backed by Firebase **Realtime Database**

The React Native app talks only to the FastAPI backend; the backend uses the
Firebase Admin SDK with the Realtime Database. No Firebase Storage is used, so
the project stays on the free Spark plan.

```
React Native app  ──HTTP──►  FastAPI backend  ──Admin SDK──►  Realtime Database
  (login/register)            (/auth/*, JWT)                   /users, /emailIndex
```

## 1. Run the backend

```powershell
cd backend
python -m venv venv                                   # first time only
.\venv\Scripts\python.exe -m pip install -r requirements.txt   # first time only
.\run.ps1
```

Runs at `http://localhost:8000` (docs at `/docs`). The Firebase service-account
key and `.env` are already in place. See [backend/README.md](backend/README.md).

## 2. Run the frontend

```powershell
cd frontend
npm install            # first time only
npx expo start
```

Then press **a** (Android emulator), **w** (web), or scan the QR with Expo Go.

> **Connecting the app to the backend:** by default the app calls
> `http://10.0.2.2:8000` on Android emulators and `http://localhost:8000` elsewhere.
> On a **physical phone** with Expo Go, edit `frontend/src/config.ts` and set the
> URL to your computer's LAN IP (e.g. `http://192.168.0.105:8000`). Phone and PC
> must share the same Wi-Fi.

## Verified

The auth flow was tested end-to-end against the live Realtime Database:
register, duplicate-email rejection (409), login, wrong-password rejection (401),
and the token-protected `/auth/me`.

## Next phases

Budget Core (envelopes + safety rings) → Smart Expense Logger → Goal Tracker →
Financial Literacy Arcade. See `../TakaTrack-AdvisorPlan/` for the full design and
the interactive `prototype.html`.
