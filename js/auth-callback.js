// frontend/js/auth-callback.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth Callback Page Loaded');
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    console.log('Token from URL:', token);

    if (token) {
        console.log('Token found, saving to localStorage...');
        // सीधे टोकन और बेसिक जानकारी सेव करें
        localStorage.setItem('userInfo', JSON.stringify({ token: token }));
        console.log('Saved to localStorage. Redirecting to index.html...');
        window.location.href = 'index.html';
    } else {
        console.error('FATAL: No token found in URL after Google callback.');
        alert('Authentication failed. Token not received.');
        window.location.href = 'login.html';
    }
});
