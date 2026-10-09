@echo off
echo ========================================================
echo        Care Bridge - Hospital Follow-up Coordinator
echo ========================================================
echo.

echo [1/2] Starting FastAPI Backend on port 8000...
start "Care Bridge Backend" cmd /k "cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting React Vite Frontend on port 5173...
start "Care Bridge Frontend" cmd /k "cd frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo ========================================================
echo Care Bridge is launching!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://127.0.0.1:5173
echo ========================================================
pause
