#!/usr/bin/env bash
echo "========================================================"
echo "       Care Bridge - Hospital Follow-up Coordinator"
echo "========================================================"
echo ""

echo "[1/2] Starting FastAPI Backend on port 8000..."
(cd backend && python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload) &
BACKEND_PID=$!

echo "[2/2] Starting React Vite Frontend on port 5173..."
(cd frontend && npm run dev -- --host 127.0.0.1 --port 5173) &
FRONTEND_PID=$!

echo ""
echo "========================================================"
echo "Care Bridge is running!"
echo "Backend:  http://127.0.0.1:8000"
echo "Frontend: http://127.0.0.1:5173"
echo "Press Ctrl+C to terminate both servers."
echo "========================================================"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
