# Cloudinary Setup Guide

## Why You Need Cloudinary

Cloudinary is a cloud-based image hosting service that:
- Stores your images in the cloud (not on your server)
- Automatically optimizes images for web
- Provides CDN delivery for fast loading
- Works perfectly with Vercel's serverless architecture
- Free tier includes 25GB storage and 25GB bandwidth/month

## Setup Instructions

### Step 1: Create Cloudinary Account

1. Go to https://cloudinary.com/
2. Click "Sign Up" (it's FREE)
3. Fill in your details and create account
4. Verify your email

### Step 2: Get Your Credentials

1. After logging in, you'll see your Dashboard
2. Look for the "Account Details" section
3. You'll see three important values:
   - **Cloud Name** (e.g., "dxyz123abc")
   - **API Key** (e.g., "123456789012345")
   - **API Secret** (e.g., "abcdefghijklmnopqrstuvwxyz")

### Step 3: Add Credentials to Your Project

1. Open the `.env.local` file in your project
2. Find these lines at the bottom:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   CLOUDINARY_API_KEY=your_api_key_here
   CLOUDINARY_API_SECRET=your_api_secret_here
   ```
3. Replace the placeholder values with your actual credentials:
   ```
   CLOUDINARY_CLOUD_NAME=dxyz123abc
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
   ```
4. Save the file

### Step 4: Restart Your Server

After adding the credentials, restart your development server:
- Stop the server (Ctrl+C)
- Start it again: `npm start` or `node server.js`

### Step 5: Test Image Upload

1. Go to your admin panel
2. Try uploading an image (products, team, news, gallery, etc.)
3. You should see "Image uploaded successfully"
4. The image will be stored on Cloudinary

## For Vercel Deployment

You also need to add these credentials to Vercel:

1. Go to https://vercel.com/
2. Open your project
3. Go to Settings → Environment Variables
4. Add three new variables:
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your API key
   - `CLOUDINARY_API_SECRET` = your API secret
5. Redeploy your project

## How It Works

When Cloudinary is configured:
- ✅ Images upload to Cloudinary cloud storage
- ✅ You get a permanent URL for each image
- ✅ Images are automatically optimized
- ✅ Fast CDN delivery worldwide
- ✅ Works on Vercel serverless

When Cloudinary is NOT configured:
- ❌ Images try to save locally (doesn't work on Vercel)
- ❌ Upload fails with "Cannot upload images" error
- ❌ You can only use external image URLs

## Troubleshooting

**"Cannot upload images" error:**
- Check that credentials are added to `.env.local`
- Make sure there are no typos in the credentials
- Restart your server after adding credentials

**Images not showing after upload:**
- Check browser console for errors
- Verify Cloudinary credentials are correct
- Check Cloudinary dashboard to see if images are there

**Vercel deployment issues:**
- Make sure credentials are added to Vercel environment variables
- Redeploy after adding variables

## Free Tier Limits

Cloudinary free tier includes:
- 25 GB storage
- 25 GB bandwidth per month
- 25,000 transformations per month
- More than enough for most small to medium websites

## Support

If you need help:
- Cloudinary Documentation: https://cloudinary.com/documentation
- Cloudinary Support: https://support.cloudinary.com/
