# 📤 Upload Code to GitHub - Step by Step Guide

## 🎯 Goal
Upload all current code to: **https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System** and replace all existing code.

---

## 🚀 Method 1: Using PowerShell Script (Easiest)

### Step 1: Install Git (if not installed)
1. Download Git from: https://git-scm.com/download/win
2. Install with default settings
3. Restart PowerShell/Command Prompt

### Step 2: Run the Upload Script
```powershell
# In PowerShell, navigate to project folder
cd C:\Users\NazCafe\Version2.0

# Run the upload script
.\upload-to-github.ps1
```

### Step 3: Authenticate (if prompted)
- If asked for credentials, use your GitHub username and a **Personal Access Token** (not password)
- Create token at: https://github.com/settings/tokens
- Select scope: `repo` (full control of private repositories)

---

## 🛠️ Method 2: Manual Git Commands

### Step 1: Install Git
Download from: https://git-scm.com/download/win

### Step 2: Open PowerShell/Command Prompt
```powershell
cd C:\Users\NazCafe\Version2.0
```

### Step 3: Initialize Git (if needed)
```powershell
git init
```

### Step 4: Add Remote Repository
```powershell
git remote remove origin
git remote add origin https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System.git
```

### Step 5: Add All Files
```powershell
git add .
```

### Step 6: Commit
```powershell
git commit -m "Complete NeoBit Multi-Tenant CRM System - Phase 1 & 2 Implementation"
```

### Step 7: Force Push (Replaces All Existing Code)
```powershell
git branch -M main
git push -f origin main
```

**⚠️ WARNING:** `-f` (force) will DELETE all existing code in the repository and replace it with your local code.

---

## 🔐 Authentication Options

### Option A: Personal Access Token (Recommended)
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name: `NeoBit CRM Upload`
4. Select scope: `repo` (full control)
5. Click "Generate token"
6. Copy the token (you won't see it again!)
7. When Git asks for password, paste the token instead

### Option B: GitHub CLI
```powershell
# Install GitHub CLI
winget install GitHub.cli

# Authenticate
gh auth login

# Then push normally
git push -f origin main
```

### Option C: SSH Key
```powershell
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub: https://github.com/settings/keys
# Then change remote URL:
git remote set-url origin git@github.com:Taibur-Rahaman/Multi-Tenant-CRM-System.git
git push -f origin main
```

---

## 📋 What Will Be Uploaded

All files in the current directory:
- ✅ Backend (Spring Boot)
- ✅ Frontend (React)
- ✅ Android (Java)
- ✅ Telegram Bot (Python)
- ✅ Docker configuration
- ✅ Database schema
- ✅ Documentation (README, API_DOC, etc.)
- ✅ Mock API server
- ✅ All configuration files

**Excluded (via .gitignore):**
- ❌ `.env` files (secrets)
- ❌ `node_modules/` (dependencies)
- ❌ `target/` (build outputs)
- ❌ IDE files

---

## ✅ Verification

After upload, check:
1. Visit: https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System
2. Verify all folders are present:
   - `backend/`
   - `frontend/`
   - `android/`
   - `telegram-bot/`
   - `mock-api/`
   - `docker-compose.yml`
   - `README.md`
   - etc.

---

## 🐛 Troubleshooting

### Error: "Git is not recognized"
**Solution:** Install Git from https://git-scm.com/download/win and restart terminal

### Error: "Authentication failed"
**Solution:** Use Personal Access Token instead of password

### Error: "Permission denied"
**Solution:** Make sure you have write access to the repository

### Error: "Remote origin already exists"
**Solution:** Run `git remote remove origin` first, then add again

### Error: "Failed to push"
**Solution:** 
1. Check internet connection
2. Verify repository URL is correct
3. Try: `git push -f origin main --verbose` for detailed error

---

## 📝 Quick Command Reference

```powershell
# Check git status
git status

# See what will be committed
git status --short

# Add specific file
git add filename

# Commit with message
git commit -m "Your message"

# Push to GitHub
git push origin main

# Force push (replaces everything)
git push -f origin main

# Check remote URL
git remote -v

# View commit history
git log --oneline
```

---

## 🎉 Success!

Once uploaded, your repository will contain:
- Complete multi-tenant CRM system
- All Phase 1 & 2 implementations
- Full documentation
- Docker setup
- Mock API for testing

**Repository URL:** https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System

---

**Need help?** Check the error message and refer to the troubleshooting section above.


