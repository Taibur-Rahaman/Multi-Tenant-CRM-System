# Setup GitHub Desktop for Easy Upload
# This script helps you download and set up GitHub Desktop

Write-Host "🚀 GitHub Desktop Setup Helper" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if GitHub Desktop is installed
$ghDesktopPath = "$env:LOCALAPPDATA\GitHubDesktop\GitHubDesktop.exe"
if (Test-Path $ghDesktopPath) {
    Write-Host "✅ GitHub Desktop is already installed!" -ForegroundColor Green
    Write-Host "   Location: $ghDesktopPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Open GitHub Desktop" -ForegroundColor White
    Write-Host "2. Sign in with your GitHub account" -ForegroundColor White
    Write-Host "3. File → Clone repository → Select: Taibur-Rahaman/Multi-Tenant-CRM-System" -ForegroundColor White
    Write-Host "4. Extract NeoBit-CRM-Complete.zip and copy files to cloned folder" -ForegroundColor White
    Write-Host "5. Commit and push!" -ForegroundColor White
    Write-Host ""
    
    # Try to open GitHub Desktop
    Write-Host "🔍 Opening GitHub Desktop..." -ForegroundColor Yellow
    Start-Process $ghDesktopPath
    exit 0
}

Write-Host "📥 GitHub Desktop is not installed." -ForegroundColor Yellow
Write-Host ""
Write-Host "Would you like to:" -ForegroundColor Cyan
Write-Host "1. Download GitHub Desktop (Recommended)" -ForegroundColor White
Write-Host "2. Use API script with Personal Access Token" -ForegroundColor White
Write-Host "3. Use ZIP file upload via web browser" -ForegroundColor White
Write-Host ""

# Open download page
Write-Host "🌐 Opening GitHub Desktop download page..." -ForegroundColor Yellow
Start-Process "https://desktop.github.com/"

Write-Host ""
Write-Host "📋 After installing GitHub Desktop:" -ForegroundColor Cyan
Write-Host "1. Open GitHub Desktop" -ForegroundColor White
Write-Host "2. Sign in with:" -ForegroundColor White
Write-Host "   Email: mohammadnazim301@gmail.com" -ForegroundColor Yellow
Write-Host "   (Use your GitHub password)" -ForegroundColor Yellow
Write-Host "3. Clone repository: Taibur-Rahaman/Multi-Tenant-CRM-System" -ForegroundColor White
Write-Host "4. Extract NeoBit-CRM-Complete.zip" -ForegroundColor White
Write-Host "5. Copy all files to the cloned folder" -ForegroundColor White
Write-Host "6. Commit and push!" -ForegroundColor White
Write-Host ""

