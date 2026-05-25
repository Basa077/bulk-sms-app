@echo off
echo ============================================
echo   BulkSMS Pro - Startup Script
echo ============================================
echo.

:: Check Node
node -v >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Node.js not found!
  echo Please install it from: https://nodejs.org
  echo Download the LTS version and re-run this script.
  pause
  exit /b 1
)

echo [OK] Node.js found:
node -v

:: Install backend deps if needed
if not exist "backend\node_modules" (
  echo [SETUP] Installing backend dependencies...
  cd backend
  npm install
  cd ..
)

:: Install frontend deps if needed
if not exist "frontend\node_modules" (
  echo [SETUP] Installing frontend dependencies...
  cd frontend
  npm install
  cd ..
)

echo.
echo [START] Starting backend server...
start "BulkSMS Backend" cmd /k "cd /d %~dp0backend && node server.js"

timeout /t 2 /nobreak >nul

echo [START] Starting frontend...
start "BulkSMS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo   App is running!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo ============================================
echo.
echo Press any key to open the app in your browser...
pause >nul
start http://localhost:3000
