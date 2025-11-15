# Quick Deployment Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment ✅

- [ ] Code is pushed to GitHub
- [ ] Merge conflicts resolved (ChatRoom.tsx)
- [ ] Local testing works (server + client)
- [ ] Age input works correctly
- [ ] Message reactions work (double-click messages)

---

## Step 1: Deploy Server to Railway

- [ ] Created Railway account at [railway.app](https://railway.app)
- [ ] Created new project from GitHub repo
- [ ] Set root directory to `server` folder
- [ ] Added environment variables:
  - [ ] `PORT=3001`
  - [ ] `HOST=0.0.0.0`
- [ ] Got server URL from Railway (Settings → Networking)
- [ ] Server URL: `https://________________.railway.app`
- [ ] Tested server URL (should connect or show blank page)

---

## Step 2: Deploy Client to Vercel

- [ ] Created Vercel account at [vercel.com](https://vercel.com)
- [ ] Imported project from GitHub
- [ ] Set root directory to `client` folder
- [ ] Framework preset: **Vite**
- [ ] Added environment variable:
  - [ ] `VITE_SERVER_URL` = `https://your-server.railway.app`
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Deployed successfully
- [ ] Got client URL from Vercel
- [ ] Client URL: `https://________________.vercel.app`

---

## Step 3: Connect Server and Client

- [ ] Updated Railway `ALLOWED_ORIGINS` variable:
  - [ ] `ALLOWED_ORIGINS` = `https://your-client.vercel.app`
- [ ] Railway auto-redeployed after variable change
- [ ] Tested connection:
  - [ ] Opened client URL in browser
  - [ ] Entered name
  - [ ] Entered age (1-150)
  - [ ] Server URL pre-filled correctly
  - [ ] Successfully connected ✅

---

## Step 4: Test Features

- [ ] Can see list of connected clients
- [ ] Can send private messages
- [ ] Can create groups
- [ ] Can set minimum age for groups
- [ ] Age restriction works (try joining group with age restriction)
- [ ] Can send group messages
- [ ] Message reactions work (double-click to add ❤️)
- [ ] Text formatting works (*bold*, _italic_, etc.)

---

## Troubleshooting Notes

If something doesn't work, check:

1. **Server not starting?**
   - Check Railway logs
   - Verify `package.json` has correct `start` script

2. **CORS errors?**
   - Verify `ALLOWED_ORIGINS` matches your Vercel URL exactly
   - Include `https://` prefix
   - No trailing slash

3. **Client can't connect?**
   - Verify `VITE_SERVER_URL` is set correctly in Vercel
   - Check browser console for errors
   - Ensure server URL uses `https://` (not `http://`)

4. **Build fails?**
   - Check build logs in Vercel
   - Ensure all dependencies are installed
   - Verify TypeScript compiles locally first

---

## Success! 🎉

Once everything works:
- [ ] Share your deployed URLs
- [ ] Test from different devices/browsers
- [ ] Document any custom configurations

---

**Need help?** Check `DEPLOYMENT.md` for detailed instructions.

