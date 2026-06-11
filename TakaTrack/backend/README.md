# TakaTrack Backend (FastAPI + Firebase Realtime Database)

Phase 1: **authentication** (register / login / me). Users are stored in the
Realtime Database with bcrypt-hashed passwords; the API issues JWTs. No Firebase
Storage is used, so the project stays on the free Spark plan.

## Setup (Windows / PowerShell)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

`serviceAccountKey.json` (the Firebase service account for project
`quickaid-70d9b`) and `.env` are already in place and gitignored.

## Run

```powershell
.\run.ps1
# or:  .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`. Interactive docs: `http://localhost:8000/docs`.

## Endpoints

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET  | `/health` | — | service status |
| POST | `/auth/register` | `{ name, email, password }` | `{ token, user }` |
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| GET  | `/auth/me` | — (Bearer token) | `{ uid, name, email }` |

## Realtime Database layout

```
/users/{uid}           = { name, email, password_hash, created_at }
/emailIndex/{emailKey} = uid      # emailKey = lowercased email, '.' -> ','
```

## Quick test

```powershell
curl -Method POST http://localhost:8000/auth/register `
  -ContentType "application/json" `
  -Body '{"name":"Aayat","email":"test@takatrack.app","password":"secret123"}'
```
