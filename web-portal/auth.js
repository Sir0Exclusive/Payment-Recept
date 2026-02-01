// Authentication System using localStorage (client-side for GitHub Pages)
// In production, use a proper backend with encrypted storage

const AUTH_KEY = 'payment_receipts_users';
const SESSION_KEY = 'payment_receipts_session';

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

function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    if (!email || !password) {
        errorMsg.textContent = 'Please enter email and password';
        return;
    }

    const users = getUsers();

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
    errorMsg.textContent = '';
    alert('Registration successful! Please login.');
}

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    if (!email || !password) {
        errorMsg.textContent = 'Please enter email and password';
        return;
    }

    const users = getUsers();

    if (!users[email]) {
        errorMsg.textContent = 'User not found. Please register.';
        return;
    }

    if (users[email].password !== hashPassword(password)) {
        errorMsg.textContent = 'Invalid password';
        return;
    }

    // Create session
    sessionStorage.setItem(SESSION_KEY, email);
    showDashboard(email);
}

function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
}

function getCurrentUser() {
    return sessionStorage.getItem(SESSION_KEY);
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function showDashboard(email) {
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('userEmail').textContent = email;
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
        showDashboard(currentUser);
    }
});
