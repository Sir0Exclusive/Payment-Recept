// Get receipt ID from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const receiptId = urlParams.get('id');

// Google Apps Script Web App URL (replace after deployment)
const SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwd-VHVeKsNKD4lWeJuP0cXPwALnjL2b6GN0QMQrygAgG95VYRDcs-Ca_swum9OiRWfgQ/exec";

async function showPaymentDashboard() {
    const receiptDetails = document.getElementById('receiptDetails');
    
    if (!isLoggedIn()) {
        receiptDetails.innerHTML = `
            <div class="info-box">
                <p>Login to see your payment history</p>
                <button onclick="window.location.href='index.html'" style="margin-top: 10px;">Go to Login</button>
            </div>
        `;
        return;
    }

    receiptDetails.innerHTML = '<p>Loading payment history...</p>';

    try {
        const currentUser = getCurrentUser();
        const userReceipts = getUserReceipts(currentUser);

        if (!userReceipts || userReceipts.length === 0) {
            receiptDetails.innerHTML = '<p>No payment history found.</p>';
            return;
        }

        // Load and display all receipts
        const receiptsList = [];
        for (const receiptId of userReceipts) {
            const receiptData = await loadReceiptData(receiptId);
            if (receiptData) {
                receiptsList.push(receiptData);
            }
        }

        if (receiptsList.length === 0) {
            receiptDetails.innerHTML = '<p>No payment history found.</p>';
            return;
        }

        // Display payment history
        receiptDetails.innerHTML = `
            <h2>Payment History</h2>
            <div style="margin-top: 20px;">
                ${receiptsList.map(receipt => `
                    <div class="receipt-card" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                        <h3 style="margin-top: 0; color: #333;">${receipt.data.Name}</h3>
                        <div class="receipt-detail">
                            <span class="label">Total Amount:</span>
                            <span class="value">${receipt.data.Amount}</span>
                        </div>
                        <div class="receipt-detail">
                            <span class="label">Amount Due:</span>
                            <span class="value">${receipt.data['Due Amount']}</span>
                        </div>
                        <div class="receipt-detail">
                            <span class="label">Amount Paid:</span>
                            <span class="value" style="color: #00b050; font-weight: bold;">${receipt.data.Amount_Paid || 'N/A'}</span>
                        </div>
                        <div class="receipt-detail">
                            <span class="label">Payment Status:</span>
                            <span class="value" style="font-weight: bold; font-size: 16px; color: ${receipt.data.Payment_Status === 'PAID' ? '#00b050' : '#ff6b6b'};">${receipt.data.Payment_Status || 'N/A'}</span>
                        </div>
                        <div class="receipt-detail">
                            <span class="label">Date:</span>
                            <span class="value">${receipt.data.Date}</span>
                        </div>
                        <div class="receipt-detail">
                            <span class="label">Description:</span>
                            <span class="value">${receipt.data.Description}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

    } catch (error) {
        receiptDetails.innerHTML = '<p class="error-msg">Error loading payment history.</p>';
        console.error(error);
    }
}

async function computeReceiptHash(receiptData) {
    // Compute SHA-256 hash of receipt data
    const dataString = JSON.stringify(receiptData, Object.keys(receiptData).sort());
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

function saveToAccount() {
    if (!isLoggedIn()) {
        alert('Please login or register to save this receipt to your account.');
        window.location.href = 'index.html';
        return;
    }

    const currentUser = getCurrentUser();
    const added = addReceiptToUser(currentUser, receiptId, null);

    if (added) {
        syncRecipientEmailToSheet(receiptId, currentUser);
        alert('Receipt saved to your account!');
        window.location.href = 'index.html';
    } else {
        alert('Receipt already in your account.');
    }
}

async function syncRecipientEmailToSheet(receiptId, email) {
    if (!SHEET_WEBHOOK_URL || SHEET_WEBHOOK_URL === "PASTE_YOUR_APPS_SCRIPT_URL") {
        console.warn('Sheet webhook URL not configured.');
        return;
    }

    try {
        await fetch(SHEET_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiptId, email })
        });
    } catch (error) {
        console.error('Failed to sync email to sheet:', error);
    }
}

// Load receipt data function (same as app.js)
async function loadReceiptData(receiptId) {
    const localData = localStorage.getItem(`receipt_${receiptId}`);
    if (localData) {
        return JSON.parse(localData);
    }

    try {
        const response = await fetch(`https://Sir0Exclusive.github.io/Payment-Recept/web-portal/data/${receiptId}.json`);
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem(`receipt_${receiptId}`, JSON.stringify(data));
            return data;
        }
    } catch (error) {
        console.error('Error loading receipt:', error);
    }

    return null;
}

// Load payment dashboard on page load
window.addEventListener('DOMContentLoaded', showPaymentDashboard);

