// Admin Dashboard - View all payments
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyIekZfn_WnbZrj7NV3wofBF5YhIAx5E1yev_tVzb1mGRvmifLqDqdrg0eUwT7zZyhRFg/exec";
const ADMIN_EMAIL = "sarwaroffjp@gmail.com";

// Check if user is admin
function isAdmin() {
    const currentUser = getCurrentUser();
    return currentUser && currentUser.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// Check authentication
if (!isLoggedIn()) {
    window.location.href = 'admin-login.html';
}

if (!isAdmin() || !isAdminSession()) {
    alert('Access denied. Admin only.');
    window.location.href = 'admin-login.html';
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

        allPayments.innerHTML = Object.entries(groupedByRecipient).map(([recipient, payments]) => `
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
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="margin: 0; color: #333;">Receipt #${payment['Receipt No']}</h4>
                            <span style="font-weight: 700; font-size: 14px; color: ${payment.Payment_Status === 'PAID' ? '#00b050' : '#ff6b6b'};">${payment.Payment_Status || 'N/A'}</span>
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
