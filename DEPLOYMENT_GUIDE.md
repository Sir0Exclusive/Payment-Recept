# GitHub Pages Deployment Guide

Follow these steps to deploy your payment receipt portal to GitHub Pages (free hosting):

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click "New Repository"
3. Name it: `payment-receipts`
4. Make it Public
5. Click "Create repository"

## Step 2: Update Configuration

Before deploying, replace `YOUR_GITHUB_USERNAME` with your actual GitHub username in these files:

### File 1: generate_receipts.py (line ~29)
```python
verify_url = f"https://YOUR_GITHUB_USERNAME.github.io/payment-receipts/verify.html?id={receipt_id}"
```
Change to:
```python
verify_url = f"https://yourusername.github.io/payment-receipts/verify.html?id={receipt_id}"
```

### File 2: web-portal/app.js (line ~52)
```javascript
const response = await fetch(`https://YOUR_GITHUB_USERNAME.github.io/payment-receipts/data/${receiptId}.json`);
```
Change to:
```javascript
const response = await fetch(`https://yourusername.github.io/payment-receipts/data/${receiptId}.json`);
```

### File 3: web-portal/verify.js (line ~112)
```javascript
const response = await fetch(`https://YOUR_GITHUB_USERNAME.github.io/payment-receipts/data/${receiptId}.json`);
```
Change to:
```javascript
const response = await fetch(`https://yourusername.github.io/payment-receipts/data/${receiptId}.json`);
```

## Step 3: Upload Files to GitHub

### Option A: Using Git Command Line

```bash
cd "d:\Payment recept"

# Initialize git repository
git init

# Add all web portal files
git add web-portal/*
git add receipts/data/*
git add README.md

# Commit
git commit -m "Initial deployment of payment receipt portal"

# Link to your GitHub repository
git remote add origin https://github.com/yourusername/payment-receipts.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Option B: Using GitHub Desktop (Easier)

1. Download and install [GitHub Desktop](https://desktop.github.com/)
2. Click "Add" > "Clone Repository"
3. Select your `payment-receipts` repository
4. Copy these files/folders into the cloned repository folder:
   - Copy all files from `web-portal/` folder
   - Copy the `receipts/data/` folder (create `data` folder at root)
   - Copy `README.md`
5. In GitHub Desktop, write commit message: "Deploy receipt portal"
6. Click "Commit to main"
7. Click "Push origin"

### Option C: Using GitHub Web Interface (Simplest)

1. Go to your repository on GitHub
2. Click "Add file" > "Upload files"
3. Upload all files from `web-portal` folder
4. Create a folder named `data` and upload all JSON files from `receipts/data/`
5. Click "Commit changes"

## Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings"
3. Click "Pages" in the left sidebar
4. Under "Source", select "Deploy from a branch"
5. Select branch: `main`
6. Select folder: `/ (root)`
7. Click "Save"
8. Wait 1-2 minutes for deployment

## Step 5: Access Your Portal

Your portal will be available at:
```
https://yourusername.github.io/payment-receipts/
```

Test the verification page:
```
https://yourusername.github.io/payment-receipts/verify.html?id=1001
```

## Step 6: Regenerate Receipts

After updating the username in `generate_receipts.py`:

```bash
cd "d:\Payment recept"
python generate_receipts.py
```

This will regenerate all receipts with the correct QR codes pointing to your GitHub Pages site.

## Step 7: Update Receipt Data

Whenever you generate new receipts:

1. Upload new JSON files from `receipts/data/` to GitHub
2. The web portal will automatically display new receipts when scanned

## Folder Structure on GitHub

```
payment-receipts/ (GitHub repository)
├── index.html
├── verify.html
├── styles.css
├── auth.js
├── app.js
├── verify.js
├── README.md
└── data/
    ├── 1001.json
    ├── 1002.json
    └── ...
```

## Troubleshooting

### QR Code doesn't work
- Make sure you updated YOUR_GITHUB_USERNAME in all files
- Regenerate receipts after updating
- Wait 1-2 minutes after pushing to GitHub for changes to deploy

### Receipt data not loading
- Check that JSON files are in the `data/` folder on GitHub
- Verify the file names match the receipt IDs
- Check browser console for errors (F12)

### Login not working
- Clear browser cache and localStorage
- Make sure you're accessing via HTTPS (not HTTP)

## Security Note

This system uses client-side authentication (localStorage) which is suitable for personal use. For production with sensitive data, implement a proper backend with database and server-side authentication.

## Updating the Portal

To add new receipts:
1. Generate new receipts with `python generate_receipts.py`
2. Upload new JSON files from `receipts/data/` to GitHub
3. QR codes on new receipts will work immediately

---

Need help? Check that:
- GitHub username is updated in all 3 files
- GitHub Pages is enabled
- JSON files are uploaded to `data/` folder
- You waited 1-2 minutes for deployment
