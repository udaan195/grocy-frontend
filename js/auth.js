// frontend/js/auth.js (Universal Authentication Script)
document.addEventListener('DOMContentLoaded', () => {
    // हेडर के एलिमेंट्स जो हर पेज पर होंगे
    const accountLink = document.getElementById('account-link');
    const logoutBtn = document.getElementById('logout-btn'); // यह बटन अब प्रोफाइल और डैशबोर्ड पेज के अंदर होगा

    // 1. हेडर को अपडेट करने का फंक्शन
    function updateUserHeader() {
        if (!accountLink) return;

        const userInfoString = localStorage.getItem('userInfo');
        if (userInfoString) {
            try {
                const userInfo = JSON.parse(userInfoString);
                if (userInfo && userInfo.token) {
                    // --- यूज़र लॉग-इन है ---
                    const userName = userInfo.name ? userInfo.name.split(' ')[0] : 'User';
                    accountLink.innerHTML = `<i class="fa fa-user"></i><span>Hi, ${userName}</span>`;
                    
                    // रोल के हिसाब से सही पेज का लिंक दें
                    if (userInfo.role === 'admin' || userInfo.role === 'vendor') {
                        accountLink.href = 'dashboard.html';
                    } else {
                        accountLink.href = 'profile.html';
                    }
                    return; // यहाँ काम खत्म
                }
            } catch (e) {
                // अगर userInfo में कोई गड़बड़ है, तो उसे हटा दें
                localStorage.removeItem('userInfo');
            }
        }
        
        // --- यूज़र लॉग-आउट है ---
        accountLink.innerHTML = `<i class="fa fa-user-circle"></i><span>Login / Register</span>`;
        accountLink.href = 'login.html';
    }

    // 2. लॉग-आउट करने का फंक्शन
    function handleLogout() {
        if (confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('userInfo');
            localStorage.removeItem('cart');
            alert('You have been logged out.');
            window.location.href = 'index.html';
        }
    }

    // 3. अगर पेज पर लॉग-आउट बटन है, तो उस पर क्लिक का लॉजिक जोड़ें
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // 4. पेज लोड होते ही हेडर को अपडेट करें
    updateUserHeader();
});
