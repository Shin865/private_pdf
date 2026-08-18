@echo off
echo =========================================
echo       Starting PDF Tool Services
echo =========================================

echo.
echo Starting Backend (FastAPI)...
start "PDF Tool Backend" cmd /k "cd backend && uvicorn app.main:app --reload --port 8000"

echo Starting Frontend (React/Vite)...
start "PDF Tool Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services have been launched in new windows.
echo - Backend API: http://127.0.0.1:8000
echo - Frontend UI:   http://localhost:5173
echo.
echo You can safely close this window. To stop the services, close the two newly opened command prompts.
pause
