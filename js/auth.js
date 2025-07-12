// Universal Authentication Script (auth.js)
document.addEventListener('DOMContentLoaded', () => {
    const accountLink = document.getElementById('account-link');
    const logoutBtn = document.getElementById('logout-btn');

    function updateUserHeader() {
        if (!accountLink) return; // अगर एलिमेंट नहीं है तो कुछ न करें

        const userInfoString = localStorage.getItem('userInfo');
        if (userInfoString) {
            try {
                const userInfo = JSON.parse(userInfoString);
                if (userInfo && userInfo.token) {
                    // --- User is Logged In ---
                    const userName = userInfo.name ? userInfo.name.split(' ')[0] : 'User';
                    accountLink.innerHTML = `<i class="fa fa-user"></i><span>Hi, ${userName}</span>`;
                    accountLink.href = (userInfo.role === 'admin' || userInfo.role === 'vendor') ? 'dashboard.html' : 'profile.html';
                    
                    if (logoutBtn) logoutBtn.style.display = 'inline-block';
                    return;
                }
            } catch (e) {
                localStorage.removeItem('userInfo');
            }
        }
        // --- User is Logged Out ---
        accountLink.innerHTML = `<i class="fa fa-user-circle"></i><span>Login</span>`;
        accountLink.href = 'login.html';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }

    function handleLogout() {
        if (confirm('Are you sure you want to log out?')) {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    updateUserHeader();
});
