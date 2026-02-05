# POS Feature Flag Setup Guide

## ⚠️ Important: NEXT_PUBLIC_ Variables

Environment variables with the `NEXT_PUBLIC_` prefix are **embedded at build time** in Next.js, not runtime.

This means:
- ❌ Adding them to `.env` after build won't work
- ❌ Changing them in the running container won't work
- ✅ They must be set BEFORE building the Docker image
- ✅ Requires a rebuild/redeploy when changed

---

## 🐳 Docker Deployment Steps

### Step 1: Set Environment Variable

Add to your Docker environment configuration:

**Dockerfile approach:**
```dockerfile
ENV NEXT_PUBLIC_ENABLE_POS=true
```

**docker-compose.yml approach:**
```yaml
services:
  app:
    environment:
      - NEXT_PUBLIC_ENABLE_POS=true
```

**Command line approach:**
```bash
docker build --build-arg NEXT_PUBLIC_ENABLE_POS=true -t your-app .
```

### Step 2: Rebuild Docker Image

```bash
# Navigate to your project directory
cd /path/to/swya-ecom-stack

# Rebuild the Docker image
docker build -t swya-ecom-stack .

# Or with docker-compose
docker-compose build
```

### Step 3: Restart Container

```bash
# Stop and remove old container
docker stop your-container-name
docker rm your-container-name

# Start new container with environment variable
docker run -e NEXT_PUBLIC_ENABLE_POS=true -p 3000:3000 swya-ecom-stack

# Or with docker-compose
docker-compose up -d
```

---

## ☁️ Platform-Specific Instructions

### Vercel
1. Go to Project Settings → Environment Variables
2. Add:
   - **Name**: `NEXT_PUBLIC_ENABLE_POS`
   - **Value**: `true`
3. Redeploy from Deployments tab

### Railway
1. Go to your project
2. Click Variables tab
3. Add:
   - **Variable**: `NEXT_PUBLIC_ENABLE_POS`
   - **Value**: `true`
4. Trigger a new deployment

### Render
1. Go to Environment
2. Add Environment Variable:
   - **Key**: `NEXT_PUBLIC_ENABLE_POS`
   - **Value**: `true`
3. Manual Deploy → Deploy latest commit

### DigitalOcean App Platform
1. Settings → App-Level Environment Variables
2. Add:
   - **Key**: `NEXT_PUBLIC_ENABLE_POS`
   - **Value**: `true`
3. Save and redeploy

---

## 🧪 Verify POS is Enabled

### After Rebuild/Redeploy:

1. **Clear Browser Cache**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

2. **Check in Browser Console**
   ```javascript
   // Open browser console (F12) and run:
   console.log(process.env.NEXT_PUBLIC_ENABLE_POS)
   ```
   Should output: `undefined` (because it's embedded at build time)

3. **Check Admin Sidebar**
   - Login as Admin or SuperAdmin
   - Look for "POS" menu item with 💵 icon
   - Should appear after "All Orders"

---

## 🚨 Troubleshooting

### Issue: Still not seeing POS after rebuild

**Check 1: Verify build environment**
```bash
# During build, check if variable is set
docker build --progress=plain --no-cache -t swya-ecom-stack .
# Look for: ENV NEXT_PUBLIC_ENABLE_POS=true
```

**Check 2: Verify your role**
- POS is only visible to **SuperAdmin** and **Admin** roles
- Not visible to "Sales person" or other roles

**Check 3: Hard refresh browser**
- Clear cache and cookies
- Use incognito/private window
- Try different browser

**Check 4: Check Next.js build output**
```bash
# Look for this in build logs:
Creating an optimized production build ...
```

**Check 5: Verify the sidebar code**
The POS menu should appear in the sidebar array around line 70-80 in `src/app/admin/layout.tsx`

---

## ✅ Expected Result

After successful rebuild and deployment:

```
Admin Sidebar:
├─ 📊 Dashboards
├─ 🛒 All Orders
├─ 💵 POS             ← Should appear here
├─ ➕ Create Offline Order (if enabled)
├─ 👥 All Customers
└─ ...
```

**When clicked:**
- POS modal opens
- Invoice number auto-generated
- Ready for barcode scanning

---

## 📝 Quick Reference

| Action | Command |
|--------|---------|
| Set env in Docker | `ENV NEXT_PUBLIC_ENABLE_POS=true` |
| Rebuild image | `docker build -t app .` |
| Build with arg | `docker build --build-arg NEXT_PUBLIC_ENABLE_POS=true` |
| Run with env | `docker run -e NEXT_PUBLIC_ENABLE_POS=true` |
| Verify in console | Check admin sidebar for POS icon |

---

## 🔒 Production Deployment Checklist

- [ ] Environment variable added to production config
- [ ] Docker image rebuilt with new variable
- [ ] Container restarted/redeployed
- [ ] Browser cache cleared
- [ ] Logged in as Admin or SuperAdmin
- [ ] POS menu item visible in sidebar
- [ ] POS modal opens when clicked
- [ ] Invoice number generates correctly

---

**Need help?** Check the build logs for any environment variable issues.
