// Google Apps Script Webhook URL for fetching sheet data
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyIekZfn_WnbZrj7NV3wofBF5YhIAx5E1yev_tVzb1mGRvmifLqDqdrg0eUwT7zZyhRFg/exec";

async function loadUserReceipts(email) {
    const users = getUsers();
    const receiptsList = document.getElementById('receiptsList');
    
    receiptsList.innerHTML = '<p>Loading payment history...</p>';

    try {
        // Try to fetch from Google Sheets first
        const sheetData = await fetchGoogleSheetData();
        
        if (sheetData && sheetData.length > 0) {
            // Filter data for current user ONLY (match by email)
            const userReceipts = sheetData.filter(row => {
                const recipientEmail = String(row['Recipient Email'] || '').toLowerCase().trim();
                return recipientEmail === email.toLowerCase();
            });

            if (userReceipts.length === 0) {
                receiptsList.innerHTML = '<p>No payments found for your account.</p>';
                updateUserStats([], email);
                return;
            }

            // Update statistics
            updateUserStats(userReceipts, email);

            const userData = userReceipts.map(row => ({
                id: row['Receipt No'] || 'N/A',
                data: row
            }));

            receiptsList.innerHTML = userData.map(receipt => `
                <div class="receipt-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h4 style="margin: 0;">Receipt #${receipt.data['Receipt No']}</h4>
                        <span style="font-weight: 700; font-size: 13px; color: ${receipt.data.Payment_Status === 'PAID' ? '#00b050' : '#ff6b6b'};">${receipt.data.Payment_Status || 'N/A'}</span>
                    </div>
                    <div class="receipt-detail">
                        <span class="label">Description:</span>
                        <span class="value">${receipt.data.Name}</span>
                    </div>
                    <div class="receipt-detail">
                        <span class="label">Total Amount:</span>
                        <span class="value">¥${parseFloat(receipt.data.Amount || '0').toFixed(2)}</span>
                    </div>
                    <div class="receipt-detail">
                        <span class="label">Amount Due:</span>
                        <span class="value" style="color: #ff6b6b;">¥${parseFloat(receipt.data['Due Amount'] || '0').toFixed(2)}</span>
                    </div>
                    <div class="receipt-detail">
                        <span class="label">Amount Paid:</span>
                        <span class="value" style="color: #00b050; font-weight: bold;">¥${parseFloat(receipt.data.Amount_Paid?.replace(/[^0-9.-]/g, '') || '0').toFixed(2)}</span>
                    </div>
                    <div class="receipt-detail" style="font-size: 12px; color: #999;">
                        <span class="label">Date:</span>
                        <span class="value">${receipt.data.Date || 'N/A'}</span>
                    </div>
                </div>
            `).join('');
            return;
        }
    } catch (error) {
        console.warn('Could not fetch from Google Sheets:', error);
    }

    // Fallback: Load from local receipts
    if (!users[email] || users[email].receipts.length === 0) {
        receiptsList.innerHTML = '<p>No payments found.</p>';
        updateUserStats([], email);
        return;
    }

    try {
        const receipts = [];
        for (const receiptId of users[email].receipts) {
            const receiptData = await loadReceiptData(receiptId);
            if (receiptData) {
                receipts.push(receiptData);
            }
        }

        if (receipts.length === 0) {
            receiptsList.innerHTML = '<p>No payments found.</p>';
            return;
        }

        receiptsList.innerHTML = receipts.map(receipt => `
            <div class="receipt-card">
                <h3>${receipt.data.Name}</h3>
                <p><strong>Total Amount:</strong> ${receipt.data.Amount}</p>
                <p><strong>Amount Due:</strong> ${receipt.data['Due Amount']}</p>
                <p><strong>Amount Paid:</strong> <span style="color: #00b050; font-weight: bold;">${receipt.data.Amount_Paid || 'N/A'}</span></p>
                <p><strong>Payment Status:</strong> <span style="color: ${receipt.data.Payment_Status === 'PAID' ? '#00b050' : '#ff6b6b'}; font-weight: bold; font-size: 16px;">${receipt.data.Payment_Status || 'N/A'}</span></p>
                <p style="font-size: 12px; color: #999;">Date: ${receipt.data.Date}</p>
            </div>
        `).join('');

    } catch (error) {
        receiptsList.innerHTML = '<p>Error loading payments.</p>';
        console.error(error);
    }
}

async function fetchGoogleSheetData() {
    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        if (response.ok) {
            const data = await response.json();
            const headers = data.headers || [];
            const rows = data.rows || [];
            
            // Convert rows to objects and compute missing fields
            return rows.map(row => {
                const obj = {};
                headers.forEach((header, idx) => {
                    obj[header] = row[idx];
                });
                
                // Compute Payment_Status and Amount_Paid if missing
                const amount = parseFloat(String(obj.Amount || '0').replace(/[^0-9.-]/g, '')) || 0;
                const dueAmount = parseFloat(String(obj['Due Amount'] || '0').replace(/[^0-9.-]/g, '')) || 0;
                
                if (!obj.Payment_Status) {
                    obj.Payment_Status = dueAmount === 0 ? 'PAID' : 'DUE';
                }
                if (!obj.Amount_Paid) {
                    obj.Amount_Paid = '¥' + (amount - dueAmount);
                }
                
                return obj;
            });
        }
    } catch (error) {
        console.warn('Google Sheets fetch failed:', error);
        return null;
    }
}

async function loadReceiptData(receiptId) {
    // Try to load from local storage first (for development)
    const localData = localStorage.getItem(`receipt_${receiptId}`);
    if (localData) {
        return JSON.parse(localData);
    }

    // Try to load from GitHub (update with your GitHub username)
    try {
        const response = await fetch(`https://Sir0Exclusive.github.io/Payment-Recept/web-portal/data/${receiptId}.json`);
        if (response.ok) {
            const data = await response.json();
            // Cache locally
            localStorage.setItem(`receipt_${receiptId}`, JSON.stringify(data));
            return data;
        }
    } catch (error) {
        console.error('Error loading receipt:', error);
    }

    return null;
}

// Hide admin button for non-admin users
window.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn()) {
        const currentUser = getCurrentUser();
        const adminBtn = document.getElementById('adminBtn');
        const ADMIN_EMAIL = "sarwaroffjp@gmail.com";
        
        if (adminBtn && (currentUser.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || !isAdminSession())) {
            adminBtn.style.display = 'none';
        }
    }
});

function updateUserStats(userReceipts, email) {
    const totalCount = userReceipts.length;
    let totalDueAmount = 0;
    let totalPaidAmount = 0;

    userReceipts.forEach(receipt => {
        const due = parseFloat(String(receipt['Due Amount'] || '0').replace(/[^0-9.-]/g, '')) || 0;
        const paid = parseFloat(String(receipt.Amount_Paid || '0').replace(/[^0-9.-]/g, '')) || 0;
        totalDueAmount += due;
        totalPaidAmount += paid;
    });

    const statTotal = document.getElementById('userStatTotal');
    const statDue = document.getElementById('userStatDue');
    const statPaid = document.getElementById('userStatPaid');

    if (statTotal) statTotal.textContent = totalCount;
    if (statDue) statDue.textContent = `¥${totalDueAmount.toFixed(2)}`;
    if (statPaid) statPaid.textContent = `¥${totalPaidAmount.toFixed(2)}`;
}
