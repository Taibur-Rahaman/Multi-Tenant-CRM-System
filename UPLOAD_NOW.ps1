# Simple Upload Script - Just run this!
param(
    [string]$Token = ""
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  UPLOAD CODE TO GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "STEP 1: Get GitHub Token" -ForegroundColor Yellow
    Write-Host "------------------------" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opening token page..." -ForegroundColor White
    Start-Process "https://github.com/settings/tokens/new"
    Start-Sleep -Seconds 2
    
    Write-Host ""
    Write-Host "On the page:" -ForegroundColor Cyan
    Write-Host "  1. Note: 'NeoBit CRM'" -ForegroundColor White
    Write-Host "  2. Expiration: '90 days'" -ForegroundColor White
    Write-Host "  3. Check: 'repo' (Full control)" -ForegroundColor White
    Write-Host "  4. Click: 'Generate token'" -ForegroundColor White
    Write-Host "  5. COPY the token (starts with ghp_)" -ForegroundColor Yellow
    Write-Host ""
    
    $Token = Read-Host "STEP 2: Paste token here"
    
    if ([string]::IsNullOrEmpty($Token)) {
        Write-Host ""
        Write-Host "No token provided. Exiting." -ForegroundColor Red
        Write-Host ""
        Write-Host "To run with token:" -ForegroundColor Yellow
        Write-Host "  .\UPLOAD_NOW.ps1 -Token YOUR_TOKEN" -ForegroundColor Cyan
        exit 1
    }
}

Write-Host ""
Write-Host "STEP 3: Uploading..." -ForegroundColor Yellow
Write-Host ""

# Config
$headers = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
}
$owner = "Taibur-Rahaman"
$repo = "Multi-Tenant-CRM-System"
$branch = "main"

# Test
try {
    $user = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers
    Write-Host "Connected: $($user.login)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Invalid token!" -ForegroundColor Red
    exit 1
}

# Check repo
try {
    $repoUrl = "https://api.github.com/repos/$owner/$repo"
    $repoInfo = Invoke-RestMethod -Uri $repoUrl -Headers $headers
    Write-Host "Repository: $($repoInfo.full_name)" -ForegroundColor Green
} catch {
    Write-Host "Creating repository..." -ForegroundColor Yellow
    $create = @{
        name = $repo
        description = "NeoBit Multi-Tenant CRM System"
        private = $false
    } | ConvertTo-Json
    try {
        $repoInfo = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $create -ContentType "application/json"
        Write-Host "Repository created!" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Cannot create repository" -ForegroundColor Red
        exit 1
    }
}

# Get files
Write-Host ""
Write-Host "Scanning files..." -ForegroundColor Yellow
$files = Get-ChildItem -Path . -Recurse -File | Where-Object {
    $f = $_
    $f.FullName -notlike "*\node_modules\*" -and
    $f.FullName -notlike "*\target\*" -and
    $f.FullName -notlike "*\.git\*" -and
    $f.FullName -notlike "*\__pycache__\*" -and
    $f.FullName -notlike "*\dist\*" -and
    $f.FullName -notlike "*\build\*" -and
    $f.Name -ne ".env"
}

Write-Host "Found: $($files.Count) files" -ForegroundColor Green
Write-Host ""

# Upload
$uploaded = 0
$failed = 0

foreach ($file in $files) {
    $path = $file.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
    
    try {
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $base64 = [System.Convert]::ToBase64String($bytes)
        
        $url = "https://api.github.com/repos/$owner/$repo/contents/$path"
        $sha = $null
        
        try {
            $existing = Invoke-RestMethod -Uri $url -Headers $headers
            $sha = $existing.sha
        } catch {}
        
        $body = @{
            message = if ($sha) { "Update $path" } else { "Add $path" }
            content = $base64
            branch = $branch
        }
        if ($sha) { $body.sha = $sha }
        
        $bodyJson = $body | ConvertTo-Json
        Invoke-RestMethod -Uri $url -Headers $headers -Method Put -Body $bodyJson -ContentType "application/json" | Out-Null
        
        $uploaded++
        Write-Host "[$uploaded/$($files.Count)] $path" -ForegroundColor Green
    } catch {
        $failed++
        Write-Host "[FAILED] $path" -ForegroundColor Red
    }
}

# Done
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DONE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Uploaded: $uploaded" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""
Write-Host "Repository: https://github.com/$owner/$repo" -ForegroundColor Cyan
Write-Host ""

if ($failed -eq 0) {
    Start-Process "https://github.com/$owner/$repo"
}

