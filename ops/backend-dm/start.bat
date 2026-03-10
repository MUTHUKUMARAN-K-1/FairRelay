@echo off
echo ============================================
echo  FairRelay Backend Startup Script
echo ============================================

echo.
echo [1] Checking PostgreSQL services...
powershell -Command "Get-Service | Where-Object {$_.Name -like '*postgresql*' -or $_.Name -like '*postgres*'} | Format-Table Name, Status -AutoSize"

echo.
echo [2] Trying to start PostgreSQL...
for %%s in (postgresql-x64-17 postgresql-x64-16 postgresql-x64-15 postgresql postgresql-16 postgresql-17) do (
    net start %%s 2>nul && echo Started %%s && goto :dbstarted
)
echo WARNING: Could not start PostgreSQL via any common service name.
echo The backend will run in demo mode.

:dbstarted
echo.
echo [3] Checking port 3000...
netstat -ano | findstr :3000

echo.
echo [4] Killing anything on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 "') do taskkill /F /PID %%a 2>nul

echo.
echo [5] Starting FairRelay backend on port 3000...
cd /d d:\pract\fairrelay\ops\backend-dm
node index.js
