# 💳 Payment Receipt System

A complete web-based payment receipt management system with secure authentication for admins and recipients.

## 🌐 Live Demo

**Website**: https://sir0exclusive.github.io/Payment-Recept/web-portal/

## 🚀 Features

### Admin Portal
- **Recipient Management**
  - Create new recipients with email/password
  - View all recipients
  - Delete recipients
  
- **Payment Management**
  - Add payments for recipients
  - View all payments
  - Delete payments
  - Auto-fill recipient details

### Recipient Portal
- **Secure Login** with password authentication
- **Personal Dashboard** showing:
  - Total payments count
  - Paid vs Due statistics
  - Total amount overview
- **Payment History** with detailed information
- **Receipt Generation** - Print-ready PDF receipts

## 🔐 Login Credentials

### Admin Access
- **URL**: https://sir0exclusive.github.io/Payment-Recept/web-portal/admin-login.html
- **Email**: sarwaroffjp@gmail.com
- **Password**: @arfi1234

### Recipients
Each recipient has their own email and password (created by admin)

## 🏗️ System Architecture

### Frontend
- **Landing Page**: `web-portal/index.html`
- **Admin Portal**: 
  - Login: `admin-login.html`
  - Dashboard: `admin.html` + `admin.js`
- **Recipient Portal**:
  - Login: `recipient-login.html`
  - Dashboard: `recipient-dashboard.html` + `recipient-dashboard.js`
- **Auth System**: `auth.js` (session management)
- **Styling**: `styles.css` (responsive design)

### Backend
- **Google Apps Script**: `google_apps_script.gs`
- **Google Sheets**: 2 sheets
  - `Receipts` - Payment records
  - `Recipients` - User accounts with hashed passwords
- **API Endpoint**: https://script.google.com/macros/s/AKfycbyIekZfn_WnbZrj7NV3wofBF5YhIAx5E1yev_tVzb1mGRvmifLqDqdrg0eUwT7zZyhRFg/exec

## 📊 Database Structure

### Recipients Sheet
| Email | Name | PasswordHash | Created Date | Last Login |
|-------|------|--------------|--------------|------------|
| user@example.com | John Doe | [SHA-256 hash] | 2026-01-01 | 2026-02-03 |

### Receipts Sheet
| Receipt No | Name | Amount | Due Amount | Date | Description | Recipient Email | Payment_Status | Amount_Paid | Last Updated |
|------------|------|--------|------------|------|-------------|-----------------|----------------|-------------|--------------|
| R123456 | John | 5000 | 0 | 2026-01-15 | Service | user@example.com | PAID | ¥5000 | 2026-01-15 |

## 🔒 Security Features

- **Password Hashing**: SHA-256 with salt
- **Session Management**: 
  - Admin: 30 minutes
  - Recipients: 24 hours
- **Input Sanitization**: All inputs validated and sanitized
- **Email Validation**: Regex-based email verification
- **Amount Validation**: Numeric validation for payments

## 📱 Responsive Design

- Mobile-friendly interface
- Tablet optimized
- Desktop full-featured

## 🎨 User Interface

- **Modern Design**: Gradient backgrounds, card layouts
- **Color Scheme**: Purple/blue gradient with clean white cards
- **Icons**: Emoji-based icons for clarity
- **Status Indicators**: Color-coded payment status (PAID = green, DUE = red)

## 🛠️ How to Use

### For Admins:
1. Login at admin portal
2. Go to "Manage Recipients" to create users
3. Go to "Manage Payments" to add payment records
4. Each payment is linked to a recipient email

### For Recipients:
1. Login with credentials provided by admin
2. View payment history
3. Click "Receipt" button to generate printable receipt
4. Track payment status (PAID/DUE)

## 🔄 Workflow

```
Admin Creates Recipient (email + password + name)
           ↓
Admin Adds Payment for Recipient
           ↓
Recipient Logs In
           ↓
Recipient Views Their Payments
           ↓
Recipient Generates Receipt
```

## 📦 Project Structure

```
Payment-Recept/
├── .git/
├── .gitignore
├── google_apps_script.gs (Backend API)
├── README.md
└── web-portal/
    ├── index.html (Landing page)
    ├── admin-login.html (Admin login)
    ├── admin.html (Admin dashboard)
    ├── admin.js (Admin logic)
    ├── recipient-login.html (Recipient login)
    ├── recipient-dashboard.html (Recipient dashboard)
    ├── recipient-dashboard.js (Recipient logic)
    ├── auth.js (Authentication system)
    └── styles.css (Global styles)
```

## 🚀 Deployment

Deployed on **GitHub Pages**
- Automatic deployment on push to `main` branch
- No build process required (static files)

## 🔧 Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Google Apps Script (JavaScript)
- **Database**: Google Sheets
- **Hosting**: GitHub Pages
- **Authentication**: Custom session-based auth

## 📝 API Endpoints

All requests go to the Google Apps Script endpoint:

### POST Requests:
- `action: 'recipient_login'` - Authenticate recipient
- `action: 'create_recipient'` - Create new recipient
- `action: 'get_recipient_payments'` - Get payments for specific recipient
- `action: 'get_recipients'` - Get all recipients
- `action: 'delete_recipient'` - Delete recipient
- `action: 'delete'` - Delete payment
- (no action) - Create/update payment

### GET Requests:
- Returns all payment records

## ⚡ Performance

- Fast loading (static files)
- Minimal dependencies (no frameworks)
- Efficient data fetching
- Client-side caching for sessions

## 🔮 Future Enhancements (Optional)

- Email notifications
- Export to PDF (server-side)
- Payment reminders
- Multi-currency support
- Payment history charts
- Bulk payment import
- Receipt customization

## 👨‍💻 Developer

**Admin**: sarwaroffjp@gmail.com

## 📄 License

Private Project - All Rights Reserved

## 🆘 Support

For issues or questions, contact admin via email.

---

**Built with ❤️ in 2026**
