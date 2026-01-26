# 🦐 Prawnique

Premium prawn selling website with full CMS admin panel.

## Features

- **Beautiful Frontend** - Ocean Elegance theme with water wave animations
- **Full CMS** - Admin panel to manage all content
- **Cloudinary** - Image uploads to cloud
- **Vercel Postgres** - Cloud database for production
- **Local Fallback** - SQLite + local storage for development

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Run the server
npm start

# Open http://localhost:3000
# Admin: http://localhost:3000/admin (admin / admin123)
```

## Deploy to Vercel

### 1. Setup Cloudinary (Free)

1. Go to [cloudinary.com](https://cloudinary.com) and sign up
2. Get your credentials from Dashboard:
   - Cloud Name
   - API Key
   - API Secret

### 2. Deploy to Vercel

1. Push this project to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add a **Postgres Database** from Vercel Dashboard:
   - Go to Storage → Create Database → Postgres
4. Add Environment Variables in Vercel:

```
# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Session (generate a random string)
SESSION_SECRET=your-random-secret-string

# Admin (change these!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

5. Deploy!

## Project Structure

```
├── server.js           # Express backend
├── database/init.js    # Database (Vercel Postgres + SQLite fallback)
├── utils/upload.js     # Image uploads (Cloudinary + local fallback)
├── public/             # Frontend website
├── admin/              # Admin panel
├── vercel.json         # Vercel config
└── .env.example        # Environment template
```

## Admin Features

- 📸 Homepage Slider (drag to reorder)
- 🦐 Products Management
- 👥 Team Members
- 📰 News/Blog Posts
- 🖼️ Image Gallery
- 📧 Contact Messages
- ⚙️ Site Settings (social links, contact info)

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable | Description |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SESSION_SECRET` | Random string for sessions |
| `ADMIN_PASSWORD` | Admin panel password |

The `POSTGRES_*` variables are auto-set when you add Vercel Postgres.

## License

ISC
