# Cloud Deployment Guide

This guide will walk you through deploying your Socket.IO chat application to the cloud using Railway (server) and Vercel (client).

## Prerequisites

- GitHub account
- Railway account (free tier available) - [railway.app](https://railway.app)
- Vercel account (free tier available) - [vercel.com](https://vercel.com)
- Git repository (your code should be on GitHub)

## New Features in This Version

This deployment includes:
- ✅ **Age-based registration** - Users must provide age (1-150) when connecting
- ✅ **Age-restricted groups** - Groups can set minimum age requirements
- ✅ **Message reactions** - Double-click messages to add ❤️ reactions
- ✅ **Text formatting** - Support for *bold*, _italic_, +underline+, and ~~strikethrough~~

---

## Part 1: Deploy Server to Railway

### Step 1: Prepare Your Code

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for cloud deployment"
   git push origin main
   ```

### Step 2: Deploy to Railway

1. **Sign up/Login to Railway**:
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub (recommended)

2. **Create a New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `server` folder as the root directory

3. **Configure the Deployment**:
   - Railway will automatically detect Node.js
   - It will run `npm install` and `npm start` automatically
   - The `railway.json` file we created will handle the configuration

4. **Set Environment Variables**:
   - Go to your project → Variables tab
   - Add these variables:
     ```
     PORT=3001
     HOST=0.0.0.0
     ```
   - **Don't set ALLOWED_ORIGINS yet** - we'll do this after deploying the client

5. **Get Your Server URL**:
   - Go to Settings → Networking
   - Railway will generate a public URL (e.g., `https://your-app.up.railway.app`)
   - **Copy this URL** - you'll need it for the client deployment

6. **Test Your Server**:
   - Open the URL in your browser
   - You should see a connection (or a blank page - that's normal for Socket.IO)
   - Check the Railway logs to ensure the server started successfully

---

## Part 2: Deploy Client to Vercel

### Step 1: Prepare Environment Variables

1. **Create a `.env` file** in the `client` folder:
   ```bash
   cd client
   ```
   Create `.env` file with:
   ```
   VITE_SERVER_URL=https://your-server-url.railway.app
   ```
   Replace `https://your-server-url.railway.app` with your actual Railway server URL.

### Step 2: Deploy to Vercel

1. **Sign up/Login to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub (recommended)

2. **Import Your Project**:
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `client`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Set Environment Variables**:
   - In the project settings, go to "Environment Variables"
   - Add:
     ```
     VITE_SERVER_URL = https://your-server-url.railway.app
     ```
   - Make sure to select "Production", "Preview", and "Development"

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete
   - Vercel will give you a URL (e.g., `https://your-app.vercel.app`)

---

## Part 3: Connect Server and Client

### Step 1: Update Server CORS Settings

1. **Go back to Railway**:
   - Open your Railway project
   - Go to Variables tab
   - Add/Update:
     ```
     ALLOWED_ORIGINS = https://your-client-url.vercel.app
     ```
   - Replace with your actual Vercel URL
   - Railway will automatically redeploy

### Step 2: Test the Connection

1. **Open your Vercel client URL** in a browser
2. **Try to connect**:
   - Enter a name
   - Enter your age (required: 1-150)
   - The server URL should be pre-filled (from environment variable)
   - Click "Connect to Server"
3. **If it works**: You're done! 🎉
4. **If it doesn't work**: Check the browser console and Railway logs for errors

**Note**: The app now requires age input for registration and supports age-restricted groups. Make sure to test these features after deployment.

---

## Troubleshooting

### Server Issues

**Problem**: Server won't start
- **Solution**: Check Railway logs for errors
- Ensure `package.json` has correct `start` script
- Verify Node.js version compatibility

**Problem**: CORS errors
- **Solution**: Make sure `ALLOWED_ORIGINS` includes your Vercel URL
- Check that the URL matches exactly (including `https://`)

**Problem**: WebSocket connection fails
- **Solution**: Railway supports WebSockets, but ensure your URL uses `https://`
- Check that Socket.IO is configured correctly

### Client Issues

**Problem**: Can't connect to server
- **Solution**: 
  - Verify `VITE_SERVER_URL` is set correctly in Vercel
  - Check that the server URL uses `https://` (not `http://`)
  - Ensure the server is running (check Railway dashboard)

**Problem**: Environment variable not working
- **Solution**: 
  - Vite requires `VITE_` prefix for environment variables
  - Rebuild the client after changing environment variables
  - Clear browser cache

**Problem**: Build fails
- **Solution**: 
  - Check Vercel build logs
  - Ensure all dependencies are in `package.json`
  - Verify TypeScript compilation passes locally
  - Make sure `formatText.tsx` utility exists in `client/src/utils/`

**Problem**: Age validation errors
- **Solution**: 
  - Ensure age is between 1-150
  - Check that the server is receiving age in the registration payload
  - Verify client is sending `{ name, age }` object format

---

## Alternative Platforms

### Server Alternatives

- **Render**: [render.com](https://render.com) - Similar to Railway
- **Fly.io**: [fly.io](https://fly.io) - Good for Socket.IO apps
- **Heroku**: [heroku.com](https://heroku.com) - Requires credit card

### Client Alternatives

- **Netlify**: [netlify.com](https://netlify.com) - Similar to Vercel
- **GitHub Pages**: Free but requires custom build setup

---

## Updating Your Deployment

### After Making Changes

1. **Server Changes**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
   Railway will automatically redeploy

2. **Client Changes**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
   Vercel will automatically redeploy

### Environment Variable Changes

- **Railway**: Update in Variables tab → Auto-redeploys
- **Vercel**: Update in Environment Variables → Requires manual redeploy

---

## Cost Estimate

- **Railway**: Free tier includes $5/month credit (usually enough for small projects)
- **Vercel**: Free tier is generous for personal projects
- **Total**: $0/month for small-scale deployments

---

## Security Notes

1. **CORS**: Always set `ALLOWED_ORIGINS` in production (don't use `*`)
2. **HTTPS**: Both platforms provide HTTPS automatically
3. **Environment Variables**: Never commit `.env` files to Git
4. **Secrets**: Use platform-specific secret management for sensitive data

---

## Quick Reference

### Server URLs
- **Railway Dashboard**: [railway.app/dashboard](https://railway.app/dashboard)
- **Your Server**: Check Railway project → Settings → Networking

### Client URLs
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Your Client**: Check Vercel project → Deployments

### Environment Variables Needed

**Railway (Server)**:
- `PORT=3001`
- `HOST=0.0.0.0`
- `ALLOWED_ORIGINS=https://your-client.vercel.app`

**Vercel (Client)**:
- `VITE_SERVER_URL=https://your-server.railway.app`

---

## Need Help?

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Socket.IO Docs: [socket.io/docs](https://socket.io/docs)

Good luck with your deployment! 🚀

