# Interactive Upload Script - Prompts for GitHub Token
param(
    [string]$GitHubToken = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NeoBit CRM - GitHub Upload Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get token if not provided
if ([string]::IsNullOrEmpty($GitHubToken)) {
    Write-Host "To upload code, you need a GitHub Personal Access Token." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick steps to get a token:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "2. Click 'Generate new token' -> 'Generate new token (classic)'" -ForegroundColor White
    Write-Host "3. Name: NeoBit CRM Upload" -ForegroundColor White
    Write-Host "4. Select scope: repo (Full control)" -ForegroundColor White
    Write-Host "5. Generate and copy the token" -ForegroundColor White
    Write-Host ""
    
    # Open token page
    Write-Host "Opening token page in browser..." -ForegroundColor Yellow
    Start-Process "https://github.com/settings/tokens"
    Start-Sleep -Seconds 2
    
    Write-Host ""
    $GitHubToken = Read-Host "Paste your GitHub Personal Access Token here"
    
    if ([string]::IsNullOrEmpty($GitHubToken)) {
        Write-Host ""
        Write-Host "Token is required. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Configuration
$RepoOwner = "Taibur-Rahaman"
$RepoName = "Multi-Tenant-CRM-System"
$defaultBranch = "main"

# Setup headers
$headers = @{
    "Authorization" = "token $GitHubToken"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "NeoBit-CRM-Upload-Script"
}

# Test connection
Write-Host ""
Write-Host "Testing GitHub connection..." -ForegroundColor Yellow
try {
    $user = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers -Method Get
    Write-Host "Connected as: $($user.login)" -ForegroundColor Green
} catch {
    Write-Host "Failed to connect: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check your token and try again." -ForegroundColor Yellow
    exit 1
}

# Check repository
Write-Host ""
Write-Host "Checking repository..." -ForegroundColor Yellow
try {
    $repoUrl = "https://api.github.com/repos/$RepoOwner/$RepoName"
    $repo = Invoke-RestMethod -Uri $repoUrl -Headers $headers -Method Get
    Write-Host "Repository found: $($repo.full_name)" -ForegroundColor Green
} catch {
    Write-Host "Repository not found or no access." -ForegroundColor Red
    Write-Host "Creating repository..." -ForegroundColor Yellow
    
    try {
        $createBody = @{
            name = $RepoName
            description = "NeoBit Multi-Tenant CRM System"
            private = $false
        } | ConvertTo-Json
        
        $repo = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $createBody -ContentType "application/json"
        Write-Host "Repository created successfully!" -ForegroundColor Green
    } catch {
        Write-Host "Failed to create repository: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please create it manually at: https://github.com/new" -ForegroundColor Yellow
        exit 1
    }
}

# Get default branch
try {
    $refUrl = "https://api.github.com/repos/$RepoOwner/$RepoName/git/refs/heads/$defaultBranch"
    $ref = Invoke-RestMethod -Uri $refUrl -Headers $headers -Method Get
    $baseTreeSha = $ref.object.sha
    Write-Host "Current branch: $defaultBranch" -ForegroundColor Cyan
} catch {
    Write-Host "Branch $defaultBranch not found, will create it." -ForegroundColor Yellow
    $baseTreeSha = $null
}

# Scan files
Write-Host ""
Write-Host "Scanning files to upload..." -ForegroundColor Yellow
$excludeDirs = @('node_modules', 'target', '.git', '__pycache__', 'dist', 'build', '.vscode')
$excludeFiles = @('.env', '*.log', '*.tmp', '*.bak')

$files = Get-ChildItem -Path . -Recurse -File | Where-Object {
    $file = $_
    $shouldExclude = $false
    
    foreach ($exDir in $excludeDirs) {
        if ($file.FullName -like "*\$exDir\*") {
            $shouldExclude = $true
            break
        }
    }
    
    foreach ($exFile in $excludeFiles) {
        if ($file.Name -like $exFile) {
            $shouldExclude = $true
            break
        }
    }
    
    -not $shouldExclude
}

Write-Host "Found $($files.Count) files to upload" -ForegroundColor Green
Write-Host ""

# Confirm upload
Write-Host "Ready to upload $($files.Count) files to:" -ForegroundColor Cyan
Write-Host "  https://github.com/$RepoOwner/$RepoName" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Continue? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Upload cancelled." -ForegroundColor Yellow
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
    $content = [System.IO.File]::ReadAllBytes($file.FullName)
    $base64Content = [System.Convert]::ToBase64String($content)
    
    try {
        $fileUrl = "https://api.github.com/repos/$RepoOwner/$RepoName/contents/$relativePath"
        $fileExists = $false
        $existingSha = $null
        
        try {
            $existingFile = Invoke-RestMethod -Uri $fileUrl -Headers $headers -Method Get
            $fileExists = $true
            $existingSha = $existingFile.sha
        } catch {
            # File doesn't exist
        }
        
        if ($fileExists) {
            $bodyObj = @{
                message = "Update $relativePath"
                content = $base64Content
                sha = $existingSha
                branch = $defaultBranch
            } | ConvertTo-Json
        } else {
            $bodyObj = @{
                message = "Add $relativePath"
                content = $base64Content
                branch = $defaultBranch
            } | ConvertTo-Json
        }
        
        $response = Invoke-RestMethod -Uri $fileUrl -Headers $headers -Method Put -Body $bodyObj -ContentType "application/json"
        
        $uploaded++
        Write-Host "[$uploaded/$($files.Count)] $relativePath" -ForegroundColor Green
        
    } catch {
        $failed++
        $errorMsg = "$relativePath : $($_.Exception.Message)"
        $errors += $errorMsg
        Write-Host "[FAILED] $relativePath" -ForegroundColor Red
    }
    
    # Progress every 10 files
    if (($uploaded + $failed) % 10 -eq 0) {
        $percent = [math]::Round((($uploaded + $failed) / $files.Count) * 100, 1)
        Write-Host "Progress: $percent% ($($uploaded + $failed)/$($files.Count))" -ForegroundColor Cyan
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Upload Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Uploaded: $uploaded files" -ForegroundColor Green
Write-Host "Failed: $failed files" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failed -gt 0) {
    Write-Host "Errors:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $error" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($failed -eq 0) {
    Write-Host "SUCCESS! All files uploaded." -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository: https://github.com/$RepoOwner/$RepoName" -ForegroundColor Cyan
    Write-Host ""
    Start-Process "https://github.com/$RepoOwner/$RepoName"
} else {
    Write-Host "Some files failed to upload. Check errors above." -ForegroundColor Yellow
}

