# PowerShell script to upload code to GitHub
# Run this script to push all code to: https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System

Write-Host "🚀 Uploading code to GitHub..." -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Check if we're in a git repository
if (Test-Path ".git") {
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "📦 Initializing git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Repository initialized" -ForegroundColor Green
}

# Set remote (force update to replace existing)
Write-Host ""
Write-Host "🔗 Setting remote repository..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System.git
Write-Host "✅ Remote set to: https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System.git" -ForegroundColor Green

# Add all files
Write-Host ""
Write-Host "📁 Adding all files..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files added" -ForegroundColor Green

# Check if there are changes
$status = git status --porcelain
if (-not $status) {
    Write-Host ""
    Write-Host "⚠️  No changes to commit" -ForegroundColor Yellow
    Write-Host "All files are already committed" -ForegroundColor Yellow
} else {
    # Commit
    Write-Host ""
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    $commitMessage = "Complete NeoBit Multi-Tenant CRM System - Phase 1 & 2 Implementation"
    git commit -m $commitMessage
    Write-Host "✅ Changes committed" -ForegroundColor Green
}

# Push to GitHub (force push to replace all existing code)
Write-Host ""
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "⚠️  This will REPLACE all existing code in the repository!" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Upload cancelled" -ForegroundColor Red
    exit 0
}

# Force push to main branch (replaces all existing code)
Write-Host ""
Write-Host "🔄 Force pushing to main branch..." -ForegroundColor Yellow
git branch -M main
git push -f origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS! Code uploaded to GitHub" -ForegroundColor Green
    Write-Host "🌐 Repository: https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Push failed. You may need to authenticate." -ForegroundColor Red
    Write-Host ""
    Write-Host "To authenticate:" -ForegroundColor Yellow
    Write-Host "1. Use GitHub Personal Access Token" -ForegroundColor Yellow
    Write-Host "2. Or use: git config --global credential.helper wincred" -ForegroundColor Yellow
    Write-Host "3. Or use SSH: git remote set-url origin git@github.com:Taibur-Rahaman/Multi-Tenant-CRM-System.git" -ForegroundColor Yellow
}


