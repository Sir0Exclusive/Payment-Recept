const API_URL = 'https://script.google.com/macros/s/AKfycbyIekZfn_WnbZrj7NV3wofBF5YhIAx5E1yev_tVzb1mGRvmifLqDqdrg0eUwT7zZyhRFg/exec';

let recipients = [];
let payments = [];

// Load data on page load
window.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!requireAuth('admin')) {
        return;
    }
    
    showSection('recipients');
    loadRecipients();
    loadPayments();
});

function showSection(section) {
    document.getElementById('recipientsSection').style.display = section === 'recipients' ? 'block' : 'none';
    document.getElementById('paymentsSection').style.display = section === 'payments' ? 'block' : 'none';
}

// ============ RECIPIENTS MANAGEMENT ============

async function loadRecipients() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: JSON.stringify({ action: 'get_recipients' })
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            recipients = data.rows;
            displayRecipients();
            updateRecipientDropdown();
        }
    } catch (error) {
        console.error('Load recipients error:', error);
    }
}

function displayRecipients() {
    const container = document.getElementById('recipientsList');
    
    if (recipients.length === 0) {
        container.innerHTML = '<p style="color:#999;padding:20px;">No recipients yet. Add your first recipient above.</p>';
        return;
    }
    
    let html = '<table><thead><tr><th>Email</th><th>Name</th><th>Created</th><th>Actions</th></tr></thead><tbody>';
    
    recipients.forEach(r => {
        const [email, name, created, lastLogin] = r;
        html += `
            <tr>
                <td>${email}</td>
                <td><strong>${name}</strong></td>
                <td>${new Date(created).toLocaleDateString()}</td>
                <td>
                    <button onclick="deleteRecipient('${email}')" class="btn btn-danger btn-sm">Delete</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function openAddRecipientModal() {
    document.getElementById('addRecipientModal').classList.add('active');
    document.getElementById('addRecipientForm').reset();
    document.getElementById('recipientMessage').innerHTML = '';
}

function closeAddRecipientModal() {
    document.getElementById('addRecipientModal').classList.remove('active');
}

document.getElementById('addRecipientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('recipientEmail').value.trim();
    const name = document.getElementById('recipientName').value.trim();
    const password = document.getElementById('recipientPassword').value;
    const messageDiv = document.getElementById('recipientMessage');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: JSON.stringify({
                action: 'create_recipient',
                email: email,
                name: name,
                password: password
            })
        });
        
        const result = await response.text();
        
        if (result.includes('RECIPIENT_CREATED')) {
            messageDiv.innerHTML = '<div class="message success">✅ Recipient created successfully!</div>';
            setTimeout(() => {
                closeAddRecipientModal();
                loadRecipients();
            }, 1000);
        } else {
            messageDiv.innerHTML = `<div class="message error">❌ ${result}</div>`;
        }
    } catch (error) {
        messageDiv.innerHTML = `<div class="message error">❌ Error: ${error.message}</div>`;
    }
});

async function deleteRecipient(email) {
    if (!confirm(`Delete recipient ${email}?`)) return;
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: JSON.stringify({
                action: 'delete_recipient',
                email: email
            })
        });
        
        const result = await response.text();
        
        if (result.includes('DELETED')) {
            alert('✅ Recipient deleted');
            loadRecipients();
        } else {
            alert('❌ ' + result);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// ============ PAYMENTS MANAGEMENT ============

async function loadPayments() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.status === 'success') {
            payments = data.rows;
            displayPayments();
        }
    } catch (error) {
        console.error('Load payments error:', error);
    }
}

function displayPayments() {
    const container = document.getElementById('paymentsList');
    
    if (payments.length === 0) {
        container.innerHTML = '<p style="color:#999;padding:20px;">No payments yet. Add your first payment above.</p>';
        return;
    }
    
    let html = '<table><thead><tr><th>Receipt#</th><th>Name</th><th>Email</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>';
    
    payments.forEach(p => {
        const [receiptNo, name, amount, dueAmount, date, desc, email, status] = p;
        const statusClass = status === 'PAID' ? 'status-paid' : 'status-due';
        
        html += `
            <tr>
                <td><strong>${receiptNo}</strong></td>
                <td>${name}</td>
                <td>${email}</td>
                <td>¥${parseFloat(amount).toFixed(2)}</td>
                <td><span class="payment-status ${statusClass}">${status}</span></td>
                <td>${date}</td>
                <td>
                    <button onclick="deletePayment('${receiptNo}')" class="btn btn-danger btn-sm">Delete</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function updateRecipientDropdown() {
    const select = document.getElementById('paymentEmail');
    select.innerHTML = '<option value="">Select recipient...</option>';
    
    recipients.forEach(r => {
        const [email, name] = r;
        select.innerHTML += `<option value="${email}">${name} (${email})</option>`;
    });
}

document.getElementById('paymentEmail').addEventListener('change', (e) => {
    const email = e.target.value;
    const recipient = recipients.find(r => r[0] === email);
    if (recipient) {
        document.getElementById('paymentName').value = recipient[1];
    }
});

function openAddPaymentModal() {
    if (recipients.length === 0) {
        alert('⚠️ Please create a recipient first!');
        showSection('recipients');
        return;
    }
    
    document.getElementById('addPaymentModal').classList.add('active');
    document.getElementById('addPaymentForm').reset();
    document.getElementById('paymentMessage').innerHTML = '';
    document.getElementById('paymentDate').valueAsDate = new Date();
}

function closeAddPaymentModal() {
    document.getElementById('addPaymentModal').classList.remove('active');
}

document.getElementById('addPaymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('paymentEmail').value;
    const name = document.getElementById('paymentName').value.trim();
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const dueAmount = parseFloat(document.getElementById('paymentDue').value);
    const date = document.getElementById('paymentDate').value;
    const description = document.getElementById('paymentDescription').value.trim();
    const messageDiv = document.getElementById('paymentMessage');
    
    const receiptId = 'R' + Date.now();
    const paidAmount = amount - dueAmount;
    const status = dueAmount === 0 ? 'PAID' : 'DUE';
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: JSON.stringify({
                receiptId: receiptId,
                email: email,
                Name: name,
                Amount: amount.toString(),
                'Due Amount': dueAmount.toString(),
                Date: date,
                Description: description,
                Payment_Status: status,
                Amount_Paid: `¥${paidAmount.toFixed(2)}`
            })
        });
        
        const result = await response.text();
        
        if (result.includes('CREATED') || result.includes('UPDATED')) {
            messageDiv.innerHTML = '<div class="message success">✅ Payment created successfully!</div>';
            setTimeout(() => {
                closeAddPaymentModal();
                loadPayments();
            }, 1000);
        } else {
            messageDiv.innerHTML = `<div class="message error">❌ ${result}</div>`;
        }
    } catch (error) {
        messageDiv.innerHTML = `<div class="message error">❌ Error: ${error.message}</div>`;
    }
});

async function deletePayment(receiptId) {
    if (!confirm(`Delete payment ${receiptId}?`)) return;
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: JSON.stringify({
                action: 'delete',
                receiptId: receiptId
            })
        });
        
        const result = await response.text();
        
        if (result.includes('DELETED')) {
            alert('✅ Payment deleted');
            loadPayments();
        } else {
            alert('❌ ' + result);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}
