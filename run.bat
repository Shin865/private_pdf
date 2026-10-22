@echo off
echo ===================================================
echo MENJALANKAN SERVER PDF TOOL...
echo ===================================================

:: Menjalankan Backend (Terminal 1)
echo Memulai Backend (Port 8000)...
start "Backend Server" cmd /k "cd /d D:\PDF_tool\backend && uvicorn app.main:app --reload --port 8000"

:: Menjalankan Frontend (Terminal 2)
echo Memulai Frontend (Port 5173)...
start "Frontend Server" cmd /k "cd /d D:\PDF_tool\frontend && npm run dev"

:: Buka Browser
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo Semua server sedang berjalan di jendela baru.
echo Jendela ini bisa Anda tutup.
pause