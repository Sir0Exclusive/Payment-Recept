# STEP-BY-STEP: Push to GitHub
# Run these commands one by one in PowerShell

# 1. Tell me your GitHub username
Write-Host "Enter your GitHub username:" -ForegroundColor Cyan
$username = Read-Host

# 2. Update configuration files with your username
Write-Host "`nUpdating configuration files..." -ForegroundColor Yellow

# Update generate_receipts.py
$file1 = Get-Content "generate_receipts.py" -Raw
$file1 = $file1 -replace 'YOUR_GITHUB_USERNAME', $username
Set-Content "generate_receipts.py" -Value $file1

# Update app.js
$file2 = Get-Content "web-portal/app.js" -Raw
$file2 = $file2 -replace 'YOUR_GITHUB_USERNAME', $username
Set-Content "web-portal/app.js" -Value $file2

# Update verify.js
$file3 = Get-Content "web-portal/verify.js" -Raw
$file3 = $file3 -replace 'YOUR_GITHUB_USERNAME', $username
Set-Content "web-portal/verify.js" -Value $file3

Write-Host "Configuration updated!" -ForegroundColor Green

# 3. Copy receipt data to web-portal
Write-Host "`nCopying receipt data..." -ForegroundColor Yellow
if (Test-Path "receipts/data") {
    Copy-Item -Path "receipts/data" -Destination "web-portal/data" -Recurse -Force
    Write-Host "Receipt data copied!" -ForegroundColor Green
}

# 4. Add all files to Git
Write-Host "`nAdding files to Git..." -ForegroundColor Yellow
git add .
Write-Host "Files added!" -ForegroundColor Green

# 5. Create commit
Write-Host "`nCreating commit..." -ForegroundColor Yellow
git commit -m "Initial commit: Payment receipt system with QR/barcode verification"
Write-Host "Commit created!" -ForegroundColor Green

# 6. Add GitHub remote
Write-Host "`nAdding GitHub remote..." -ForegroundColor Yellow
git remote add origin "https://github.com/$username/payment-receipts.git"
Write-Host "Remote added!" -ForegroundColor Green

# 7. Push to GitHub
Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
Write-Host "You will be prompted for credentials:" -ForegroundColor Yellow
Write-Host "  Username: $username" -ForegroundColor White
Write-Host "  Password: Use a Personal Access Token from https://github.com/settings/tokens" -ForegroundColor White
Write-Host ""

git branch -M main
git push -u origin main

Write-Host "`n✅ DONE! Your site will be live at:" -ForegroundColor Green
Write-Host "https://$username.github.io/payment-receipts/" -ForegroundColor Cyan
Write-Host "`nNow enable GitHub Pages in repository settings!" -ForegroundColor Yellow
