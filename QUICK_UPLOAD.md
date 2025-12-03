# 🚀 Quick Upload to GitHub

## ⚡ Fastest Way (3 Steps)

### Step 1: Install Git
Download and install: **https://git-scm.com/download/win**
- Click "Download for Windows"
- Run installer with default settings
- **Restart your terminal/PowerShell after installation**

### Step 2: Run Upload Script
Open PowerShell in this folder and run:
```powershell
.\upload-to-github.ps1
```

**OR** double-click: `upload-to-github.bat`

### Step 3: Authenticate
When prompted:
- **Username:** Your GitHub username
- **Password:** Use a **Personal Access Token** (not your password!)

**Get Token:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `NeoBit Upload`
4. Check: `repo` (full control)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. Paste it when Git asks for password

---

## ✅ Done!

Your code will be uploaded to:
**https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System**

---

## 🆘 Having Issues?

### "Git is not recognized"
→ Install Git and **restart terminal**

### "Authentication failed"
→ Use Personal Access Token, not password

### "Permission denied"
→ Make sure you have access to the repository

### Still stuck?
→ See `GITHUB_UPLOAD_INSTRUCTIONS.md` for detailed help


