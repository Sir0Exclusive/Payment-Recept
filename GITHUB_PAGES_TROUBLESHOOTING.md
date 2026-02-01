# GitHub Pages Deployment - Troubleshooting

## Current Status Check

**Repository:** https://github.com/Sir0Exclusive/Payment-Recept
**Expected Site URL:** https://Sir0Exclusive.github.io/Payment-Recept/

## ⚠️ If you're seeing 404:

### Step 1: Enable GitHub Pages
1. Go to: https://github.com/Sir0Exclusive/Payment-Recept/settings/pages
2. Under "Source", select:
   - Branch: **main**
   - Folder: **/ (root)**
3. Click **Save**
4. Wait 1-2 minutes for GitHub to build and deploy

### Step 2: Check Deployment Status
1. In the repository, click the **Actions** tab
2. Look for the "pages build and deployment" workflow
3. If it has a ✅ green checkmark, deployment succeeded
4. If it has a ❌ red X, check the logs for errors

### Step 3: Try These URLs

After GitHub Pages is enabled, these should work:

- **Main Site**: `https://Sir0Exclusive.github.io/Payment-Recept/`
- **Portal**: `https://Sir0Exclusive.github.io/Payment-Recept/web-portal/index.html`
- **Verify**: `https://Sir0Exclusive.github.io/Payment-Recept/web-portal/verify.html`
- **Home**: `https://Sir0Exclusive.github.io/Payment-Recept/index.html`

### Step 4: Browser Cache
- Try clearing browser cache (Ctrl+Shift+Delete)
- Or use Incognito/Private window
- Wait a few minutes - GitHub Pages can take 5-10 minutes on first deployment

## File Structure (what's deployed)

```
Payment-Recept/
├── index.html (main landing page)
├── web-portal/
│   ├── index.html (login portal)
│   ├── verify.html (verification page)
│   ├── auth.js
│   ├── app.js
│   ├── verify.js
│   ├── styles.css
│   └── data/
│       └── receipts/
└── [other files - not served by GitHub Pages]
```

## Verify Locally (while waiting)

Test the site locally before GitHub Pages:
```
cd "d:\Payment recept"
# Start a local server (Python 3.7+):
python -m http.server 8000
```

Then visit: http://localhost:8000/

## Still Not Working?

1. Confirm you're on the right repository: https://github.com/Sir0Exclusive/Payment-Recept
2. Check Actions tab for deployment status
3. Verify index.html exists at root: https://github.com/Sir0Exclusive/Payment-Recept/blob/main/index.html
4. Try with exact URL: https://Sir0Exclusive.github.io/Payment-Recept/index.html

---

**Common Issues:**
- 🔴 Site shows 404 → Pages not enabled in settings
- 🟡 Site loads but blank → Check browser console (F12) for JS errors
- 🟡 QR codes broken → May need to update URLs in web-portal files to use correct domain
