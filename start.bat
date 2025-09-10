@echo off
echo Starting QR Attendance System...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies first...
    call npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file...
    copy env.example .env
    echo.
)

REM Start the application
echo Starting server...
echo.
echo The application will be available at:
echo - Main interface: http://localhost:3000
echo - Student scanner: http://localhost:3000/student
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js

pause
