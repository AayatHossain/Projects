# Start the TakaTrack backend in dev mode.
# First-time setup (run once, from the backend/ folder):
#   python -m venv venv
#   .\venv\Scripts\python.exe -m pip install -r requirements.txt
# Then start it with:
#   .\run.ps1
& "$PSScriptRoot\venv\Scripts\python.exe" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
