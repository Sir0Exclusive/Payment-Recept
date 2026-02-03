const API_URL = 'https://script.google.com/macros/s/AKfycbyIekZfn_WnbZrj7NV3wofBF5YhIAx5E1yev_tVzb1mGRvmifLqDqdrg0eUwT7zZyhRFg/exec';

let myPayments = [];

// Load payments on page load
window.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!requireAuth('recipient')) {
        return;
    }
    
    const session = getSession();
    document.getElementById('welcomeText').textContent = `Welcome, ${session.name}!`;
    
    loadMyPayments();
});

async function loadMyPayments() {
    try {
        const response = await fetch(`${API_URL}?action=get_recipient_payments&email=${encodeURIComponent(session.email)}`);
        
        const data = await response.json();
        
        if (data.status === 'success') {
            myPayments = data.rows;
            displayPayments();
            updateStats();
        }
    } catch (error) {
        console.error('Load payments error:', error);
        document.getElementById('paymentsList').innerHTML = 
            '<p style="color:#f56565;">Failed to load payments. Please refresh the page.</p>';
    }
}

function updateStats() {
    const total = myPayments.length;
    const paid = myPayments.filter(p => p[7] === 'PAID').length;
    const due = total - paid;
    const totalAmount = myPayments.reduce((sum, p) => sum + parseFloat(p[2] || 0), 0);
    
    document.getElementById('totalPayments').textContent = total;
    document.getElementById('paidCount').textContent = paid;
    document.getElementById('dueCount').textContent = due;
    document.getElementById('totalAmount').textContent = `¥${totalAmount.toFixed(2)}`;
}

function displayPayments() {
    const container = document.getElementById('paymentsList');
    
    if (myPayments.length === 0) {
        container.innerHTML = '<p style="color:#999;padding:20px;text-align:center;">No payments found.</p>';
        return;
    }
    
    let html = '';
    
    myPayments.forEach(payment => {
        const [receiptNo, name, amount, dueAmount, date, description, email, status, amountPaid] = payment;
        const statusClass = status === 'PAID' ? 'status-paid' : 'status-due';
        
        html += `
            <div class="payment-item">
                <div class="payment-info">
                    <h3>Receipt #${receiptNo}</h3>
                    <p><strong>Amount:</strong> ¥${parseFloat(amount).toFixed(2)}</p>
                    <p><strong>Paid:</strong> ${amountPaid || '¥0'}</p>
                    <p><strong>Due:</strong> ¥${parseFloat(dueAmount || 0).toFixed(2)}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
                    <span class="payment-status ${statusClass}">${status}</span>
                </div>
                <div>
                    <button onclick="generateReceipt('${receiptNo}')" class="btn btn-primary btn-sm">📄 Receipt</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function generateReceipt(receiptNo) {
    const payment = myPayments.find(p => p[0] === receiptNo);
    if (!payment) return;
    
    const [receiptId, name, amount, dueAmount, date, description, email, status, amountPaid] = payment;
    
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt ${receiptId}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 40px auto;
                    padding: 20px;
                    user-select: none;
                }
                .receipt-header {
                    text-align: center;
                    margin-bottom: 40px;
                    border-bottom: 3px solid #667eea;
                    padding-bottom: 20px;
                }
                .receipt-header h1 {
                    color: #667eea;
                    margin-bottom: 10px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .info-section {
                    background: #f7fafc;
                    padding: 15px;
                    border-radius: 8px;
                }
                .info-section h3 {
                    color: #667eea;
                    margin-bottom: 10px;
                }
                .payment-details {
                    background: #f7fafc;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .payment-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #e2e8f0;
                }
                .payment-row:last-child {
                    border-bottom: none;
                    font-weight: bold;
                    font-size: 1.2em;
                }
                .print-btn {
                    width: 100%;
                    padding: 12px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    margin-top: 20px;
                }
                .anti-copy {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    opacity: 0.08;
                    z-index: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 64px;
                    font-weight: 700;
                    color: #111827;
                    transform: rotate(-24deg);
                }
                .receipt-wrap {
                    position: relative;
                    z-index: 1;
                }
                .codes {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin: 20px 0;
                    align-items: center;
                }
                .code-box {
                    background: #f7fafc;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                }
                .signature {
                    margin-top: 30px;
                    display: flex;
                    justify-content: flex-end;
                }
                .signature img {
                    width: 220px;
                    border-bottom: 2px solid #111827;
                    padding-bottom: 6px;
                }
                @media print {
                    .print-btn { display: none; }
                    body { user-select: text; }
                }
            </style>
        </head>
        <body oncontextmenu="return false;">
            <div class="anti-copy">PAYMENT RECEIPT</div>
            <div class="receipt-wrap">
            <div class="receipt-header">
                <h1>💳 Payment Receipt</h1>
                <p>Receipt #${receiptId}</p>
            </div>
            
            <div class="info-grid">
                <div class="info-section">
                    <h3>Recipient Details</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                </div>
                <div class="info-section">
                    <h3>Payment Status</h3>
                    <p><strong>${status}</strong></p>
                    <p>Date: ${date}</p>
                </div>
            </div>

            <div class="payment-details">
                <h3>Payment Breakdown</h3>
                ${description ? `<p style="margin-bottom:15px;">${description}</p>` : ''}
                <div class="payment-row">
                    <span>Total Amount:</span>
                    <span><strong>¥${parseFloat(amount).toFixed(2)}</strong></span>
                </div>
                <div class="payment-row">
                    <span>Amount Paid:</span>
                    <span style="color:#48bb78;"><strong>${amountPaid || '¥0'}</strong></span>
                </div>
                <div class="payment-row">
                    <span>Due Amount:</span>
                    <span style="color:${parseFloat(dueAmount) > 0 ? '#f56565' : '#48bb78'};"><strong>¥${parseFloat(dueAmount || 0).toFixed(2)}</strong></span>
                </div>
            </div>

            <div class="codes">
                <div class="code-box">
                    <div><strong>QR Code</strong></div>
                    <div id="qrCode"></div>
                </div>
                <div class="code-box">
                    <div><strong>Barcode</strong></div>
                    <svg id="barcode"></svg>
                </div>
            </div>

                <div class="signature">
                    <div>
                        <img src="https://sir0exclusive.github.io/Payment-Recept/signature.png" alt="Signature" />
                    </div>
                </div>

            <button class="print-btn" onclick="window.print()">🖨️ Print Receipt</button>

            <div style="text-align:center;color:#999;font-size:12px;margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;">
                <p>This is a computer-generated receipt.</p>
                <p>Payment Receipt System © ${new Date().getFullYear()}</p>
            </div>
            </div>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
            <script>
                const qrData = JSON.stringify({
                    receiptId: ${JSON.stringify(receiptId)},
                    email: ${JSON.stringify(email)},
                    amount: ${JSON.stringify(amount)},
                    date: ${JSON.stringify(date)}
                });
                new QRCode(document.getElementById('qrCode'), {
                    text: qrData,
                    width: 140,
                    height: 140
                });
                JsBarcode('#barcode', ${JSON.stringify(String(receiptId))}, {
                    format: 'CODE128',
                    width: 2,
                    height: 60,
                    displayValue: true
                });
            </script>
        </body>
        </html>
    `);
    receiptWindow.document.close();
}
