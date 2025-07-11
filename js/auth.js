// frontend/js/auth.js (Master Authentication Script)

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    // यह IDs आपके सभी HTML पेजों के हेडर में होनी चाहिए
    const accountLink = document.getElementById('account-link');
    const logoutBtn = document.getElementById('logout-btn');

    // --- Main Functions ---
    function updateUserHeader() {
        if (!accountLink || !logoutBtn) {
            console.error('Header elements (account-link or logout-btn) not found!');
            return;
        }

        const userInfoString = localStorage.getItem('userInfo');

        if (userInfoString) {
            try {
                const userInfo = JSON.parse(userInfoString);
                if (userInfo && userInfo.token) {
                    // --- User is Logged In ---
                    const userName = userInfo.name ? userInfo.name.split(' ')[0] : 'User';
                    
                    accountLink.innerHTML = `<i class="fa fa-user"></i><span>${userName}</span>`;
                    
                    if (userInfo.role === 'admin' || userInfo.role === 'vendor') {
                        accountLink.href = 'dashboard.html';
                    } else {
                        accountLink.href = 'profile.html';
                    }
                    
                    logoutBtn.style.display = 'inline-block'; // लॉग-आउट बटन दिखाएँ
                    return;
                }
            } catch (e) {
                console.error("Corrupted user info in localStorage:", e);
                localStorage.removeItem('userInfo'); // खराब डेटा को हटा दें
            }
        }

        // --- User is Logged Out ---
        accountLink.innerHTML = `<i class="fa fa-user-circle"></i><span>Login / Register</span>`;
        accountLink.href = 'login.html';
        logoutBtn.style.display = 'none'; // लॉग-आउट बटन छिपाएँ
    }

    function handleLogout() {
        if (confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('userInfo');
            localStorage.removeItem('cart'); // कार्ट भी साफ़ कर दें
            alert('You have been logged out.');
            window.location.href = 'index.html';
        }
    }

    // --- Event Listeners ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // --- Initial Load ---
    updateUserHeader();
});
