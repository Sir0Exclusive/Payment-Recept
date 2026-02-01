// Get receipt ID from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const receiptId = urlParams.get('id');

// Google Apps Script Web App URL (replace after deployment)
const SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwd-VHVeKsNKD4lWeJuP0cXPwALnjL2b6GN0QMQrygAgG95VYRDcs-Ca_swum9OiRWfgQ/exec";

async function verifyReceipt() {
    const receiptDetails = document.getElementById('receiptDetails');
    
    if (!receiptId) {
        receiptDetails.innerHTML = '<p class="error-msg">No receipt ID provided.</p>';
        return;
    }

    receiptDetails.innerHTML = '<p>Verifying receipt...</p>';

    try {
        const receiptData = await loadReceiptData(receiptId);

        if (!receiptData) {
            receiptDetails.innerHTML = '<p class="tamper-warning">⚠️ Receipt not found or invalid!</p>';
            return;
        }

        // Verify hash (tamper detection)
        const computedHash = await computeReceiptHash(receiptData.data);
        const isValid = computedHash === receiptData.hash;

        if (!isValid) {
            receiptDetails.innerHTML = `
                <p class="tamper-warning">⚠️ WARNING: This receipt has been tampered with!</p>
                <p>The receipt data does not match the original verification hash.</p>
            `;
            return;
        }

        // Display valid receipt - PAYMENT DETAILS ONLY
        receiptDetails.innerHTML = `
            <div class="verified-badge">✓ Payment Verified</div>
            <div class="receipt-detail">
                <span class="label">Recipient:</span>
                <span class="value">${receiptData.data.Name}</span>
            </div>
            <div class="receipt-detail">
                <span class="label">Total Amount:</span>
                <span class="value">${receiptData.data.Amount}</span>
            </div>
            <div class="receipt-detail">
                <span class="label">Amount Due:</span>
                <span class="value">${receiptData.data['Due Amount']}</span>
            </div>
            <div class="receipt-detail">
                <span class="label">Amount Paid:</span>
                <span class="value" style="font-weight: bold; color: #00b050;">${receiptData.data.Amount_Paid || 'N/A'}</span>
            </div>
            <div class="receipt-detail">
                <span class="label">Payment Status:</span>
                <span class="value" style="font-weight: bold; font-size: 16px; color: ${receiptData.data.Payment_Status === 'PAID' ? '#00b050' : '#ff6b6b'}">${receiptData.data.Payment_Status || 'N/A'}</span>
            </div>
            <div class="receipt-detail">
                <span class="label">Date:</span>
                <span class="value">${receiptData.data.Date}</span>
            </div>
            <div class="receipt-detail">
                <span class="label">Description:</span>
                <span class="value">${receiptData.data.Description}</span>
            </div>`;
        `;

    } catch (error) {
        receiptDetails.innerHTML = '<p class="error-msg">Error verifying receipt.</p>';
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

// Verify on page load
window.addEventListener('DOMContentLoaded', verifyReceipt);

