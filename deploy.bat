@echo off
echo ========================================
echo   QR Attendance System Deployment
echo ========================================
echo.

echo Step 1: Checking Git status...
git status
echo.

echo Step 2: Adding all files...
git add .
echo.

echo Step 3: Committing changes...
git commit -m "Deploy to Render - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
echo.

echo Step 4: Pushing to GitHub...
echo Please make sure you have:
echo 1. Created a GitHub repository
echo 2. Added the remote origin
echo 3. Connected your GitHub account
echo.

echo To complete deployment:
echo 1. Go to https://github.com
echo 2. Create new repository: qr-attendance-system
echo 3. Copy the repository URL
echo 4. Run: git remote add origin YOUR_REPO_URL
echo 5. Run: git push -u origin main
echo 6. Go to https://render.com
echo 7. Connect GitHub and deploy!
echo.

echo ========================================
echo   Ready for Render Deployment!
echo ========================================
pause
