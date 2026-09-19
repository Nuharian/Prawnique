# 🦐 Prawnique - Deployment Information

## 🌐 Live Website URLs

### Main Production URL:
**https://prawnique.vercel.app**

### Alternative URLs:
- https://prawnique-arian-nuhans-projects.vercel.app
- https://prawnique-o4an0pvk1-arian-nuhans-projects.vercel.app

---

## 🔐 Admin Panel Access

### Admin Panel URL:
**https://prawnique.vercel.app/admin**

### Login Credentials:
- **Username:** `admin`
- **Password:** the value of the `ADMIN_PASSWORD` environment variable

⚠️ **Never commit the real password to this repository — it is public.**

### Required environment variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Why it matters |
| --- | --- |
| `SESSION_SECRET` | Signs the admin auth cookie. Without a strong value, admin sessions can be forged. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. |
| `ADMIN_PASSWORD` | Password for the seeded `admin` account. |
| `POSTGRES_URL` | Vercel Postgres connection string. Without it the app falls back to SQLite in `/tmp`, which is wiped on every deploy. |
| `CLOUDINARY_*` | Image uploads. Without these, uploads go to local disk and disappear on redeploy. |
| `ADMIN_RESET_TOKEN` | Optional. Enables the password-reset endpoint below. Leave unset to keep it disabled. |

### Changing the admin password

`ADMIN_PASSWORD` is only applied when the `admin` account is first created, so
changing it later does **not** update an existing account. To change an existing
password:

1. Set `ADMIN_RESET_TOKEN` to a long random value and redeploy.
2. Call the reset endpoint:
   ```bash
   curl -X POST https://prawnique.vercel.app/api/admin/reset-password \
     -H 'Content-Type: application/json' \
     -d '{"token":"<ADMIN_RESET_TOKEN>","password":"<new password, 10+ chars>"}'
   ```
3. Remove `ADMIN_RESET_TOKEN` and redeploy so the endpoint returns 404 again.

---

## 📋 Deployment Details

- **Deployment Date:** March 6, 2026
- **Platform:** Vercel
- **Status:** ✅ Production Ready
- **Build Time:** ~14 seconds
- **Region:** iad1 (US East)

---

## 🎯 What's Deployed

### Latest Changes:
✅ Fixed admin panel form submission issues
✅ Removed duplicate `linkedin_url` key bug
✅ Improved error handling across all save functions
✅ Added detailed error messages and console logging
✅ Created debug helper tools
✅ Added comprehensive documentation

### Features Available:
- ✅ Homepage with slider
- ✅ Products catalog
- ✅ Team members showcase
- ✅ News/Blog section
- ✅ Gallery
- ✅ Contact form
- ✅ Newsletter subscription
- ✅ Full admin CMS panel

---

## 🛠️ Admin Panel Features

Once logged in, you can manage:

1. **Dashboard** - Overview statistics
2. **Homepage Slider** - Add/edit/reorder slider images
3. **Page Sections** - Edit content for various sections
4. **Products** - Full CRUD for products
5. **Team Members** - Manage team profiles
6. **News/Blog** - Create and publish posts
7. **Gallery** - Upload and manage images
8. **Contact Messages** - View submissions
9. **Settings** - Site-wide settings

---

## 🔧 Testing the Admin Panel

### Quick Test:
1. Visit: https://prawnique.vercel.app/admin
2. Login with credentials above
3. Try editing Settings → Save
4. Try adding a Product
5. Check if success notifications appear

### Debug Helper:
Visit: https://prawnique.vercel.app/DEBUG_ADMIN_FORMS.html
- Run automated tests
- Verify all endpoints are working
- Check authentication status

---

## 📊 Database

The application uses **Vercel Postgres** for production.

Default data includes:
- 1 Admin user
- Site settings
- Product categories (4 default categories)
- Page sections (hero, about, mission)

---

## 🚀 Future Deployments

### Automatic Deployments:
Every push to the `master` branch will automatically deploy to Vercel.

### Manual Deployment:
```bash
vercel --prod
```

### Check Deployment Status:
```bash
vercel ls
```

---

## 📞 Support

If you encounter any issues:
1. Check browser console (F12) for errors
2. Review server logs in Vercel Dashboard
3. Verify environment variables are set
4. Ensure database is properly configured

---

## 🔒 Security Recommendations

1. **Change default admin password** immediately
2. Set strong `SESSION_SECRET` in environment variables
3. Enable 2FA on your Vercel account
4. Regularly update dependencies
5. Monitor access logs

---

## 📝 Notes

- The admin panel is fully functional
- All form submissions are working correctly
- Error handling has been improved
- Console logging added for debugging
- Database is persistent (Vercel Postgres)

---

**Deployment Status:** ✅ LIVE AND READY

**Last Updated:** March 6, 2026
