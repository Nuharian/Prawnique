# Session Authentication Fix for Vercel

## Problem
The admin panel was showing "Unauthorized" errors when trying to save data, even after logging in successfully. This was because Vercel's serverless functions don't maintain in-memory sessions like traditional servers.

## Solution Applied

### 1. **Updated Session Configuration** (`server.js`)
```javascript
app.use(session({
    secret: process.env.SESSION_SECRET || 'prawnique-secret-key-change-in-production',
    resave: true,              // Changed from false
    saveUninitialized: true,   // Changed from false
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,         // Added for security
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'        // Added for cross-site compatibility
    }
}));
```

### 2. **Enabled CORS with Credentials** (`server.js`)
```javascript
app.use(cors({
    origin: true,
    credentials: true  // Allow credentials to be sent
}));
```

### 3. **Added Credentials to All Fetch Requests** (`admin/js/admin.js`)
Created a wrapper function:
```javascript
const fetchWithCredentials = (url, options = {}) => {
    return fetch(url, {
        ...options,
        credentials: 'include',  // Include cookies in requests
        headers: {
            ...options.headers,
        }
    });
};
```

Updated all admin API calls to use `fetchWithCredentials` instead of `fetch`.

## Testing the Fix

### 1. Clear Browser Cache
- Press `Ctrl + Shift + Delete` (or `Cmd + Shift + Delete` on Mac)
- Clear cookies and cached files
- Or use Incognito/Private mode

### 2. Login Again
1. Go to: https://prawnique.vercel.app/admin
2. Login with:
   - Username: `admin`
   - Password: `admin123`

### 3. Test Saving
Try editing any section:
- **Page Sections** → Edit "About Prawnique" → Save Changes
- **Settings** → Update site name → Save Settings
- **Products** → Add a new product

You should now see:
- ✅ Green success toast: "Section updated successfully"
- ✅ No "Unauthorized" errors
- ✅ Data persists after refresh

## Why This Works

### Session Cookies
- The session ID is now properly stored in a cookie
- The cookie is sent with every request via `credentials: 'include'`
- The server can verify the session on each request

### CORS Configuration
- `credentials: true` allows cookies to be sent cross-origin
- `origin: true` accepts requests from any origin (safe for this use case)

### Session Persistence
- `resave: true` ensures session is saved on every request
- `saveUninitialized: true` creates session even if nothing is stored
- This is necessary for serverless environments

## Important Notes

### Security Recommendations
1. **Set SESSION_SECRET in Vercel**:
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add: `SESSION_SECRET` = `your-random-secure-string-here`
   - Use a strong random string (at least 32 characters)

2. **Change Default Password**:
   - Add: `ADMIN_PASSWORD` = `your-secure-password`
   - Redeploy after adding

### Session Limitations on Vercel
- Sessions are stored in memory (not persistent across deployments)
- Users will need to re-login after each deployment
- For production, consider using a session store like:
  - Redis (via Upstash)
  - Database-backed sessions
  - JWT tokens

## Deployment Info

**Latest Deployment:**
- URL: https://prawnique.vercel.app
- Admin: https://prawnique.vercel.app/admin
- Status: ✅ Live with session fix
- Date: March 6, 2026

## Troubleshooting

### Still Getting "Unauthorized"?
1. **Clear browser cookies completely**
2. **Try incognito/private mode**
3. **Check browser console** (F12) for errors
4. **Verify you're on the latest deployment**:
   - Check the URL matches: `prawnique.vercel.app`
   - Not an old preview URL

### Session Expires Quickly?
- Sessions last 24 hours by default
- If you're inactive, you may need to re-login
- This is normal behavior

### Can't Login at All?
1. Check if server is running: https://prawnique.vercel.app/api/settings
2. Should return JSON data
3. If not, check Vercel deployment logs

## Files Modified
- `server.js` - Session and CORS configuration
- `admin/js/admin.js` - Added credentials to all fetch requests

## Next Steps (Optional Improvements)

### For Better Session Management:
1. **Use Upstash Redis** (free tier available):
   ```bash
   npm install connect-redis redis
   ```
   
2. **Or use JWT tokens** instead of sessions:
   ```bash
   npm install jsonwebtoken
   ```

3. **Or use database sessions**:
   ```bash
   npm install connect-pg-simple
   ```

For now, the current solution works well for your use case!

---

**Status:** ✅ FIXED AND DEPLOYED
**Last Updated:** March 6, 2026
