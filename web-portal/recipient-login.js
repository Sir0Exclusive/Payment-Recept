// Recipient Login Script
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyIekZfn_WnbZrj7NV3wofBF5YhIAx5E1yev_tVzb1mGRvmifLqDqdrg0eUwT7zZyhRFg/exec';

const form = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const statusMessage = document.getElementById('statusMessage');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

// Password visibility toggle
togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.textContent = type === 'password' ? 'Show' : 'Hide';
});

// Show status message
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
}

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showStatus('Please fill in all fields', 'error');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    try {
        const response = await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'recipient_login',
                email: email,
                password: password
            })
        });

        const result = await response.text();
        console.log('Login response:', result);

        // Try to parse as JSON first
        try {
            const jsonResult = JSON.parse(result);
            if (jsonResult.status === 'success') {
                // Store recipient session
                sessionStorage.setItem('recipientEmail', jsonResult.email);
                sessionStorage.setItem('recipientName', jsonResult.name);
                sessionStorage.setItem('recipientLoginTime', Date.now());

                showStatus('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'recipient-dashboard.html';
                }, 1000);
                return;
            }
        } catch (e) {
            // Not JSON, treat as error message
        }

        // Handle error messages
        if (result.includes('Invalid password')) {
            showStatus('❌ Invalid password', 'error');
        } else if (result.includes('User not found')) {
            showStatus('❌ No account found with this email', 'error');
        } else if (result.includes('Invalid email')) {
            showStatus('❌ Invalid email format', 'error');
        } else {
            showStatus('❌ Login failed: ' + result, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showStatus('❌ Connection error. Please try again.', 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
});

// Check if already logged in
if (sessionStorage.getItem('recipientEmail')) {
    const loginTime = sessionStorage.getItem('recipientLoginTime');
    const now = Date.now();
    
    // Session valid for 24 hours
    if (loginTime && (now - loginTime) < 24 * 60 * 60 * 1000) {
        window.location.href = 'recipient-dashboard.html';
    } else {
        // Clear expired session
        sessionStorage.removeItem('recipientEmail');
        sessionStorage.removeItem('recipientName');
        sessionStorage.removeItem('recipientLoginTime');
    }
}
