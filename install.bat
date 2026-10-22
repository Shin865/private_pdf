@echo off
echo ===================================================
echo SETUP DAN INSTALASI PDF TOOL
echo ===================================================

:: Pindah ke direktori utama
cd /d D:\PDF_tool

:: 1. Cek dan Install Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Python tidak ditemukan. Memulai instalasi Python...
    winget install -e --id Python.Python.3.11 --accept-package-agreements --accept-source-agreements
    echo [INFO] Python berhasil diinstal.
    echo PENTING: Jika baru diinstal, Anda mungkin perlu restart komputer.
) else (
    echo [OK] Python sudah terinstal.
)

:: 2. Cek dan Install Node.js
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Node.js tidak ditemukan. Memulai instalasi Node.js...
    winget install -e --id OpenJS.NodeJS --accept-package-agreements --accept-source-agreements
    echo [INFO] Node.js berhasil diinstal.
    echo PENTING: Jika baru diinstal, Anda mungkin perlu restart komputer.
) else (
    echo [OK] Node.js sudah terinstal.
)

echo.
echo ===================================================
echo MENGINSTAL DEPENDENSI PROJECT
echo ===================================================

echo [1/2] Menginstal dependencies Backend (Python)...
cd /d D:\PDF_tool\backend
call pip install -r requirements.txt

echo.
echo [2/2] Menginstal dependencies Frontend (Node.js)...
cd /d D:\PDF_tool\frontend
echo Menginstal package dasar...
call npm install
echo Memastikan Vite terinstal...
call npm install vite --save-dev

echo.
echo ===================================================
echo INSTALASI SELESAI!
echo Silakan jalankan '2_run.bat' untuk memulai aplikasi.
echo ===================================================
pause