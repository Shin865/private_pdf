@echo off
setlocal EnableExtensions

REM ============================================================
REM  install.bat (PDF_tool)
REM  Base direktori = folder tempat file ini berada (root projek),
REM  jadi bisa dijalankan dari drive/lokasi mana pun.
REM ============================================================

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"

echo ============================================
echo  Root projek : %ROOT%
echo ============================================
echo.

REM ---------- Cek prasyarat ----------
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python tidak ditemukan di PATH. Install Python terlebih dahulu.
    goto :fail
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm tidak ditemukan di PATH. Install Node.js terlebih dahulu.
    goto :fail
)

if not exist "%BACKEND_DIR%\" (
    echo [ERROR] Folder backend tidak ditemukan: %BACKEND_DIR%
    goto :fail
)

if not exist "%FRONTEND_DIR%\" (
    echo [ERROR] Folder frontend tidak ditemukan: %FRONTEND_DIR%
    goto :fail
)

REM ---------- Backend ----------
echo [1/2] Install Backend...
pushd "%BACKEND_DIR%"

python -m pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Gagal menginstall requirements.txt
    popd
    goto :fail
)

popd
echo [OK] Backend selesai.
echo.

REM ---------- Frontend ----------
echo [2/2] Install Frontend...
pushd "%FRONTEND_DIR%"

call npm install
if errorlevel 1 (
    echo [ERROR] Gagal menjalankan npm install
    popd
    goto :fail
)

popd
echo [OK] Frontend selesai.
echo.

echo ============================================
echo  Instalasi selesai!
echo ============================================
echo.
pause
endlocal
exit /b 0

:fail
echo.
echo Instalasi dihentikan karena ada error.
pause
endlocal
exit /b 1