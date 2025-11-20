# Vercel Deployment Guide

## Prerequisites

- Node.js 20.19+ or 22.12+ (Vercel will use the Node.js version specified in your project)
- A Vercel account
- Backend API URL

## Environment Variables

Before deploying, you need to set the following environment variable in Vercel:

### Required Environment Variable

- `VITE_BACKEND_URL` - Your backend API URL (e.g., `https://secureprint-19d4.onrender.com`)

### Setting Environment Variables in Vercel

1. Go to your project settings in Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add `VITE_BACKEND_URL` with your backend URL
4. Make sure to add it for **Production**, **Preview**, and **Development** environments

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy to production:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. Push your code to a GitHub repository
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **Add New Project**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (or leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add environment variable `VITE_BACKEND_URL`
7. Click **Deploy**

## Build Configuration

The project is configured with:
- **Build Command**: `npm run build` (runs `tsc -b && vite build`)
- **Output Directory**: `dist`
- **Framework**: Vite

## Routing Configuration

The `vercel.json` file includes:
- SPA routing rewrite rules (all routes → `/index.html`)
- Cache headers for static assets (`/pdfjs/*` and `/assets/*`)

## Post-Deployment Checklist

- [ ] Verify `VITE_BACKEND_URL` is set correctly in Vercel
- [ ] Test the upload functionality
- [ ] Test PDF viewing
- [ ] Test print functionality
- [ ] Verify CORS is configured on backend for your Vercel domain
- [ ] Check that all routes work (upload, share, view, viewer)

## Troubleshooting

### Build Fails

- Check Node.js version (Vercel uses Node 20.x by default, but you may need 22.12+)
- Add `.nvmrc` file with `22.12.0` or update Vercel build settings

### Environment Variables Not Working

- Ensure variable name is exactly `VITE_BACKEND_URL` (case-sensitive)
- Redeploy after adding environment variables
- Check that variables are set for the correct environment (Production/Preview)

### CORS Errors

- Ensure your backend allows requests from your Vercel domain
- Check backend CORS configuration includes `https://your-app.vercel.app`

### PDF Viewer Not Loading

- Verify `VITE_BACKEND_URL` is set correctly
- Check browser console for errors
- Ensure backend `/api/files/secureStream` endpoint is accessible

