// Admin Dashboard - View all payments
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyIekZfn_WnbZrj7NV3wofBF5YhIAx5E1yev_tVzb1mGRvmifLqDqdrg0eUwT7zZyhRFg/exec";
const ADMIN_EMAIL = "sarwar@example.com"; // Change this to your admin email

// Check if user is admin
function isAdmin() {
    const currentUser = getCurrentUser();
    return currentUser && currentUser.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// Check authentication
if (!isLoggedIn()) {
    window.location.href = 'index.html';
}

if (!isAdmin()) {
    alert('Access denied. Admin only.');
    window.location.href = 'verify.html';
}

async function loadAllPayments() {
    const allPayments = document.getElementById('allPayments');
    allPayments.innerHTML = '<p>Loading all payment records...</p>';

    try {
        const sheetData = await fetchGoogleSheetData();
        
        if (!sheetData || sheetData.length === 0) {
            allPayments.innerHTML = '<p>No payment records found.</p>';
            return;
        }

        // Group by recipient
        const groupedByRecipient = {};
        sheetData.forEach(payment => {
            const email = payment['Recipient Email'] || payment.Name || 'Unknown';
            if (!groupedByRecipient[email]) {
                groupedByRecipient[email] = [];
            }
            groupedByRecipient[email].push(payment);
        });

        allPayments.innerHTML = Object.entries(groupedByRecipient).map(([recipient, payments]) => `
            <div style="margin-bottom: 30px; padding: 20px; border: 2px solid #4CAF50; border-radius: 10px; background: #f9f9f9;">
                <h3 style="margin-top: 0; color: #4CAF50;">📧 ${recipient}</h3>
                <p style="color: #666; font-size: 14px;">Total Payments: ${payments.length}</p>
                
                ${payments.map(payment => `
                    <div class="receipt-card" style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: white;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="margin: 0; color: #333;">Receipt #${payment['Receipt No']}</h4>
                            <span style="font-weight: bold; font-size: 16px; color: ${payment.Payment_Status === 'PAID' ? '#00b050' : '#ff6b6b'};">${payment.Payment_Status || 'N/A'}</span>
                        </div>
                        
                        <div class="receipt-detail">
                            <span class="label">Name:</span>
                            <span class="value">${payment.Name}</span>
                        </div>
                        <div class="receipt-detail">
                            <span class="label">Total Amount:</span>
                            <span class="value">${payment.Amount}</span>
                        </div>
                        <div class="receipt-detail">
                            <span class="label">Amount Due:</span>
                            <span class="value">${payment['Due Amount']}</span>
                        </div>
                        <div class="receipt-detail">
                            <span class="label">Amount Paid:</span>
                            <span class="value" style="color: #00b050; font-weight: bold;">${payment.Amount_Paid || 'N/A'}</span>
                        </div>
                        <div class="receipt-detail">
                            <span class="label">Date:</span>
                            <span class="value">${payment.Date}</span>
                        </div>
                        <div class="receipt-detail">
                            <span class="label">Description:</span>
                            <span class="value">${payment.Description}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');

    } catch (error) {
        allPayments.innerHTML = '<p>Error loading payment records.</p>';
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

// Load on page load
window.addEventListener('DOMContentLoaded', loadAllPayments);
