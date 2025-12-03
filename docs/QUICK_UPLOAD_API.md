# 🚀 Quick Upload via GitHub API

## ✅ Script Ready: `upload-via-api.ps1`

This script will upload all your code to GitHub automatically!

---

## Step 1: Get GitHub Personal Access Token (2 minutes)

1. **Go to:** https://github.com/settings/tokens
2. **Click:** "Generate new token" → "Generate new token (classic)"
3. **Name:** `NeoBit CRM Upload`
4. **Expiration:** Choose 90 days (or No expiration)
5. **Select scopes:** Check ✅ **`repo`** (Full control of private repositories)
6. **Click:** "Generate token" (at bottom)
7. **COPY THE TOKEN** - You won't see it again! It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 2: Run the Upload Script

Open PowerShell in your project folder and run:

```powershell
.\upload-via-api.ps1 -GitHubToken YOUR_TOKEN_HERE
```

**Replace `YOUR_TOKEN_HERE` with the token you copied!**

Example:
```powershell
.\upload-via-api.ps1 -GitHubToken ghp_abc123xyz789...
```

---

## ✅ That's It!

The script will:
- ✅ Connect to GitHub
- ✅ Check your repository
- ✅ Upload all 45+ files
- ✅ Show progress
- ✅ Give you a summary

---

## 🆘 Troubleshooting

### "Repository not found"
- Make sure the repo exists: https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System
- If not, create it first at: https://github.com/new

### "Authentication failed"
- Check your token is correct
- Make sure you selected the `repo` scope
- Token might have expired - generate a new one

### "Permission denied"
- Make sure you're the owner of the repository
- Or you have write access to it

---

## 🎯 Alternative: Use ZIP File Method

If the API method doesn't work, use the ZIP file:
1. Extract `NeoBit-CRM-Complete.zip`
2. Use GitHub Desktop or web interface
3. See `UPLOAD_VIA_WEB.md` for details

---

**Ready? Get your token and run the script!** 🚀

