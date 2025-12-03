@echo off
echo ========================================
echo   Upload Code to GitHub
echo ========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed or not in PATH
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [OK] Git found
echo.

REM Initialize git if needed
if not exist ".git" (
    echo [INFO] Initializing git repository...
    git init
    echo [OK] Repository initialized
    echo.
)

REM Set remote
echo [INFO] Setting remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System.git
echo [OK] Remote set
echo.

REM Add all files
echo [INFO] Adding all files...
git add .
echo [OK] Files added
echo.

REM Commit
echo [INFO] Committing changes...
git commit -m "Complete NeoBit Multi-Tenant CRM System - Phase 1 ^& 2 Implementation"
if errorlevel 1 (
    echo [WARN] No changes to commit or commit failed
) else (
    echo [OK] Changes committed
)
echo.

REM Push
echo [WARNING] This will REPLACE all existing code in the repository!
echo.
set /p confirm="Continue? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo [CANCELLED] Upload cancelled
    pause
    exit /b 0
)

echo.
echo [INFO] Force pushing to main branch...
git branch -M main
git push -f origin main

if errorlevel 1 (
    echo.
    echo [ERROR] Push failed. You may need to authenticate.
    echo.
    echo To authenticate:
    echo 1. Use GitHub Personal Access Token
    echo 2. Create token at: https://github.com/settings/tokens
    echo 3. Select scope: repo
    echo.
) else (
    echo.
    echo [SUCCESS] Code uploaded to GitHub!
    echo Repository: https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System
    echo.
)

pause


