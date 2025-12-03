# GitHub API Upload Script for NeoBit CRM
# This script uploads all files to GitHub using the REST API

param(
    [string]$GitHubToken = "",
    [string]$RepoOwner = "Taibur-Rahaman",
    [string]$RepoName = "Multi-Tenant-CRM-System"
)

Write-Host "🚀 GitHub API Upload Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if token is provided
if ([string]::IsNullOrEmpty($GitHubToken)) {
    Write-Host "❌ GitHub Personal Access Token is required!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 How to get a GitHub Token:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "2. Click 'Generate new token' → 'Generate new token (classic)'" -ForegroundColor White
    Write-Host "3. Name it: 'NeoBit CRM Upload'" -ForegroundColor White
    Write-Host "4. Select scopes: 'repo' (full control of private repositories)" -ForegroundColor White
    Write-Host "5. Click 'Generate token'" -ForegroundColor White
    Write-Host "6. Copy the token (you won't see it again!)" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run:" -ForegroundColor Yellow
    Write-Host "  .\upload-via-api.ps1 -GitHubToken YOUR_TOKEN_HERE" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Test GitHub API connection
Write-Host "🔍 Testing GitHub API connection..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "token $GitHubToken"
        "Accept" = "application/vnd.github.v3+json"
    }
    $response = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers -Method Get
    Write-Host "✅ Connected as: $($response.login)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to connect to GitHub: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Please check your token and try again." -ForegroundColor Yellow
    exit 1
}

# Check if repository exists
Write-Host ""
Write-Host "🔍 Checking repository..." -ForegroundColor Yellow
try {
    $repoUrl = "https://api.github.com/repos/$RepoOwner/$RepoName"
    $repo = Invoke-RestMethod -Uri $repoUrl -Headers $headers -Method Get
    Write-Host "✅ Repository found: $($repo.full_name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Repository not found or no access: $RepoOwner/$RepoName" -ForegroundColor Red
    Write-Host "   Please create it first at: https://github.com/new" -ForegroundColor Yellow
    exit 1
}

# Get all files to upload
Write-Host ""
Write-Host "📂 Scanning files..." -ForegroundColor Yellow
$excludeDirs = @('node_modules', 'target', '.git', '__pycache__', 'dist', 'build', '.vscode')
$excludeFiles = @('.env', '*.log', '*.tmp', '*.bak')

$files = Get-ChildItem -Path . -Recurse -File | Where-Object {
    $file = $_
    $shouldExclude = $false
    
    # Check if in excluded directory
    foreach ($exDir in $excludeDirs) {
        if ($file.FullName -like "*\$exDir\*") {
            $shouldExclude = $true
            break
        }
    }
    
    # Check if file name matches exclude pattern
    foreach ($exFile in $excludeFiles) {
        if ($file.Name -like $exFile) {
            $shouldExclude = $true
            break
        }
    }
    
    -not $shouldExclude
}

Write-Host "✅ Found $($files.Count) files to upload" -ForegroundColor Green
Write-Host ""

# Get default branch
$defaultBranch = $repo.default_branch
Write-Host "📝 Using branch: $defaultBranch" -ForegroundColor Cyan
Write-Host ""

# Get current tree SHA (for updating existing files)
Write-Host "🔍 Getting current repository state..." -ForegroundColor Yellow
try {
    $refUrl = "https://api.github.com/repos/$RepoOwner/$RepoName/git/refs/heads/$defaultBranch"
    $ref = Invoke-RestMethod -Uri $refUrl -Headers $headers -Method Get
    $baseTreeSha = $ref.object.sha
    Write-Host "✅ Current commit SHA: $baseTreeSha" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not get current commit (might be empty repo)" -ForegroundColor Yellow
    $baseTreeSha = $null
}

# Upload files
Write-Host ""
Write-Host "📤 Uploading files..." -ForegroundColor Yellow
Write-Host ""

$uploaded = 0
$failed = 0
$tree = @()

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
    $content = [System.IO.File]::ReadAllBytes($file.FullName)
    $base64Content = [System.Convert]::ToBase64String($content)
    
    try {
        # Check if file exists
        $fileUrl = "https://api.github.com/repos/$RepoOwner/$RepoName/contents/$relativePath"
        $fileExists = $false
        $existingSha = $null
        
        try {
            $existingFile = Invoke-RestMethod -Uri $fileUrl -Headers $headers -Method Get
            $fileExists = $true
            $existingSha = $existingFile.sha
        } catch {
            # File doesn't exist, that's okay
        }
        
        # Prepare request body
        $body = @{
            message = "Upload $relativePath"
            content = $base64Content
            branch = $defaultBranch
        } | ConvertTo-Json
        
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
        
        # Upload file
        $response = Invoke-RestMethod -Uri $fileUrl -Headers $headers -Method Put -Body $bodyObj -ContentType "application/json"
        
        $uploaded++
        Write-Host "✅ $relativePath" -ForegroundColor Green
        
    } catch {
        $failed++
        Write-Host "❌ Failed: $relativePath - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Progress indicator
    if (($uploaded + $failed) % 10 -eq 0) {
        Write-Host "   Progress: $($uploaded + $failed) / $($files.Count)" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📊 Upload Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Uploaded: $uploaded files" -ForegroundColor Green
Write-Host "❌ Failed: $failed files" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 All files uploaded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Repository: https://github.com/$RepoOwner/$RepoName" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Some files failed to upload. Please check the errors above." -ForegroundColor Yellow
}

