# Upload Script with GitHub Credentials
param(
    [string]$GitHubToken = "",
    [string]$GitHubEmail = "mohammadnazim301@gmail.com",
    [string]$GitHubUsername = "mdnazimdev"
)

$RepoOwner = "Taibur-Rahaman"
$RepoName = "Multi-Tenant-CRM-System"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NeoBit CRM - GitHub Upload" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "GitHub Account:" -ForegroundColor Yellow
Write-Host "  Email: $GitHubEmail" -ForegroundColor White
Write-Host "  Username: $GitHubUsername" -ForegroundColor White
Write-Host "  Repository: $RepoOwner/$RepoName" -ForegroundColor White
Write-Host ""

# Check if token provided
if ([string]::IsNullOrEmpty($GitHubToken)) {
    Write-Host "You need a GitHub Personal Access Token to upload." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Getting token (2 steps):" -ForegroundColor Cyan
    Write-Host "1. Opening token creation page..." -ForegroundColor White
    Start-Process "https://github.com/settings/tokens/new"
    Start-Sleep -Seconds 3
    
    Write-Host ""
    Write-Host "2. On the page that opened:" -ForegroundColor Cyan
    Write-Host "   - Note: NeoBit CRM Upload" -ForegroundColor White
    Write-Host "   - Expiration: 90 days (or No expiration)" -ForegroundColor White
    Write-Host "   - Check: repo (Full control of private repositories)" -ForegroundColor White
    Write-Host "   - Click: Generate token" -ForegroundColor White
    Write-Host "   - COPY THE TOKEN (starts with ghp_)" -ForegroundColor Yellow
    Write-Host ""
    
    $GitHubToken = Read-Host "Paste your token here (or press Enter to cancel)"
    
    if ([string]::IsNullOrEmpty($GitHubToken)) {
        Write-Host ""
        Write-Host "Token required. Exiting." -ForegroundColor Red
        Write-Host ""
        Write-Host "You can run this script again with:" -ForegroundColor Yellow
        Write-Host "  .\upload-with-credentials.ps1 -GitHubToken YOUR_TOKEN" -ForegroundColor Cyan
        exit 1
    }
}

# Setup API headers
$headers = @{
    "Authorization" = "token $GitHubToken"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "NeoBit-CRM-Upload"
}

# Test connection
Write-Host ""
Write-Host "Testing connection to GitHub..." -ForegroundColor Yellow
try {
    $user = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers -Method Get
    if ($user.login -eq $GitHubUsername) {
        Write-Host "Connected as: $($user.login)" -ForegroundColor Green
    } else {
        Write-Host "Connected as: $($user.login) (expected: $GitHubUsername)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Connection failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check your token and try again." -ForegroundColor Yellow
    exit 1
}

# Check/Create repository
Write-Host ""
Write-Host "Checking repository..." -ForegroundColor Yellow
try {
    $repoUrl = "https://api.github.com/repos/$RepoOwner/$RepoName"
    $repo = Invoke-RestMethod -Uri $repoUrl -Headers $headers -Method Get
    Write-Host "Repository found: $($repo.full_name)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "Repository not found. Creating..." -ForegroundColor Yellow
        try {
            $createBody = @{
                name = $RepoName
                description = "NeoBit Multi-Tenant CRM System - Complete Production Code"
                private = $false
                auto_init = $false
            } | ConvertTo-Json
            
            $repo = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $createBody -ContentType "application/json"
            Write-Host "Repository created successfully!" -ForegroundColor Green
        } catch {
            Write-Host "Failed to create: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Please create it manually at: https://github.com/new" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "Error accessing repository: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Get default branch
$defaultBranch = "main"
try {
    $refUrl = "https://api.github.com/repos/$RepoOwner/$RepoName/git/refs/heads/$defaultBranch"
    $ref = Invoke-RestMethod -Uri $refUrl -Headers $headers -Method Get
    Write-Host "Using branch: $defaultBranch" -ForegroundColor Cyan
} catch {
    Write-Host "Branch $defaultBranch will be created with first commit." -ForegroundColor Yellow
}

# Scan files
Write-Host ""
Write-Host "Scanning files..." -ForegroundColor Yellow
$excludeDirs = @('node_modules', 'target', '.git', '__pycache__', 'dist', 'build', '.vscode')
$excludeFiles = @('.env')

$files = Get-ChildItem -Path . -Recurse -File | Where-Object {
    $file = $_
    $exclude = $false
    
    foreach ($dir in $excludeDirs) {
        if ($file.FullName -like "*\$dir\*") {
            $exclude = $true
            break
        }
    }
    
    if (-not $exclude) {
        foreach ($pattern in $excludeFiles) {
            if ($file.Name -like $pattern) {
                $exclude = $true
                break
            }
        }
    }
    
    -not $exclude
}

Write-Host "Found $($files.Count) files to upload" -ForegroundColor Green
Write-Host ""

# Confirm
Write-Host "Ready to upload to:" -ForegroundColor Cyan
Write-Host "  https://github.com/$RepoOwner/$RepoName" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Continue? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

# Upload files
Write-Host ""
Write-Host "Uploading files..." -ForegroundColor Yellow
Write-Host ""

$uploaded = 0
$failed = 0
$errors = @()

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
    
    try {
        $content = [System.IO.File]::ReadAllBytes($file.FullName)
        $base64Content = [System.Convert]::ToBase64String($content)
        
        $fileUrl = "https://api.github.com/repos/$RepoOwner/$RepoName/contents/$relativePath"
        $fileExists = $false
        $existingSha = $null
        
        try {
            $existing = Invoke-RestMethod -Uri $fileUrl -Headers $headers -Method Get
            $fileExists = $true
            $existingSha = $existing.sha
        } catch {
            # File doesn't exist
        }
        
        if ($fileExists) {
            $body = @{
                message = "Update $relativePath"
                content = $base64Content
                sha = $existingSha
                branch = $defaultBranch
            } | ConvertTo-Json
        } else {
            $body = @{
                message = "Add $relativePath"
                content = $base64Content
                branch = $defaultBranch
            } | ConvertTo-Json
        }
        
        $response = Invoke-RestMethod -Uri $fileUrl -Headers $headers -Method Put -Body $body -ContentType "application/json"
        
        $uploaded++
        $percent = [math]::Round(($uploaded / $files.Count) * 100, 1)
        Write-Host "[$percent%] $relativePath" -ForegroundColor Green
        
    } catch {
        $failed++
        $errorMsg = "$relativePath - $($_.Exception.Message)"
        $errors += $errorMsg
        Write-Host "[FAILED] $relativePath" -ForegroundColor Red
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Upload Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Uploaded: $uploaded files" -ForegroundColor Green
Write-Host "Failed: $failed files" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failed -gt 0 -and $failed -le 5) {
    Write-Host "Errors:" -ForegroundColor Yellow
    foreach ($err in $errors) {
        Write-Host "  $err" -ForegroundColor Red
    }
    Write-Host ""
}

if ($failed -eq 0) {
    Write-Host "SUCCESS! All files uploaded." -ForegroundColor Green
    Write-Host ""
    Write-Host "View repository:" -ForegroundColor Cyan
    Write-Host "  https://github.com/$RepoOwner/$RepoName" -ForegroundColor White
    Write-Host ""
    Start-Process "https://github.com/$RepoOwner/$RepoName"
} else {
    Write-Host "Some files failed. Check errors above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Repository: https://github.com/$RepoOwner/$RepoName" -ForegroundColor Cyan
}

