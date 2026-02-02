// Receipt Verification with Ownership Check
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyIekZfn_WnbZrj7NV3wofBF5YhIAx5E1yev_tVzb1mGRvmifLqDqdrg0eUwT7zZyhRFg/exec";

async function showPaymentDashboard() {
    // Check if accessing specific receipt via QR code
    const urlParams = new URLSearchParams(window.location.search);
    const receiptId = urlParams.get('id');

    if (!isLoggedIn()) {
        // Save intended receipt for after login
        if (receiptId) {
            sessionStorage.setItem('pendingReceiptId', receiptId);
        }
        alert('Please login to view receipts');
        window.location.href = 'index.html';
        return;
    }

    const currentUser = getCurrentUser();
    const receiptDetails = document.getElementById('receiptDetails');

    // If specific receipt requested, verify ownership and show it
    if (receiptId) {
        await showSingleReceipt(receiptId, currentUser, receiptDetails);
        return;
    }

    // Otherwise show all user's payments
    await showAllUserPayments(currentUser, receiptDetails);
}

async function showSingleReceipt(receiptId, userEmail, containerEl) {
    containerEl.innerHTML = '<p>Loading receipt...</p>';

    try {
        const sheetData = await fetchGoogleSheetData();
        
        if (!sheetData || sheetData.length === 0) {
            containerEl.innerHTML = '<p style="color: #ff6b6b;">Receipt not found.</p>';
            return;
        }

        // Find the receipt
        const receipt = sheetData.find(row => String(row['Receipt No']) === receiptId);

        if (!receipt) {
            containerEl.innerHTML = '<p style="color: #ff6b6b;">Receipt not found.</p>';
            return;
        }

        // Verify ownership - receipt email must match logged in user
        const receiptEmail = String(receipt['Recipient Email'] || '').toLowerCase().trim();
        if (receiptEmail !== userEmail.toLowerCase()) {
            containerEl.innerHTML = `
                <div style="padding: 30px; background: #ffebee; border-radius: 8px; border-left: 5px solid #c62828; text-align: center;">
                    <h2 style="color: #c62828; margin-top: 0;">⛔ Access Denied</h2>
                    <p style="font-size: 16px; color: #555;">This receipt belongs to another user.</p>
                    <p style="color: #777;">You can only view receipts sent to your email address.</p>
                    <button onclick="window.location.href='verify.html'" style="margin-top: 20px; padding: 12px 30px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">← View My Payments</button>
                </div>
            `;
            return;
        }

        // Show the receipt
        containerEl.innerHTML = `
            <div style="max-width: 700px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #333;">📄 Receipt Details</h2>
                    <p style="color: #777;">Receipt verified and belongs to you</p>
                </div>
                
                <div class="receipt-card" style="margin: 20px 0; padding: 30px; border: 2px solid ${receipt.Payment_Status === 'PAID' ? '#4CAF50' : '#ff9800'}; border-radius: 12px; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #eee;">
                        <h3 style="margin: 0; font-size: 24px;">Receipt #${receipt['Receipt No']}</h3>
                        <span style="font-weight: bold; font-size: 16px; color: ${receipt.Payment_Status === 'PAID' ? '#00b050' : '#ff6b6b'}; padding: 8px 20px; border-radius: 25px; background: ${receipt.Payment_Status === 'PAID' ? '#e8f5e9' : '#ffebee'};">${receipt.Payment_Status || 'PENDING'}</span>
                    </div>
                    
                    <div class="receipt-detail" style="margin: 15px 0; display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                        <span class="label" style="color: #666; font-weight: 600;">Name:</span>
                        <span class="value" style="color: #333; font-weight: 500;">${receipt.Name}</span>
                    </div>
                    <div class="receipt-detail" style="margin: 15px 0; display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                        <span class="label" style="color: #666; font-weight: 600;">Total Amount:</span>
                        <span class="value" style="color: #333; font-weight: 600; font-size: 18px;">${receipt.Amount}</span>
                    </div>
                    <div class="receipt-detail" style="margin: 15px 0; display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                        <span class="label" style="color: #666; font-weight: 600;">Amount Paid:</span>
                        <span class="value" style="color: #00b050; font-weight: bold; font-size: 20px;">${receipt.Amount_Paid || '¥0'}</span>
                    </div>
                    <div class="receipt-detail" style="margin: 15px 0; display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                        <span class="label" style="color: #666; font-weight: 600;">Amount Due:</span>
                        <span class="value" style="color: ${receipt['Due Amount'] == 0 ? '#00b050' : '#ff6b6b'}; font-weight: bold; font-size: 18px;">${receipt['Due Amount']}</span>
                    </div>
                    <div class="receipt-detail" style="margin: 15px 0; display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                        <span class="label" style="color: #666; font-weight: 600;">Date:</span>
                        <span class="value" style="color: #333;">${receipt.Date}</span>
                    </div>
                    <div class="receipt-detail" style="margin: 15px 0; display: flex; justify-content: space-between; padding: 10px 0;">
                        <span class="label" style="color: #666; font-weight: 600;">Description:</span>
                        <span class="value" style="color: #333;">${receipt.Description}</span>
                    </div>
                </div>
                
                <div style="margin-top: 30px; text-align: center;">
                    <button onclick="window.location.href='verify.html'" style="padding: 12px 40px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">← View All My Payments</button>
                </div>
            </div>
        `;

    } catch (error) {
        containerEl.innerHTML = '<p style="color: #ff6b6b;">Error loading receipt. Please try again.</p>';
        console.error(error);
    }
}

async function showAllUserPayments(userEmail, containerEl) {
    containerEl.innerHTML = '<p>Loading payment history...</p>';

    try {
        const sheetData = await fetchGoogleSheetData();
        
        if (!sheetData || sheetData.length === 0) {
            containerEl.innerHTML = '<p>No payment records found.</p>';
            return;
        }

        // Filter payments for current user ONLY
        const userPayments = sheetData.filter(row => {
            const recipientEmail = String(row['Recipient Email'] || '').toLowerCase().trim();
            return recipientEmail === userEmail.toLowerCase();
        });

        if (userPayments.length === 0) {
            containerEl.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h3>No payments found</h3>
                    <p style="color: #666;">You don't have any payment records yet.</p>
                    <p style="color: #999; font-size: 14px;">Payments sent to <strong>${userEmail}</strong> will appear here.</p>
                </div>
            `;
            return;
        }

        // Display all payments
        containerEl.innerHTML = `
            <div style="max-width: 900px; margin: 0 auto;">
                <h2>💳 My Payment History</h2>
                <p style="color: #666; margin-bottom: 20px;">Showing ${userPayments.length} payment(s)</p>
                
                <div style="display: grid; gap: 20px;">
                    ${userPayments.map(row => `
                        <div class="receipt-card" style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <h3 style="margin: 0; color: #333;">Receipt #${row['Receipt No']}</h3>
                                <span style="font-weight: bold; padding: 5px 15px; border-radius: 20px; font-size: 14px; color: ${row.Payment_Status === 'PAID' ? '#00b050' : '#ff6b6b'}; background: ${row.Payment_Status === 'PAID' ? '#e8f5e9' : '#ffebee'};">${row.Payment_Status || 'PENDING'}</span>
                            </div>
                            
                            <div class="receipt-detail" style="margin: 10px 0; display: flex; justify-content: space-between;">
                                <span class="label" style="color: #666;">Name:</span>
                                <span class="value" style="color: #333; font-weight: 500;">${row.Name}</span>
                            </div>
                            <div class="receipt-detail" style="margin: 10px 0; display: flex; justify-content: space-between;">
                                <span class="label" style="color: #666;">Total Amount:</span>
                                <span class="value" style="color: #333; font-weight: 600;">${row.Amount}</span>
                            </div>
                            <div class="receipt-detail" style="margin: 10px 0; display: flex; justify-content: space-between;">
                                <span class="label" style="color: #666;">Amount Paid:</span>
                                <span class="value" style="color: #00b050; font-weight: bold;">${row.Amount_Paid || '¥0'}</span>
                            </div>
                            <div class="receipt-detail" style="margin: 10px 0; display: flex; justify-content: space-between;">
                                <span class="label" style="color: #666;">Amount Due:</span>
                                <span class="value" style="color: ${row['Due Amount'] == 0 ? '#00b050' : '#ff6b6b'}; font-weight: bold;">${row['Due Amount']}</span>
                            </div>
                            <div class="receipt-detail" style="margin: 10px 0; display: flex; justify-content: space-between;">
                                <span class="label" style="color: #666;">Date:</span>
                                <span class="value" style="color: #333;">${row.Date}</span>
                            </div>
                            <div class="receipt-detail" style="margin: 10px 0;">
                                <span class="label" style="color: #666; display: block; margin-bottom: 5px;">Description:</span>
                                <span class="value" style="color: #333;">${row.Description}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

    } catch (error) {
        containerEl.innerHTML = '<p style="color: #ff6b6b;">Error loading payments. Please try again.</p>';
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

// Load payment dashboard on page load
window.addEventListener('DOMContentLoaded', showPaymentDashboard);
