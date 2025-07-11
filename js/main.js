document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_BASE_URL = 'https://grocy-backend.onrender.com';

    // --- DOM Elements ---
    const productListDiv = document.getElementById('product-list');
    const searchForm = document.querySelector('.search-bar');
    const searchInput = document.querySelector('.search-bar input');
    const categoriesDiv = document.querySelector('.categories');
    
    // --- Header Elements ---
    const accountLink = document.getElementById('account-link'); // **HTML में id="account-link" दें**
    const logoutBtn = document.getElementById('logout-btn');     // **HTML में id="logout-btn" दें**

    // --- Main Functions ---

    function updateUserHeader() {
        const userInfoString = localStorage.getItem('userInfo');

        if (userInfoString) {
            try {
                const userInfo = JSON.parse(userInfoString);
                if (userInfo && userInfo.token) {
                    // --- User is Logged In ---
                    const userName = userInfo.name ? userInfo.name.split(' ')[0] : 'User';
                    let userRole = userInfo.role || 'customer';
                    
                    // हेडर में नाम और रोल दिखाएँ
                    if (accountLink) {
                        accountLink.innerHTML = `<i class="fa fa-user"></i><span>${userName} (${userRole})</span>`;
                        // रोल के हिसाब से सही पेज का लिंक दें
                        if (userRole === 'admin' || userRole === 'vendor') {
                            accountLink.href = 'dashboard.html';
                        } else {
                            accountLink.href = 'profile.html';
                        }
                    }
                    
                    // लॉग-आउट बटन दिखाएँ
                    if (logoutBtn) {
                        logoutBtn.style.display = 'block';
                    }
                    return;
                }
            } catch (e) {
                console.error("Error parsing user info:", e);
                localStorage.removeItem('userInfo');
            }
        }

        // --- User is Logged Out ---
        if (accountLink) {
            accountLink.innerHTML = `<i class="fa fa-user-circle"></i><span>Login</span>`;
            accountLink.href = 'login.html';
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
    }

    function handleLogout() {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('cart');
        alert('You have been logged out.');
        window.location.href = 'index.html';
    }

    async function fetchProducts(keyword = '', category = 'All') {
        if (!productListDiv) return;
        productListDiv.innerHTML = '<p>Loading products...</p>';
        try {
            let url = `${API_BASE_URL}/api/products?keyword=${keyword}`;
            if (category && category !== 'All') {
                url += `&category=${category}`;
            }
            const response = await fetch(url);
            if (!response.ok) throw new Error('Could not load products');
            const products = await response.json();
            renderProducts(products);
        } catch (error) {
            productListDiv.innerHTML = '<p>Could not load products.</p>';
        }
    }

    function renderProducts(products) {
        if (!productListDiv) return;
        productListDiv.innerHTML = '';
        if (products.length === 0) {
            productListDiv.innerHTML = '<p>No products found.</p>';
            return;
        }
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            // ... आपका प्रोडक्ट कार्ड का HTML ...
            productListDiv.appendChild(card);
        });
    }

    // --- Event Listeners ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (categoriesDiv) {
        categoriesDiv.addEventListener('click', (event) => {
            if (event.target.tagName === 'A') {
                event.preventDefault();
                const category = event.target.textContent;
                fetchProducts('', category);
            }
        });
    }

    // --- Initial Load ---
    updateUserHeader();
    fetchProducts();
});
