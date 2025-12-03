# Auto-Upload Script - Tries Multiple Methods
param(
    [string]$GitHubEmail = "mohammadnazim301@gmail.com",
    [string]$GitHubUsername = "mdnazimdev"
)

Write-Host "NeoBit CRM - Auto Upload Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Method 1: Check for GitHub Desktop
Write-Host "Method 1: Checking for GitHub Desktop..." -ForegroundColor Yellow
$ghDesktopPath = "$env:LOCALAPPDATA\GitHubDesktop\GitHubDesktop.exe"
if (Test-Path $ghDesktopPath) {
    Write-Host "GitHub Desktop found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Please follow these steps:" -ForegroundColor Cyan
    Write-Host "1. Open GitHub Desktop" -ForegroundColor White
    Write-Host "2. Sign in with: $GitHubEmail" -ForegroundColor White
    Write-Host "3. File -> Clone repository" -ForegroundColor White
    Write-Host "4. Select: Taibur-Rahaman/Multi-Tenant-CRM-System" -ForegroundColor White
    Write-Host "5. Extract NeoBit-CRM-Complete.zip" -ForegroundColor White
    Write-Host "6. Copy all files to cloned folder" -ForegroundColor White
    Write-Host "7. Commit and push" -ForegroundColor White
    Write-Host ""
    Write-Host "Opening GitHub Desktop..." -ForegroundColor Yellow
    Start-Process $ghDesktopPath
    exit 0
}

# Method 2: Check for Git
Write-Host "GitHub Desktop not found" -ForegroundColor Red
Write-Host ""
Write-Host "Method 2: Checking for Git..." -ForegroundColor Yellow
try {
    $null = git --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Git found!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Setting up Git repository..." -ForegroundColor Cyan
        
        if (-not (Test-Path ".git")) {
            git init
            git branch -M main
        }
        
        $remoteUrl = "https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System.git"
        try {
            git remote remove origin 2>$null
        } catch {}
        git remote add origin $remoteUrl
        
        Write-Host "Adding files..." -ForegroundColor Yellow
        git add .
        
        Write-Host "Committing..." -ForegroundColor Yellow
        git commit -m "Complete NeoBit Multi-Tenant CRM System" 2>&1 | Out-Null
        
        Write-Host ""
        Write-Host "Authentication Required" -ForegroundColor Yellow
        Write-Host "You need a Personal Access Token to push." -ForegroundColor White
        Write-Host ""
        Write-Host "Get token: https://github.com/settings/tokens" -ForegroundColor Cyan
        Write-Host "Then run: git push -u origin main" -ForegroundColor Cyan
        Write-Host "Username: $GitHubUsername" -ForegroundColor White
        Write-Host "Password: [paste your token]" -ForegroundColor White
        Write-Host ""
        exit 0
    }
} catch {
    Write-Host "Git not found" -ForegroundColor Red
}

# Method 3: Manual ZIP Upload
Write-Host ""
Write-Host "Method 3: Manual ZIP Upload (Always Available)" -ForegroundColor Green
Write-Host ""
Write-Host "ZIP file ready: NeoBit-CRM-Complete.zip" -ForegroundColor Cyan
Write-Host ""
Write-Host "Steps:" -ForegroundColor Yellow
Write-Host "1. Extract NeoBit-CRM-Complete.zip" -ForegroundColor White
Write-Host "2. Go to: https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System" -ForegroundColor White
Write-Host "3. Click Add file -> Upload files" -ForegroundColor White
Write-Host "4. Drag and drop all extracted files" -ForegroundColor White
Write-Host "5. Commit changes" -ForegroundColor White
Write-Host ""

# Open helpful pages
Write-Host "Opening helpful pages..." -ForegroundColor Yellow
Start-Process "https://desktop.github.com/"
Start-Sleep -Seconds 2
Start-Process "https://github.com/settings/tokens"
Start-Sleep -Seconds 2
Start-Process "https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System"

Write-Host ""
Write-Host "All options presented! Choose the method that works best for you." -ForegroundColor Green
