# Payment Receipt System with QR/Barcode Verification

A professional payment receipt generation system with tamper-proof verification, QR codes, barcodes, and a web portal for viewing receipts.

## Features

- ✅ Professional PDF receipt generation
- ✅ QR Code and Barcode on each receipt
- ✅ Tamper-proof receipts with SHA-256 hash verification
- ✅ Locked PDFs (cannot be edited)
- ✅ Web portal for receipt verification
- ✅ User authentication (email/password)
- ✅ Lost receipt recovery
- ✅ Free hosting on GitHub Pages

## Setup Instructions

### 1. Generate Receipts

Run the Python script to generate receipts:

```bash
python generate_receipts.py
```

This will:
- Read recipient details from `recipients.xlsx`
- Generate PDF receipts with QR codes and barcodes
- Save receipt data as JSON files in `receipts/data/`
- Create tamper-proof verification hashes

### 2. Deploy to GitHub Pages

1. Create a new GitHub repository named `payment-receipts`
2. Upload the `web-portal` folder contents to the repository
3. Upload the `receipts/data` folder to the repository
4. Enable GitHub Pages in repository settings (Settings > Pages > Deploy from main branch)

### 3. Update Configuration

In these files, replace `YOUR_GITHUB_USERNAME` with your actual GitHub username:
- `generate_receipts.py` (line 29)
- `web-portal/app.js` (line 52)
- `web-portal/verify.js` (line 112)

### 4. Use the System

1. **Generate receipts**: Run `python generate_receipts.py`
2. **Scan QR code**: Recipients can scan the QR code on their receipt
3. **Verify online**: The QR code redirects to your GitHub Pages site
4. **Save to account**: Users can create an account to save and access receipts
5. **Lost receipt recovery**: Users can login to view all their receipts

## How It Works

### Tamper-Proof Technology

Each receipt includes:
- **Unique Receipt ID**: Auto-generated or from Excel
- **SHA-256 Hash**: Cryptographic hash of all receipt data
- **QR Code**: Links to verification page with receipt ID
- **Barcode**: Machine-readable receipt ID

If someone tries to edit the PDF (even with screenshot editing):
- The verification hash will not match
- The web portal will show a "TAMPERED" warning
- Original data remains safe in the GitHub repository

### Web Portal Features

- **Login/Register**: Secure email/password authentication
- **Dashboard**: View all saved receipts
- **Verification**: Scan QR code to verify authenticity
- **Save Receipts**: Add receipts to your account for easy access
- **Lost Receipt Recovery**: Access receipts without the physical copy

## Files Structure

```
Payment recept/
├── generate_receipts.py      # Main script
├── recipients.xlsx            # Input data
├── signature.png             # Digital signature
├── receipts/                 # Generated receipts
│   ├── *.pdf                # PDF receipts
│   ├── *_qr.png             # QR codes
│   ├── *_barcode.png        # Barcodes
│   └── data/                # Receipt JSON data
│       └── *.json          
└── web-portal/              # Website
    ├── index.html           # Dashboard
    ├── verify.html          # Verification page
    ├── styles.css           # Styling
    ├── auth.js              # Authentication
    ├── app.js               # Dashboard logic
    └── verify.js            # Verification logic
```

## Excel Format

Your `recipients.xlsx` should have these columns:
- Name
- Amount (¥)
- Due Amount (¥)
- Date
- Description
- Receipt No

## Excel VBA Macro (Optional)

To export receipts directly from Excel, import `ExportReceipt.bas` as a VBA module and assign it to a button.

## Security Notes

- Receipts are locked PDFs (editing disabled)
- Each receipt has a unique cryptographic hash
- Tampering is detected by hash mismatch
- Authentication uses client-side storage (suitable for personal use)
- For production: Use a proper backend with database and encryption

## Cost

**$0/month** - Completely free using GitHub Pages!

## Support

For issues or questions, please check the generated receipts in the `receipts` folder and verify the hash matches on the web portal.

---

Created by: RABIUL MD SARWAR IBNA
