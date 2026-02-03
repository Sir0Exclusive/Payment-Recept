// Authentication and session management

const SESSION_KEY = 'paymentReceiptSession';
const ADMIN_EMAIL = 'sarwaroffjp@gmail.com';

function saveSession(userType, email, name) {
    const session = {
        userType: userType,
        email: email,
        name: name,
        timestamp: new Date().getTime()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function getSession() {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    
    try {
        return JSON.parse(sessionStr);
    } catch {
        return null;
    }
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

function isLoggedIn() {
    const session = getSession();
    if (!session) return false;
    
    // Check if session expired (24 hours for recipients, 30 min for admin)
    const now = new Date().getTime();
    const maxAge = session.userType === 'admin' ? 30 * 60 * 1000 : 24 * 60 * 60 * 1000;
    
    if (now - session.timestamp > maxAge) {
        clearSession();
        return false;
    }
    
    return true;
}

function requireAuth(userType) {
    if (!isLoggedIn()) {
        window.location.href = userType === 'admin' ? 'admin-login.html' : 'recipient-login.html';
        return false;
    }
    
    const session = getSession();
    if (session.userType !== userType) {
        clearSession();
        window.location.href = userType === 'admin' ? 'admin-login.html' : 'recipient-login.html';
        return false;
    }
    
    return true;
}

function logout() {
    clearSession();
    window.location.href = 'index.html';
}
