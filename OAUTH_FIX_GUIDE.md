# 🔧 OAuth Redirect URI Fix Guide

## ✅ Code Updated!

The frontend code has been updated to use **backend redirect URIs** (more secure):
- Google: `http://localhost:8080/api/auth/google/callback`
- GitHub: `http://localhost:8080/api/auth/github/callback`

---

## 📋 Step-by-Step Fix

### 1️⃣ Google OAuth Configuration

**Go to:** https://console.cloud.google.com/apis/credentials

1. Find your OAuth 2.0 Client ID: `912910293606-g20s0rs4rhs3nftqkvi9s7isj6n07m4j.apps.googleusercontent.com`
2. Click **Edit** (pencil icon)
3. Under **Authorized redirect URIs**, click **+ ADD URI**
4. Add this URI:
   ```
   http://localhost:8080/api/auth/google/callback
   ```
5. Under **Authorized JavaScript origins**, add:
   ```
   http://localhost:8080
   ```
6. Click **Save**

---

### 2️⃣ GitHub OAuth Configuration

**Go to:** https://github.com/settings/developers

1. Find your OAuth App (Client ID: `Ov23liOFyLPSQHt1LZtN`)
2. Click **Edit**
3. Update **Authorization callback URL** to:
   ```
   http://localhost:8080/api/auth/github/callback
   ```
4. Click **Update application**

---

## 🧪 Test After Configuration

1. **Clear browser data:**
   - Open DevTools (F12)
   - Application tab → Clear storage → Clear site data

2. **Test Google OAuth:**
   - Click "Continue with Google"
   - Should redirect to Google login
   - After login, redirects to backend → then back to frontend

3. **Test GitHub OAuth:**
   - Click "Continue with GitHub"
   - Should redirect to GitHub login
   - After login, redirects to backend → then back to frontend

---

## 🔄 Alternative: Use Frontend Redirect (If Backend Not Ready)

If your backend OAuth endpoints aren't ready yet, you can temporarily use frontend redirects:

### Update Google OAuth App:
- Add: `http://localhost:3000`

### Update GitHub OAuth App:
- Add: `http://localhost:3000`

Then uncomment the frontend redirect code in `index.html` (lines marked with "Option 2").

---

## ⚠️ Important Notes

1. **Backend Required**: The current code expects OAuth endpoints at:
   - `POST /api/auth/google/callback`
   - `POST /api/auth/github/callback`
   - `GET /api/auth/me` (to get user info after login)

2. **For Production**: 
   - Use HTTPS URLs
   - Use your actual domain (not localhost)
   - Example: `https://api.yourdomain.com/api/auth/google/callback`

3. **Security**: 
   - Never expose client secrets in frontend code
   - Always use backend for token exchange
   - Validate state parameter to prevent CSRF

---

## 🐛 Troubleshooting

### Still Getting `redirect_uri_mismatch`?

1. **Check the exact URI** - must match exactly (including trailing slash)
2. **Wait a few minutes** - OAuth providers cache settings
3. **Clear browser cache** - old redirects might be cached
4. **Check OAuth app settings** - verify Client ID matches

### Backend Not Responding?

1. Make sure backend is running on `http://localhost:8080`
2. Check CORS settings allow `http://localhost:3000`
3. Verify OAuth endpoints are implemented in backend

---

## 📞 Need Help?

Check the backend implementation in:
- `backend/src/main/java/com/neobit/crm/controller/AuthController.java`
- Should have endpoints for `/api/auth/google/callback` and `/api/auth/github/callback`

