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
            // Filter data for current user if available
            const userData = sheetData.map(row => ({
                id: row['Receipt No'] || 'N/A',
                data: row
            }));

            receiptsList.innerHTML = userData.map(receipt => `
                <div class="receipt-card">
                    <h3>${receipt.data.Name}</h3>
                    <p><strong>Total Amount:</strong> ${receipt.data.Amount}</p>
                    <p><strong>Amount Due:</strong> ${receipt.data['Due Amount']}</p>
                    <p><strong>Amount Paid:</strong> <span style="color: #00b050; font-weight: bold;">${receipt.data.Amount_Paid || 'N/A'}</span></p>
                    <p><strong>Payment Status:</strong> <span style="color: ${receipt.data.Payment_Status === 'PAID' ? '#00b050' : '#ff6b6b'}; font-weight: bold; font-size: 16px;">${receipt.data.Payment_Status || 'N/A'}</span></p>
                    <p style="font-size: 12px; color: #999;">Date: ${receipt.data.Date}</p>
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
            return data.rows || [];
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

