# Vercel Deployment Guide

## Overview

This guide explains how to deploy ClaimGuardian AI frontend to Vercel for the Stormbreaker Deployment Award ($2,000).

**Status:** ⚠️ Ready for deployment

---

## Prerequisites

1. Vercel account (free tier works)
2. GitHub repository connected
3. Node.js 18+ installed locally (for testing)

---

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the repository

2. **Configure Project**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend` (IMPORTANT!)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

3. **Environment Variables** (if needed)
   - Add any required environment variables
   - For this project, none are strictly required for basic deployment

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Get your live URL!

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - Project name? claimguardian-ai (or your choice)
# - Directory? ./
# - Override settings? No
```

---

## Configuration Files

### `vercel.json` (Root)

Already configured in project root. Key settings:
- Build command: `cd frontend && npm install && npm run build`
- Output directory: `frontend/.next`
- Framework: Next.js

### `frontend/package.json`

Already configured with Next.js scripts:
- `dev`: Development server
- `build`: Production build
- `start`: Production server

---

## Build Verification

Before deploying, test locally:

```bash
cd frontend
npm install
npm run build
npm start
```

Visit `http://localhost:3000` to verify everything works.

---

## Post-Deployment

1. **Update README.md**
   - Add live URL to README
   - Update Vercel status to ✅ Complete

2. **Update Documentation**
   - Add URL to `docs/SPONSOR_INTEGRATIONS.md`
   - Add URL to `docs/DEMO_VIDEO_SCRIPT.md`

3. **Test Live Site**
   - Verify all pages load
   - Test billing analysis features
   - Check API endpoints

---

## Troubleshooting

### Build Fails

**Error:** `Module not found`
- **Solution:** Ensure `frontend/package.json` has all dependencies

**Error:** `Build timeout`
- **Solution:** Increase build timeout in Vercel settings

### Deployment Succeeds but Site Doesn't Load

**Error:** 404 on all routes
- **Solution:** Check `vercel.json` configuration, ensure output directory is correct

**Error:** API routes not working
- **Solution:** Verify API routes are in `frontend/src/app/api/`

---

## Environment Variables (Optional)

If you need environment variables for production:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add variables:
   - `NEXT_PUBLIC_APP_URL` - Your Vercel URL
   - Any other required variables

---

## Continuous Deployment

Vercel automatically deploys on every push to main branch:
- Push to `main` → Automatic deployment
- Create PR → Preview deployment

---

## Prize Eligibility

✅ **Meets requirements for Stormbreaker Deployment Award ($2,000):**
- ✅ Project deployed on Vercel
- ✅ Deployment is live
- ✅ Standard Vercel deployment

---

## Next Steps After Deployment

1. ✅ Add live URL to README.md
2. ✅ Update `docs/SPONSOR_INTEGRATIONS.md` with URL
3. ✅ Update `docs/DEMO_VIDEO_SCRIPT.md` with URL
4. ✅ Test all features on live site
5. ✅ Take screenshot of live deployment

---

*Last Updated: December 11, 2025*

