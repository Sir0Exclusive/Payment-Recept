// Recipient Dashboard Script
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyIekZfn_WnbZrj7NV3wofBF5YhIAx5E1yev_tVzb1mGRvmifLqDqdrg0eUwT7zZyhRFg/exec';

let allPayments = [];
let currentFilter = 'all';

// Check authentication
function checkAuth() {
    const email = sessionStorage.getItem('recipientEmail');
    const loginTime = sessionStorage.getItem('recipientLoginTime');
    const now = Date.now();

    if (!email || !loginTime || (now - loginTime) > 24 * 60 * 60 * 1000) {
        window.location.href = 'recipient-login.html';
        return false;
    }
    return true;
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('recipientEmail');
        sessionStorage.removeItem('recipientName');
        sessionStorage.removeItem('recipientLoginTime');
        window.location.href = 'recipient-login.html';
    }
}

// Update recipient name in header
function updateHeader() {
    const name = sessionStorage.getItem('recipientName') || 'User';
    document.getElementById('recipientName').textContent = name;
}

// Load payment records
async function loadPayments() {
    if (!checkAuth()) return;

    const email = sessionStorage.getItem('recipientEmail');
    const loadingMessage = document.getElementById('loadingMessage');
    const paymentsTableContainer = document.getElementById('paymentsTableContainer');
    const noDataMessage = document.getElementById('noDataMessage');

    try {
        const response = await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get_recipient_payments',
                email: email
            })
        });

        const data = await response.json();
        console.log('Payment data:', data);

        if (data.status === 'success') {
            allPayments = data.rows;
            displayPayments(allPayments);
            updateStatistics(allPayments);

            loadingMessage.style.display = 'none';
            if (allPayments.length > 0) {
                paymentsTableContainer.style.display = 'block';
                noDataMessage.style.display = 'none';
            } else {
                paymentsTableContainer.style.display = 'none';
                noDataMessage.style.display = 'block';
            }
        } else {
            throw new Error(data.error || 'Failed to load payments');
        }
    } catch (error) {
        console.error('Load error:', error);
        loadingMessage.innerHTML = '❌ Error loading data. Please refresh.';
    }
}

// Display payments in table
function displayPayments(payments) {
    const tbody = document.getElementById('paymentsTableBody');
    tbody.innerHTML = '';

    payments.forEach(payment => {
        const [receiptNo, name, amount, dueAmount, date, description, email, status, amountPaid] = payment;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${receiptNo || 'N/A'}</strong></td>
            <td>${formatDate(date)}</td>
            <td><strong>¥${parseFloat(amount || 0).toFixed(2)}</strong></td>
            <td>${amountPaid || '¥0.00'}</td>
            <td>¥${parseFloat(dueAmount || 0).toFixed(2)}</td>
            <td>
                <span class="status-badge status-${status === 'PAID' ? 'paid' : 'due'}">
                    ${status || 'DUE'}
                </span>
            </td>
            <td>${description || '-'}</td>
            <td>
                <button class="generate-receipt-btn" onclick="generateReceipt('${receiptNo}')">
                    📄 Receipt
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

// Update statistics
function updateStatistics(payments) {
    let totalAmount = 0;
    let paidAmount = 0;
    let dueAmount = 0;

    payments.forEach(payment => {
        const amount = parseFloat(payment[2] || 0);
        const due = parseFloat(payment[3] || 0);
        const paid = amount - due;

        totalAmount += amount;
        paidAmount += paid;
        dueAmount += due;
    });

    document.getElementById('totalAmount').textContent = `¥${totalAmount.toFixed(2)}`;
    document.getElementById('paidAmount').textContent = `¥${paidAmount.toFixed(2)}`;
    document.getElementById('dueAmount').textContent = `¥${dueAmount.toFixed(2)}`;
    document.getElementById('recordCount').textContent = payments.length;
}

// Filter payments
function filterPayments(filter) {
    currentFilter = filter;

    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });

    // Filter and display
    if (filter === 'all') {
        displayPayments(allPayments);
    } else {
        const filtered = allPayments.filter(payment => payment[7] === filter);
        displayPayments(filtered);
    }
}

// Generate receipt (PDF/Print)
function generateReceipt(receiptNo) {
    const payment = allPayments.find(p => p[0] === receiptNo);
    if (!payment) {
        alert('Payment record not found');
        return;
    }

    const [receiptId, name, amount, dueAmount, date, description, email, status, amountPaid] = payment;
    const recipientName = sessionStorage.getItem('recipientName');

    // Create receipt window
    const receiptWindow = window.open('', '_blank', 'width=800,height=600');
    receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt ${receiptNo}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .receipt-header {
                    text-align: center;
                    border-bottom: 3px solid #333;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .receipt-header h1 {
                    color: #333;
                    margin: 0;
                    font-size: 32px;
                }
                .receipt-header p {
                    color: #666;
                    margin: 5px 0;
                }
                .receipt-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .info-section {
                    background: #f9f9f9;
                    padding: 15px;
                    border-radius: 8px;
                }
                .info-section h3 {
                    margin: 0 0 10px 0;
                    color: #333;
                    font-size: 14px;
                    text-transform: uppercase;
                }
                .info-section p {
                    margin: 5px 0;
                    color: #666;
                }
                .payment-details {
                    background: #fff;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 30px;
                }
                .payment-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }
                .payment-row:last-child {
                    border-bottom: none;
                }
                .payment-row.total {
                    font-weight: bold;
                    font-size: 18px;
                    border-top: 2px solid #333;
                    margin-top: 10px;
                    padding-top: 15px;
                }
                .status-badge {
                    display: inline-block;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-weight: bold;
                }
                .status-paid {
                    background: #d4edda;
                    color: #155724;
                }
                .status-due {
                    background: #f8d7da;
                    color: #721c24;
                }
                .receipt-footer {
                    text-align: center;
                    color: #999;
                    font-size: 12px;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                }
                @media print {
                    body { padding: 20px; }
                    .no-print { display: none; }
                }
                .print-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 20px auto;
                    display: block;
                }
            </style>
        </head>
        <body>
            <div class="receipt-header">
                <h1>PAYMENT RECEIPT</h1>
                <p>Receipt No: <strong>#${receiptNo}</strong></p>
                <p>Date: ${formatDate(date)}</p>
            </div>

            <div class="receipt-info">
                <div class="info-section">
                    <h3>Recipient Information</h3>
                    <p><strong>Name:</strong> ${recipientName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                </div>
                <div class="info-section">
                    <h3>Payment Status</h3>
                    <p><span class="status-badge status-${status === 'PAID' ? 'paid' : 'due'}">${status}</span></p>
                    <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div class="payment-details">
                <h3 style="margin-top: 0; color: #333;">Payment Details</h3>
                ${description ? `<p style="color: #666; margin-bottom: 15px;">${description}</p>` : ''}
                
                <div class="payment-row">
                    <span>Total Amount:</span>
                    <span><strong>¥${parseFloat(amount).toFixed(2)}</strong></span>
                </div>
                <div class="payment-row">
                    <span>Amount Paid:</span>
                    <span style="color: #2ecc71;"><strong>${amountPaid}</strong></span>
                </div>
                <div class="payment-row">
                    <span>Due Amount:</span>
                    <span style="color: ${parseFloat(dueAmount) > 0 ? '#e74c3c' : '#2ecc71'};"><strong>¥${parseFloat(dueAmount).toFixed(2)}</strong></span>
                </div>
                <div class="payment-row total">
                    <span>Status:</span>
                    <span style="color: ${status === 'PAID' ? '#2ecc71' : '#e74c3c'};">${status}</span>
                </div>
            </div>

            <button class="print-btn no-print" onclick="window.print()">🖨️ Print Receipt</button>

            <div class="receipt-footer">
                <p>This is a computer-generated receipt.</p>
                <p>Payment Receipt System © ${new Date().getFullYear()}</p>
            </div>
        </body>
        </html>
    `);
    receiptWindow.document.close();
}

// Setup filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        filterPayments(btn.dataset.filter);
    });
});

// Initialize
if (checkAuth()) {
    updateHeader();
    loadPayments();
}
