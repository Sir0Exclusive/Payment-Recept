async function loadUserReceipts(email) {
    const users = getUsers();
    const receiptsList = document.getElementById('receiptsList');
    
    if (!users[email] || users[email].receipts.length === 0) {
        receiptsList.innerHTML = '<p>No receipts found. Scan a QR code to add your first receipt.</p>';
        return;
    }

    receiptsList.innerHTML = '<p>Loading receipts...</p>';

    try {
        const receipts = [];
        for (const receiptId of users[email].receipts) {
            // Try to load from GitHub or local storage
            const receiptData = await loadReceiptData(receiptId);
            if (receiptData) {
                receipts.push(receiptData);
            }
        }

        if (receipts.length === 0) {
            receiptsList.innerHTML = '<p>No receipts found.</p>';
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
        receiptsList.innerHTML = '<p>Error loading receipts.</p>';
        console.error(error);
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

