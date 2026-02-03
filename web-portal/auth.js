// Authentication System using localStorage (client-side for GitHub Pages)
// In production, use a proper backend with encrypted storage

const AUTH_KEY = 'payment_receipts_users';
const SESSION_KEY = 'payment_receipts_session';
const ADMIN_SESSION_KEY = 'payment_receipts_admin_session';
const ADMIN_EMAIL = 'sarwaroffjp@gmail.com';
const ADMIN_PASSWORD_HASH = 'QGFyZmkxMjM0c2FsdF9rZXlfMjAyNg==';
const LOGIN_ATTEMPTS_KEY = 'payment_receipts_login_attempts';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getUsers() {
    const users = localStorage.getItem(AUTH_KEY);
    return users ? JSON.parse(users) : {};
}

function saveUsers(users) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(users));
}

function hashPassword(password) {
    // Simple hash for demo - use proper encryption in production
    return btoa(password + 'salt_key_2026');
}

function recordLoginAttempt(email) {
    const attempts = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}');
    const key = email.toLowerCase();
    
    if (!attempts[key]) {
        attempts[key] = { count: 0, lastAttempt: 0, lockedUntil: 0 };
    }
    
    const now = Date.now();
    const lockedUntil = attempts[key].lockedUntil || 0;
    
    if (now < lockedUntil) {
        return { locked: true, remainingTime: Math.ceil((lockedUntil - now) / 1000) };
    }
    
    attempts[key].count++;
    attempts[key].lastAttempt = now;
    
    if (attempts[key].count >= MAX_LOGIN_ATTEMPTS) {
        attempts[key].lockedUntil = now + LOCKOUT_DURATION_MS;
        localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
        return { locked: true, remainingTime: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
    }
    
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
    return { locked: false, attemptsLeft: MAX_LOGIN_ATTEMPTS - attempts[key].count };
}

function clearLoginAttempts(email) {
    const attempts = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}');
    delete attempts[email.toLowerCase()];
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
}

function setupSessionTimeout() {
    let timeoutId = null;
    
    function resetTimeout() {
        if (timeoutId) clearTimeout(timeoutId);
        
        const sessionData = sessionStorage.getItem(SESSION_KEY);
        if (sessionData) {
            const session = JSON.parse(sessionData);
            session.lastActivity = Date.now();
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
            
            timeoutId = setTimeout(() => {
                logout();
                alert('Session expired due to inactivity. Please log in again.');
                window.location.href = 'index.html';
            }, SESSION_TIMEOUT_MS);
        }
    }
    
    // Reset timeout on user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetTimeout, true);
    });
    
    // Check session validity on page load
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    if (sessionData) {
        const session = JSON.parse(sessionData);
        const elapsed = Date.now() - (session.lastActivity || session.createdAt);
        if (elapsed > SESSION_TIMEOUT_MS) {
            logout();
            sessionStorage.setItem('sessionExpired', 'true');
        } else {
            resetTimeout();
        }
    }
}

function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    if (!email || !password) {
        errorMsg.textContent = 'Please enter email and password';
        return;
    }

    const users = getUsers();

    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && hashPassword(password) !== ADMIN_PASSWORD_HASH) {
        errorMsg.textContent = 'Admin password is incorrect.';
        return;
    }

    if (users[email]) {
        errorMsg.textContent = 'User already exists. Please login.';
        return;
    }

    users[email] = {
        password: hashPassword(password),
        receipts: [],
        createdAt: new Date().toISOString()
    };

    saveUsers(users);
    
    // Notify Google Sheets to create recipient section
    notifyGoogleSheet(email);
    
    errorMsg.textContent = '';
    
    // Auto-login after registration
    sessionStorage.setItem(SESSION_KEY, email);
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    }
    
    // Check if there's a pending receipt from QR scan
    const pendingReceiptId = sessionStorage.getItem('pendingReceiptId');
    if (pendingReceiptId) {
        sessionStorage.removeItem('pendingReceiptId');
        window.location.href = `verify.html?id=${pendingReceiptId}`;
        return;
    }
    
    alert('Registration successful! Redirecting to dashboard...');
    showDashboard(email);
}

async function notifyGoogleSheet(email) {
    const SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbyIekZfn_WnbZrj7NV3wofBF5YhIAx5E1yev_tVzb1mGRvmifLqDqdrg0eUwT7zZyhRFg/exec";
    try {
        await fetch(SHEET_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        console.log('Recipient section created in Google Sheet');
    } catch (error) {
        console.warn('Could not create section in Google Sheet:', error);
    }
}

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    if (!email || !password) {
        errorMsg.textContent = '❌ Please enter email and password';
        return;
    }

    // Check for account lockout due to too many failed attempts
    const attemptStatus = recordLoginAttempt(email);
    if (attemptStatus.locked) {
        const minutes = Math.ceil(attemptStatus.remainingTime / 60);
        errorMsg.textContent = `🔒 Too many failed attempts. Account locked for ${minutes} minute(s).`;
        return;
    }

    const users = getUsers();

    if (!users[email]) {
        errorMsg.textContent = '❌ User not found. Please register.';
        return;
    }

    if (users[email].password !== hashPassword(password)) {
        errorMsg.textContent = `❌ Invalid password. ${attemptStatus.attemptsLeft} attempt(s) remaining.`;
        return;
    }

    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && hashPassword(password) !== ADMIN_PASSWORD_HASH) {
        errorMsg.textContent = '❌ Admin password is incorrect.';
        return;
    }

    // Clear failed login attempts on successful login
    clearLoginAttempts(email);

    // Create session with timestamp
    const sessionData = {
        user: email,
        createdAt: Date.now(),
        lastActivity: Date.now()
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    } else {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        localStorage.removeItem(ADMIN_SESSION_KEY);
    }
    
    // Ensure recipient section exists in Google Sheet
    notifyGoogleSheet(email);
    
    // Check if there's a pending receipt from QR scan
    const pendingReceiptId = sessionStorage.getItem('pendingReceiptId');
    if (pendingReceiptId) {
        sessionStorage.removeItem('pendingReceiptId');
        window.location.href = `verify.html?id=${pendingReceiptId}`;
        return;
    }
    
    showDashboard(email);
}

function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    location.reload();
}

function getCurrentUser() {
    try {
        const sessionData = sessionStorage.getItem(SESSION_KEY);
        if (!sessionData) return null;
        
        // Handle both old (string) and new (JSON) formats
        if (sessionData.startsWith('{')) {
            const session = JSON.parse(sessionData);
            return session.user || null;
        }
        return sessionData; // Legacy string format
    } catch (e) {
        return null;
    }
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function isAdminSession() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true' || localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

function adminLogin() {
    const emailEl = document.getElementById('adminEmail');
    const passwordEl = document.getElementById('adminPassword');
    const errorEl = document.getElementById('adminError');

    const email = emailEl ? emailEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';

    if (!email || !password) {
        if (errorEl) errorEl.textContent = '❌ Please enter admin email and password';
        return;
    }

    // Check for account lockout
    const attemptStatus = recordLoginAttempt(email);
    if (attemptStatus.locked) {
        const minutes = Math.ceil(attemptStatus.remainingTime / 60);
        if (errorEl) errorEl.textContent = `🔒 Too many failed attempts. Account locked for ${minutes} minute(s).`;
        return;
    }

    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        if (errorEl) errorEl.textContent = '❌ Admin email is incorrect';
        return;
    }

    if (hashPassword(password) !== ADMIN_PASSWORD_HASH) {
        if (errorEl) errorEl.textContent = `❌ Admin password is incorrect. ${attemptStatus.attemptsLeft} attempt(s) remaining.`;
        return;
    }

    // Clear failed attempts on successful login
    clearLoginAttempts(email);

    const sessionData = {
        user: email,
        createdAt: Date.now(),
        lastActivity: Date.now()
    };
    
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    
    if (errorEl) errorEl.textContent = '✅ Login successful! Redirecting...';
    setTimeout(() => {
        window.location.href = 'admin.html';
    }, 500);
}

function showDashboard(email) {
    const loginBox = document.getElementById('loginBox');
    const dashboard = document.getElementById('dashboard');
    const userEmailEl = document.getElementById('userEmail');

    if (!loginBox || !dashboard || !userEmailEl) {
        return;
    }

    loginBox.style.display = 'none';
    dashboard.style.display = 'block';
    userEmailEl.textContent = email;
    loadUserReceipts(email);
}

function addReceiptToUser(email, receiptId, receiptData) {
    const users = getUsers();
    if (users[email]) {
        if (!users[email].receipts.includes(receiptId)) {
            users[email].receipts.push(receiptId);
            saveUsers(users);
            return true;
        }
    }
    return false;
}

// Check if user is logged in on page load
window.addEventListener('DOMContentLoaded', () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
        if (currentUser.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            const users = getUsers();
            if (users[currentUser] && users[currentUser].password === ADMIN_PASSWORD_HASH) {
                sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
                localStorage.setItem(ADMIN_SESSION_KEY, 'true');
            }
        }

        const loginBox = document.getElementById('loginBox');
        const dashboard = document.getElementById('dashboard');
        if (loginBox && dashboard) {
            showDashboard(currentUser);
        }
    }
});
