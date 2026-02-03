// Admin Dashboard - View all payments
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyIekZfn_WnbZrj7NV3wofBF5YhIAx5E1yev_tVzb1mGRvmifLqDqdrg0eUwT7zZyhRFg/exec";
const ADMIN_EMAIL = "sarwaroffjp@gmail.com";

// Input sanitization to prevent injection attacks
function sanitizeInput(input) {
    return String(input)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(email).toLowerCase());
}

// Validate numeric input
function isValidAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num >= 0;
}

// Check if user is admin
function isAdmin() {
    const currentUser = getCurrentUser();
    return currentUser && currentUser.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// Verify admin access on page load
function verifyAdminAccess() {
    if (!isLoggedIn()) {
        window.location.href = 'admin-login.html';
        return false;
    }

    if (!isAdmin() || !isAdminSession()) {
        alert('Access denied. Admin only.');
        window.location.href = 'admin-login.html';
        return false;
    }
    return true;
}

// Run verification when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (verifyAdminAccess()) {
        loadAllPayments();
    }
});

async function loadAllPayments() {
    const allPayments = document.getElementById('allPayments');
    allPayments.innerHTML = '<p>Loading all payment records...</p>';

    try {
        const sheetData = await fetchGoogleSheetData();
        
        if (!sheetData || sheetData.length === 0) {
            allPayments.innerHTML = '<p>No payment records found.</p>';
            return;
        }

        cachedPayments = sheetData;

        // Update stats
        const totalReceipts = sheetData.length;
        const paidCount = sheetData.filter(p => String(p.Payment_Status || '').toUpperCase() === 'PAID').length;
        const dueCount = sheetData.filter(p => String(p.Payment_Status || '').toUpperCase() !== 'PAID').length;
        const totalAmount = sheetData.reduce((sum, p) => {
            const amt = parseFloat(String(p.Amount || '0').replace(/[^0-9.-]/g, '')) || 0;
            return sum + amt;
        }, 0);

        const statTotal = document.getElementById('statTotal');
        const statPaid = document.getElementById('statPaid');
        const statDue = document.getElementById('statDue');
        const statAmount = document.getElementById('statAmount');
        if (statTotal) statTotal.textContent = totalReceipts;
        if (statPaid) statPaid.textContent = paidCount;
        if (statDue) statDue.textContent = dueCount;
        if (statAmount) statAmount.textContent = `¥${totalAmount.toFixed(2)}`;

        // Group by recipient
        const groupedByRecipient = {};
        sheetData.forEach(payment => {
            const email = payment['Recipient Email'] || payment.Name || 'Unknown';
            if (!groupedByRecipient[email]) {
                groupedByRecipient[email] = [];
            }
            groupedByRecipient[email].push(payment);
        });

        displayPayments(Object.entries(groupedByRecipient));

    } catch (error) {
        allPayments.innerHTML = '<p>Error loading payment records.</p>';
        console.error(error);
    }
}

function displayPayments(groupedEntries) {
    const allPayments = document.getElementById('allPayments');
    allPayments.innerHTML = groupedEntries.map(([recipient, payments]) => `
        <div class="receipt-card" style="margin-bottom: 22px; background: #f8faff; border: 1px solid #e3e7ff;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div>
                    <h3 style="margin: 0; color: #3f51b5;">📧 ${recipient}</h3>
                    <p class="muted" style="margin-top: 6px;">Total Payments: ${payments.length}</p>
                </div>
                <span style="padding: 6px 12px; border-radius: 999px; background: #eef2ff; color: #3f51b5; font-weight: 600;">Recipient</span>
            </div>

            ${payments.map(payment => `
                <div class="receipt-card" style="margin: 14px 0 0; background: #fff;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                        <h4 style="margin: 0; color: #333;">Receipt #${payment['Receipt No']}</h4>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="font-weight: 700; font-size: 14px; color: ${payment.Payment_Status === 'PAID' ? '#00b050' : '#ff6b6b'};">${payment.Payment_Status || 'N/A'}</span>
                            <button class="btn btn-info" style="padding: 6px 12px;" onclick="generateReceiptForPayment('${payment['Receipt No']}')">📄 Receipt</button>
                            <button class="btn btn-primary" style="padding: 6px 12px;" data-edit-receipt="${payment['Receipt No']}">✏️ Edit</button>
                        </div>
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
}

function filterPayments() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        const groupedByRecipient = {};
        cachedPayments.forEach(payment => {
            const email = payment['Recipient Email'] || payment.Name || 'Unknown';
            if (!groupedByRecipient[email]) {
                groupedByRecipient[email] = [];
            }
            groupedByRecipient[email].push(payment);
        });
        displayPayments(Object.entries(groupedByRecipient));
        return;
    }

    const filtered = cachedPayments.filter(p => 
        String(p['Recipient Email'] || '').toLowerCase().includes(searchTerm) ||
        String(p.Name || '').toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
        document.getElementById('allPayments').innerHTML = '<p style="color: #999;">No receipts found matching your search.</p>';
        return;
    }

    const groupedByRecipient = {};
    filtered.forEach(payment => {
        const email = payment['Recipient Email'] || payment.Name || 'Unknown';
        if (!groupedByRecipient[email]) {
            groupedByRecipient[email] = [];
        }
        groupedByRecipient[email].push(payment);
    });
    displayPayments(Object.entries(groupedByRecipient));
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

// Excel Export
async function downloadExcel() {
    showStatus('Exporting to Excel...', 'info');
    
    try {
        const sheetData = await fetchGoogleSheetData();
        
        if (!sheetData || sheetData.length === 0) {
            showStatus('No data to export', 'error');
            return;
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, 'Receipts');
        XLSX.writeFile(wb, `payments_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        showStatus('Excel exported successfully!', 'success');
    } catch (error) {
        showStatus('Export failed: ' + error.message, 'error');
    }
}

// Excel Import
async function uploadExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    showStatus('Importing Excel...', 'info');

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
            showStatus('No data found in Excel', 'error');
            return;
        }

        // Upload to Google Sheets
        let success = 0;
        let failed = 0;

        for (const row of jsonData) {
            const payload = {
                receiptId: row['Receipt No'] || row.receiptId,
                email: row['Recipient Email'] || row.email,
                Name: row.Name,
                Amount: row.Amount,
                'Due Amount': row['Due Amount'] || row.dueAmount,
                Date: row.Date,
                Description: row.Description,
                Payment_Status: row.Payment_Status || row.paymentStatus,
                Amount_Paid: row.Amount_Paid || row.amountPaid
            };

            const response = await fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) success++;
            else failed++;
        }

        showStatus(`Import complete: ${success} uploaded, ${failed} failed`, success > 0 ? 'success' : 'error');
        setTimeout(() => loadAllPayments(), 1000);
        
    } catch (error) {
        showStatus('Import failed: ' + error.message, 'error');
    }

    event.target.value = '';
}

// Generate All Receipts
async function generateAllReceipts() {
    showStatus('Generating receipts...', 'info');
    
    try {
        const sheetData = await fetchGoogleSheetData();
        
        if (!sheetData || sheetData.length === 0) {
            showStatus('No data to generate receipts from', 'error');
            return;
        }

        showStatus(`${sheetData.length} receipts generated (simulation - requires backend)`, 'success');
        // In real implementation, this would call Python backend to generate PDFs
        
    } catch (error) {
        showStatus('Generation failed: ' + error.message, 'error');
    }
}

// Seed Dummy Data
async function seedDummyData() {
    if (!isAdminSession()) {
        showStatus('Admin session required', 'error');
        return;
    }

    const confirmSeed = confirm('Add dummy data to Google Sheets? This will create multiple test receipts.');
    if (!confirmSeed) return;

    showStatus('Adding dummy data...', 'info');

    const dummyData = [
        { receiptId: '10001', email: 'sarwaroffjp@gmail.com', Name: 'Sarwar Admin', Amount: '¥5000', 'Due Amount': '0', Date: '2026-01-05', Description: 'Website Development', Payment_Status: 'PAID', Amount_Paid: '¥5000' },
        { receiptId: '10002', email: 'sarwaroffjp@gmail.com', Name: 'Sarwar Admin', Amount: '¥3500', 'Due Amount': '500', Date: '2026-01-20', Description: 'Hosting Renewal', Payment_Status: 'DUE', Amount_Paid: '¥3000' },
        { receiptId: '20001', email: 'john.doe@gmail.com', Name: 'John Doe', Amount: '¥1200', 'Due Amount': '0', Date: '2026-01-07', Description: 'Consulting Fee', Payment_Status: 'PAID', Amount_Paid: '¥1200' },
        { receiptId: '20002', email: 'john.doe@gmail.com', Name: 'John Doe', Amount: '¥1800', 'Due Amount': '200', Date: '2026-01-28', Description: 'Monthly Service', Payment_Status: 'DUE', Amount_Paid: '¥1600' },
        { receiptId: '30001', email: 'amina.khan@gmail.com', Name: 'Amina Khan', Amount: '¥2500', 'Due Amount': '0', Date: '2026-01-09', Description: 'Design Package', Payment_Status: 'PAID', Amount_Paid: '¥2500' },
        { receiptId: '30002', email: 'amina.khan@gmail.com', Name: 'Amina Khan', Amount: '¥2200', 'Due Amount': '200', Date: '2026-01-22', Description: 'Brand Assets', Payment_Status: 'DUE', Amount_Paid: '¥2000' },
        { receiptId: '40001', email: 'maria.garcia@gmail.com', Name: 'Maria Garcia', Amount: '¥4200', 'Due Amount': '0', Date: '2026-01-12', Description: 'Event Coverage', Payment_Status: 'PAID', Amount_Paid: '¥4200' },
        { receiptId: '40002', email: 'maria.garcia@gmail.com', Name: 'Maria Garcia', Amount: '¥1900', 'Due Amount': '900', Date: '2026-01-30', Description: 'Extra Revisions', Payment_Status: 'DUE', Amount_Paid: '¥1000' },
        { receiptId: '50001', email: 'ahmed.khan@gmail.com', Name: 'Ahmed Khan', Amount: '¥3000', 'Due Amount': '0', Date: '2026-01-15', Description: 'App Maintenance', Payment_Status: 'PAID', Amount_Paid: '¥3000' },
        { receiptId: '50002', email: 'ahmed.khan@gmail.com', Name: 'Ahmed Khan', Amount: '¥2800', 'Due Amount': '400', Date: '2026-01-31', Description: 'Feature Upgrade', Payment_Status: 'DUE', Amount_Paid: '¥2400' }
    ];

    let success = 0;
    let failed = 0;

    for (const row of dummyData) {
        const response = await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(row)
        });

        if (response.ok) success++;
        else failed++;
    }

    showStatus(`Dummy data added: ${success} success, ${failed} failed`, success > 0 ? 'success' : 'error');
    setTimeout(() => loadAllPayments(), 1000);
}

// Show status message
function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.style.display = 'block';
    statusEl.style.background = type === 'success' ? '#4CAF50' : type === 'error' ? '#ff6b6b' : '#2196F3';
    statusEl.style.color = 'white';
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
}

// Edit Modal Logic
let cachedPayments = [];

function openEditModal(payment) {
    const modal = document.getElementById('editModal');
    if (!modal) return;

    document.getElementById('editReceiptId').value = payment['Receipt No'] || '';
    document.getElementById('editEmail').value = payment['Recipient Email'] || '';
    document.getElementById('editName').value = payment.Name || '';
    document.getElementById('editAmount').value = payment.Amount || '';
    document.getElementById('editDueAmount').value = payment['Due Amount'] || '';
    document.getElementById('editDate').value = payment.Date || '';
    document.getElementById('editDescription').value = payment.Description || '';

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
}

// Edit Modal Logic - Advanced with validation, add, delete, search
function generateReceiptId() {
    return 'RCP' + Date.now().toString().slice(-8);
}

function openAddModal() {
    const modal = document.getElementById('addModal');
    if (!modal) return;

    document.getElementById('addEmail').value = '';
    document.getElementById('addName').value = '';
    document.getElementById('addAmount').value = '';
    document.getElementById('addDueAmount').value = '0';
    document.getElementById('addDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('addDescription').value = '';

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function closeAddModal() {
    const modal = document.getElementById('addModal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
}

async function addNewReceipt() {
    const email = document.getElementById('addEmail').value.trim();
    const name = document.getElementById('addName').value.trim();
    const amount = document.getElementById('addAmount').value.trim();
    const dueAmount = document.getElementById('addDueAmount').value.trim();
    const date = document.getElementById('addDate').value;
    const description = document.getElementById('addDescription').value.trim();

    if (!email || !name || !amount || !date) {
        showStatus('❌ Please fill all required fields', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showStatus('❌ Invalid email address', 'error');
        return;
    }

    if (!isValidAmount(amount)) {
        showStatus('❌ Amount must be a valid positive number', 'error');
        return;
    }

    if (dueAmount && !isValidAmount(dueAmount)) {
        showStatus('❌ Due amount must be a valid positive number', 'error');
        return;
    }

    const receiptId = generateReceiptId();
    const amountNum = parseFloat(amount);
    const dueNum = parseFloat(dueAmount || '0');
    const paidAmount = amountNum - dueNum;
    const paymentStatus = dueNum === 0 ? 'PAID' : 'DUE';

    const payload = {
        receiptId,
        email: sanitizeInput(email),
        Name: sanitizeInput(name),
        Amount: parseFloat(amount).toString(),
        'Due Amount': parseFloat(dueAmount || '0').toString(),
        Date: date,
        Description: sanitizeInput(description),
        Payment_Status: paymentStatus,
        Amount_Paid: `¥${paidAmount.toFixed(2)}`
    };

    try {
        showStatus('⏳ Creating receipt...', 'info');
        const response = await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.text();
        console.log('Response:', result);

        if (result.includes('CREATED') || result.includes('UPDATED')) {
            closeAddModal();
            showStatus(`✅ Receipt ${receiptId} created successfully`, 'success');
            setTimeout(() => loadAllPayments(), 600);
        } else if (result.includes('Error') || result.includes('error')) {
            showStatus(`❌ ${result}`, 'error');
        } else {
            showStatus(`✅ Receipt ${receiptId} created successfully`, 'success');
            closeAddModal();
            setTimeout(() => loadAllPayments(), 600);
        }
    } catch (error) {
        console.error('Add receipt error:', error);
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

function openEditModal(payment) {
    const modal = document.getElementById('editModal');
    if (!modal) return;

    document.getElementById('editReceiptId').value = payment['Receipt No'] || '';
    document.getElementById('editReceiptNo').textContent = payment['Receipt No'] || '';
    document.getElementById('editEmail').value = payment['Recipient Email'] || '';
    document.getElementById('editName').value = payment.Name || '';
    document.getElementById('editAmount').value = payment.Amount || '';
    document.getElementById('editDueAmount').value = payment['Due Amount'] || '';
    document.getElementById('editDate').value = payment.Date || '';
    document.getElementById('editDescription').value = payment.Description || '';

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
}

async function saveEdit() {
    const receiptId = document.getElementById('editReceiptId').value.trim();
    if (!receiptId) {
        showStatus('❌ Missing receipt ID', 'error');
        return;
    }

    const email = document.getElementById('editEmail').value.trim();
    if (!email || !isValidEmail(email)) {
        showStatus('❌ Invalid email address', 'error');
        return;
    }

    const amount = document.getElementById('editAmount').value.trim();
    const dueAmount = document.getElementById('editDueAmount').value.trim();

    if (!amount || !isValidAmount(amount)) {
        showStatus('❌ Amount must be a valid positive number', 'error');
        return;
    }

    if (dueAmount && !isValidAmount(dueAmount)) {
        showStatus('❌ Due amount must be a valid positive number', 'error');
        return;
    }

    const amountNum = parseFloat(amount);
    const dueNum = parseFloat(dueAmount || '0');
    const paidAmount = amountNum - dueNum;
    const paymentStatus = dueNum === 0 ? 'PAID' : 'DUE';

    const payload = {
        receiptId,
        email: sanitizeInput(email),
        Name: sanitizeInput(document.getElementById('editName').value.trim()),
        Amount: parseFloat(amount).toString(),
        'Due Amount': parseFloat(dueAmount || '0').toString(),
        Date: document.getElementById('editDate').value,
        Description: sanitizeInput(document.getElementById('editDescription').value.trim()),
        Payment_Status: paymentStatus,
        Amount_Paid: `¥${paidAmount.toFixed(2)}`
    };

    try {
        showStatus('⏳ Saving changes...', 'info');
        const response = await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.text();
        console.log('Edit Response:', result);

        if (result.includes('UPDATED') || result.includes('CREATED')) {
            closeEditModal();
            showStatus('✅ Receipt updated successfully', 'success');
            setTimeout(() => loadAllPayments(), 600);
        } else if (result.includes('Error') || result.includes('error')) {
            showStatus(`❌ ${result}`, 'error');
        } else {
            closeEditModal();
            showStatus('✅ Receipt updated successfully', 'success');
            setTimeout(() => loadAllPayments(), 600);
        }
    } catch (error) {
        console.error('Edit receipt error:', error);
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

async function deleteReceipt() {
    const receiptId = document.getElementById('editReceiptId').value.trim();
    if (!receiptId) {
        showStatus('❌ Missing receipt ID', 'error');
        return;
    }

    if (!confirm(`⚠️ Are you sure you want to delete Receipt #${receiptId}? This action cannot be undone.`)) {
        return;
    }

    try {
        showStatus('⏳ Deleting receipt...', 'info');
        const response = await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiptId, action: 'delete' })
        });

        const result = await response.text();
        
        if (result.includes('DELETED') || result.includes('OK')) {
            closeEditModal();
            showStatus('✅ Receipt deleted successfully!', 'success');
            setTimeout(() => loadAllPayments(), 600);
        } else if (result.includes('NOT_FOUND')) {
            showStatus('⚠️ Receipt not found - may have been deleted already', 'warning');
            setTimeout(() => {
                closeEditModal();
                loadAllPayments();
            }, 800);
        } else {
            showStatus('❌ Delete failed: ' + result, 'error');
        }
    } catch (error) {
        showStatus('❌ Delete failed: ' + error.message, 'error');
    }
}

function filterPayments() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        const groupedByRecipient = {};
        cachedPayments.forEach(payment => {
            const email = payment['Recipient Email'] || payment.Name || 'Unknown';
            if (!groupedByRecipient[email]) {
                groupedByRecipient[email] = [];
            }
            groupedByRecipient[email].push(payment);
        });
        displayPayments(Object.entries(groupedByRecipient));
        return;
    }

    const filtered = cachedPayments.filter(p => 
        String(p['Recipient Email'] || '').toLowerCase().includes(searchTerm) ||
        String(p.Name || '').toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
        document.getElementById('allPayments').innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">🔍 No receipts found matching your search.</p>';
        return;
    }

    const groupedByRecipient = {};
    filtered.forEach(payment => {
        const email = payment['Recipient Email'] || payment.Name || 'Unknown';
        if (!groupedByRecipient[email]) {
            groupedByRecipient[email] = [];
        }
        groupedByRecipient[email].push(payment);
    });
    displayPayments(Object.entries(groupedByRecipient));
}

async function refreshCache() {
    const sheetData = await fetchGoogleSheetData();
    cachedPayments = sheetData || [];
}

function exportFilteredData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const filtered = cachedPayments.filter(p => {
        const email = String(p['Recipient Email'] || '').toLowerCase();
        const name = String(p.Name || '').toLowerCase();
        return email.includes(searchTerm) || name.includes(searchTerm);
    });

    if (filtered.length === 0) {
        showStatus('❌ No results to export', 'warning');
        return;
    }

    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Filtered Results');
    XLSX.writeFile(wb, `receipts-export-${new Date().getTime()}.xlsx`);
    showStatus(`✅ Exported ${filtered.length} receipt(s) successfully`, 'success');
}

document.addEventListener('click', async (event) => {
    const target = event.target;
    if (target && target.matches('[data-edit-receipt]')) {
        const receiptId = target.getAttribute('data-edit-receipt');
        if (!cachedPayments.length) {
            await refreshCache();
        }
        const payment = cachedPayments.find(p => String(p['Receipt No']) === String(receiptId));
        if (payment) {
            openEditModal(payment);
        } else {
            showStatus('❌ Receipt not found in cache', 'error');
        }
    }
});

document.addEventListener('input', (event) => {
    if (event.target.id === 'searchInput') {
        filterPayments();
    }
});

window.addEventListener('DOMContentLoaded', () => {
    refreshCache();
    loadRecipients();
});

// ==================== RECIPIENT MANAGEMENT ====================

let allRecipients = [];

// Tab switching
function switchTab(tab) {
    const recipientsPanel = document.getElementById('recipientsPanel');
    const paymentsPanel = document.getElementById('adminPanel');
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => btn.classList.remove('active'));

    if (tab === 'recipients') {
        recipientsPanel.classList.add('active');
        paymentsPanel.classList.remove('active');
        event.target.classList.add('active');
        loadRecipients();
    } else {
        recipientsPanel.classList.remove('active');
        paymentsPanel.classList.add('active');
        event.target.classList.add('active');
        refreshCache();
    }
}

// Load all recipients
async function loadRecipients() {
    try {
        const response = await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_recipients' })
        });

        const data = await response.json();
        console.log('Recipients:', data);

        if (data.status === 'success') {
            allRecipients = data.rows;
            displayRecipients(allRecipients);
            updateRecipientDropdown(allRecipients);
        } else {
            showRecipientsStatus('❌ Failed to load recipients', 'error');
        }
    } catch (error) {
        console.error('Load recipients error:', error);
        showRecipientsStatus('❌ Error: ' + error.message, 'error');
    }
}

// Display recipients table
function displayRecipients(recipients) {
    const container = document.getElementById('allRecipients');
    
    if (recipients.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No recipients found. Add your first recipient above.</p>';
        return;
    }

    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Created Date</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    recipients.forEach(recipient => {
        const [email, name, createdDate, lastLogin] = recipient;
        html += `
            <tr>
                <td>${email}</td>
                <td><strong>${name}</strong></td>
                <td>${formatDate(createdDate)}</td>
                <td>${lastLogin ? formatDate(lastLogin) : 'Never'}</td>
                <td>
                    <button class="btn-sm btn-primary" onclick="viewRecipientPayments('${email}')">📋 Payments</button>
                    <button class="btn-sm btn-danger" onclick="deleteRecipientConfirm('${email}')">🗑️ Delete</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

// Update recipient dropdown in add payment modal
function updateRecipientDropdown(recipients) {
    const select = document.getElementById('addEmail');
    select.innerHTML = '<option value="">Select recipient...</option>';
    
    recipients.forEach(recipient => {
        const [email, name] = recipient;
        const option = document.createElement('option');
        option.value = email;
        option.textContent = `${name} (${email})`;
        option.dataset.name = name;
        select.appendChild(option);
    });

    // Auto-fill name when recipient selected
    select.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const nameInput = document.getElementById('addName');
        if (selectedOption.dataset.name) {
            nameInput.value = selectedOption.dataset.name;
        }
    });
}

// Show status for recipients
function showRecipientsStatus(message, type) {
    const statusDiv = document.getElementById('recipientsStatusMessage');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.style.display = 'block';
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

// Open add recipient modal
function openAddRecipientModal() {
    document.getElementById('addRecipientModal').style.display = 'flex';
    document.getElementById('addRecipientEmail').value = '';
    document.getElementById('addRecipientName').value = '';
    document.getElementById('addRecipientPassword').value = '';
}

// Close add recipient modal
function closeAddRecipientModal() {
    document.getElementById('addRecipientModal').style.display = 'none';
}

// Create new recipient
async function createRecipient() {
    const email = document.getElementById('addRecipientEmail').value.trim();
    const name = document.getElementById('addRecipientName').value.trim();
    const password = document.getElementById('addRecipientPassword').value;

    if (!email || !name || !password) {
        showRecipientsStatus('❌ All fields are required', 'error');
        return;
    }

    if (password.length < 6) {
        showRecipientsStatus('❌ Password must be at least 6 characters', 'error');
        return;
    }

    try {
        showRecipientsStatus('⏳ Creating recipient...', 'info');
        const response = await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create_recipient',
                email: email,
                name: name,
                password: password
            })
        });

        const result = await response.text();
        console.log('Create recipient response:', result);

        if (result.includes('RECIPIENT_CREATED')) {
            closeAddRecipientModal();
            showRecipientsStatus('✅ Recipient created successfully!', 'success');
            setTimeout(() => loadRecipients(), 600);
        } else if (result.includes('already exists')) {
            showRecipientsStatus('❌ This email is already registered', 'error');
        } else if (result.includes('Error') || result.includes('error')) {
            showRecipientsStatus(`❌ ${result}`, 'error');
        } else {
            showRecipientsStatus('❌ Failed to create recipient', 'error');
        }
    } catch (error) {
        console.error('Create recipient error:', error);
        showRecipientsStatus('❌ Error: ' + error.message, 'error');
    }
}

// View payments for specific recipient
function viewRecipientPayments(email) {
    switchTab('payments');
    const searchInput = document.getElementById('searchInput');
    searchInput.value = email;
    filterPayments();
}

// Delete recipient confirmation
function deleteRecipientConfirm(email) {
    if (confirm(`⚠️ Are you sure you want to delete recipient ${email}?\n\nThis will NOT delete their payment records.`)) {
        deleteRecipientAccount(email);
    }
}

// Delete recipient account
async function deleteRecipientAccount(email) {
    try {
        showRecipientsStatus('⏳ Deleting recipient...', 'info');
        const response = await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete_recipient',
                email: email
            })
        });

        const result = await response.text();
        console.log('Delete recipient response:', result);

        if (result.includes('DELETED')) {
            showRecipientsStatus('✅ Recipient deleted successfully', 'success');
            setTimeout(() => loadRecipients(), 600);
        } else if (result.includes('NOT_FOUND')) {
            showRecipientsStatus('⚠️ Recipient not found', 'warning');
        } else {
            showRecipientsStatus('❌ Delete failed: ' + result, 'error');
        }
    } catch (error) {
        console.error('Delete recipient error:', error);
        showRecipientsStatus('❌ Error: ' + error.message, 'error');
    }
}

// Generate receipt for payment (new feature)
function generateReceiptForPayment(receiptId) {
    const payment = cachedPayments.find(p => String(p['Receipt No']) === String(receiptId));
    if (!payment) {
        showStatus('❌ Payment record not found', 'error');
        return;
    }

    const receiptNo = payment['Receipt No'];
    const name = payment['Name'];
    const amount = payment['Amount'];
    const dueAmount = payment['Due Amount'];
    const date = payment['Date'];
    const description = payment['Description'];
    const email = payment['Recipient Email'];
    const status = payment['Payment_Status'];
    const amountPaid = payment['Amount_Paid'];

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
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="receipt-header">
                <h1>PAYMENT RECEIPT</h1>
                <p>Receipt No: <strong>#${receiptNo}</strong></p>
                <p>Date: ${date}</p>
            </div>

            <div class="receipt-info">
                <div class="info-section">
                    <h3>Recipient Information</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                </div>
                <div class="info-section">
                    <h3>Payment Status</h3>
                    <p><strong>${status}</strong></p>
                    <p>Generated: ${new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div class="payment-details">
                <h3>Payment Details</h3>
                ${description ? `<p>${description}</p>` : ''}
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
            </div>

            <button class="print-btn no-print" onclick="window.print()">🖨️ Print Receipt</button>

            <div style="text-align: center; color: #999; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p>This is a computer-generated receipt.</p>
                <p>Payment Receipt System © ${new Date().getFullYear()}</p>
            </div>
        </body>
        </html>
    `);
    receiptWindow.document.close();
}
