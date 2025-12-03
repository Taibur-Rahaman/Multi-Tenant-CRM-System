# 🔧 OAuth Troubleshooting Guide

## 🐛 Common Errors & Solutions

### 1. "Invalid or expired code"

**Symptoms:**
- After OAuth login, you see: `{"detail": "Invalid or expired code"}`

**Causes:**
- Code expired (5 minute timeout)
- Code already used (one-time use)
- Code not generated properly
- Server restarted (codes stored in memory)

**Solutions:**
1. **Try logging in again** - Generate a fresh code
2. **Check server logs** - Look for `[OAuth]` and `[DEBUG]` messages
3. **Check browser console** - Look for `[OAuth]` messages
4. **Verify server is running** - Check `http://localhost:8080/health`

---

### 2. "Failed to exchange code" / Network Error

**Symptoms:**
- Browser console shows: `Failed to exchange OAuth code`
- Network tab shows failed request

**Causes:**
- Server not running
- CORS issue
- Wrong API URL

**Solutions:**
1. **Check server is running:**
   ```bash
   curl http://localhost:8080/health
   ```

2. **Check API URL in frontend:**
   - Open browser console (F12)
   - Check `API_URL` constant
   - Should be: `http://localhost:8080`

3. **Check CORS:**
   - Server should allow `http://localhost:3000`
   - Check server logs for CORS errors

---

### 3. "OAuth failed: no_code"

**Symptoms:**
- Redirected to: `?error=no_code`

**Causes:**
- OAuth provider didn't send code
- Redirect URI mismatch
- OAuth app not configured

**Solutions:**
1. **Check OAuth app settings:**
   - Google: https://console.cloud.google.com/apis/credentials
   - GitHub: https://github.com/settings/developers
   - Redirect URI must be: `http://localhost:8080/api/auth/google/callback`

2. **Check browser console** - Look for OAuth errors

3. **Try again** - Sometimes OAuth providers have temporary issues

---

### 4. Code in URL but Exchange Fails

**Symptoms:**
- URL shows: `?code=xxx&provider=google`
- But exchange fails

**Debug Steps:**
1. **Open browser console (F12)**
2. **Check Network tab:**
   - Look for POST to `/api/auth/exchange`
   - Check request URL and response

3. **Check server logs:**
   - Look for `[DEBUG] Exchange request for code:`
   - Look for `[DEBUG] Available codes:`

4. **Manual test:**
   ```bash
   # Replace CODE_HERE with actual code from URL
   curl -X POST "http://localhost:8080/api/auth/exchange?code=CODE_HERE"
   ```

---

## 🔍 Debugging Steps

### Step 1: Check Server Status

```bash
# Test health endpoint
curl http://localhost:8080/health

# Should return: {"status":"healthy",...}
```

### Step 2: Check Browser Console

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for messages starting with `[OAuth]`
4. Check for any red error messages

### Step 3: Check Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Try OAuth login
4. Look for:
   - Request to `/api/auth/google/callback` or `/api/auth/github/callback`
   - Request to `/api/auth/exchange`
   - Check status codes (should be 200 or 302)

### Step 4: Check Server Logs

Look for these messages in server output:
```
[OAuth] Generated code for Google: ...
[OAuth] Total codes stored: 1
[DEBUG] Exchange request for code: ...
[DEBUG] Exchange successful for user: ...
```

---

## 🧪 Manual Testing

### Test OAuth Callback (Google)

```bash
# Simulate OAuth callback
curl "http://localhost:8080/api/auth/google/callback?code=test123&state=%7B%22role%22%3A%22VENDOR_ADMIN%22%7D" -L

# Should redirect to: http://localhost:3000?code=xxx&provider=google
```

### Test Exchange Endpoint

```bash
# First, get a code from OAuth callback above
# Then exchange it:
curl -X POST "http://localhost:8080/api/auth/exchange?code=YOUR_CODE_HERE"

# Should return: {"accessToken":"...","user":{...}}
```

---

## 📝 What to Check

### ✅ Server Running?
```bash
curl http://localhost:8080/health
```

### ✅ Frontend Running?
```bash
# Open: http://localhost:3000
```

### ✅ OAuth Apps Configured?
- Google: Redirect URI = `http://localhost:8080/api/auth/google/callback`
- GitHub: Callback URL = `http://localhost:8080/api/auth/github/callback`

### ✅ Browser Console?
- Open F12 → Console tab
- Look for errors

### ✅ Network Requests?
- Open F12 → Network tab
- Check if requests are being made
- Check response status codes

---

## 🆘 Still Having Issues?

1. **Share the exact error message** from:
   - Browser console
   - Server logs
   - Network tab response

2. **Check these files:**
   - `mock-api/server.py` - Server code
   - `frontend/public/index.html` - Frontend code

3. **Try these:**
   - Clear browser cache
   - Clear localStorage: `localStorage.clear()`
   - Restart server
   - Restart frontend

4. **Common fixes:**
   - Make sure server is running on port 8080
   - Make sure frontend is running on port 3000
   - Check OAuth redirect URIs match exactly
   - Wait 1-2 minutes after changing OAuth settings

---

## 📞 Quick Fixes

### Reset Everything

```javascript
// In browser console (F12):
localStorage.clear();
location.reload();
```

### Restart Server

```bash
# Stop server
Stop-Process -Name python -Force

# Start server
cd mock-api
python server.py
```

### Check OAuth Flow

1. Click "Continue with Google"
2. Login with Google
3. Check URL after redirect
4. Should see: `?code=xxx&provider=google`
5. Code should be exchanged automatically
6. Should redirect to dashboard

---

## 🔍 Error Messages Reference

| Error | Meaning | Solution |
|-------|---------|----------|
| `Invalid or expired code` | Code not found or expired | Try logging in again |
| `Code expired` | Code older than 5 minutes | Generate new code |
| `no_code` | OAuth provider didn't send code | Check OAuth app settings |
| `Failed to exchange code` | Network/server error | Check server is running |
| `CORS error` | Cross-origin request blocked | Check CORS settings |

---

**Need more help?** Share the exact error message and I'll help debug it! 🚀



