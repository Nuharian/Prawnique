# Login Fix Instructions

## Latest Update - Session Cookie Fix

The login issue has been fixed with proper cookie settings for Vercel deployment.

## How to Test the Login

### Step 1: Clear Everything
**This is CRITICAL - you must clear your browser completely:**

1. **Open Developer Tools** (Press F12)
2. **Go to Application tab** (Chrome) or **Storage tab** (Firefox)
3. **Clear all cookies** for prawnique.vercel.app
4. **Clear all local storage**
5. **Close Developer Tools**
6. **Hard refresh** the page (Ctrl + Shift + R or Cmd + Shift + R)

**OR use Incognito/Private mode** (easier option)

### Step 2: Login
1. Go to: **https://prawnique.vercel.app/admin**
2. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
3. Click Login

### Step 3: Check Console
If login doesn't work:
1. Press F12 to open Developer Tools
2. Go to Console tab
3. Look for the message: `Login response: {success: true, username: "admin"}`
4. Take a screenshot and share it

## What Was Fixed

### 1. Session Save Callback
Added explicit session save before responding:
```javascript
req.session.save((err) => {
    if (err) {
        return res.status(500).json({ error: 'Session error' });
    }
    res.json({ success: true, username: admin.username });
});
```

### 2. Cookie Settings
Updated for cross-origin compatibility:
```javascript
cookie: {
    secure: true,        // Required for HTTPS
    httpOnly: true,      // Security
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    sameSite: 'none'     // Allow cross-origin
}
```

### 3. Debug Logging
Added console logs to track login process:
- Login response is logged
- Errors are logged
- You can see what's happening

## Troubleshooting

### "Invalid credentials" error
- Double-check username: `admin` (lowercase)
- Double-check password: `admin123`
- Make sure there are no extra spaces

### Login button does nothing
1. Open Console (F12)
2. Look for errors
3. Check if you see "Logging in..." message
4. Check Network tab for the login request

### "Connection error"
- Check if the site is loading: https://prawnique.vercel.app
- Check your internet connection
- Try refreshing the page

### Login works but then shows "Unauthorized"
- This means cookies aren't being saved
- Clear ALL cookies and try again
- Use Incognito mode
- Check if your browser blocks third-party cookies

## Testing Checklist

- [ ] Cleared browser cookies completely
- [ ] Went to https://prawnique.vercel.app/admin
- [ ] Entered username: admin
- [ ] Entered password: admin123
- [ ] Clicked Login button
- [ ] Checked console for "Login response" message
- [ ] Admin panel loaded successfully

## Expected Behavior

### On Successful Login:
1. You see "Logging in..." message
2. Then "Login successful! Loading..."
3. Admin panel appears
4. You see dashboard with stats
5. All menu items are clickable

### After Login:
- You can navigate between sections
- You can save data without "Unauthorized" errors
- Session lasts 24 hours
- You stay logged in even after refresh

## Still Having Issues?

If login still doesn't work after following all steps:

1. **Take screenshots of:**
   - The login page
   - Browser console (F12 → Console tab)
   - Network tab showing the /api/admin/login request

2. **Check:**
   - Are you on https://prawnique.vercel.app (not an old URL)?
   - Did you clear cookies completely?
   - Are you using a modern browser (Chrome, Firefox, Edge)?

3. **Try:**
   - Different browser
   - Incognito/Private mode
   - Different device

## Current Deployment

- **URL:** https://prawnique.vercel.app/admin
- **Status:** ✅ Live with login fix
- **Last Updated:** March 6, 2026
- **Username:** admin
- **Password:** admin123

---

**Remember:** Always clear cookies/cache or use Incognito mode when testing!
