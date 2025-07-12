// MASTER JAVASCRIPT FILE (script.js)

document.addEventListener('DOMContentLoaded', () => {
    // --- Universal Configuration & State ---
    const API_BASE_URL = 'https://grocy-backend.onrender.com';
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let allProducts = []; // यह मास्टर लिस्ट हर पेज पर काम आएगी

    // --- Universal Elements ---
    const accountLink = document.getElementById('account-link');
    const logoutBtn = document.getElementById('logout-btn');

    // ===================================================================
    // 1. UNIVERSAL AUTH & HEADER LOGIC (यह हर पेज पर चलेगा)
    // ===================================================================
    function updateUserHeader() {
        if (!accountLink) return;
        if (userInfo && userInfo.token) {
            const userName = userInfo.name ? userInfo.name.split(' ')[0] : 'User';
            accountLink.innerHTML = `<i class="fa fa-user"></i><span>Hi, ${userName}</span>`;
            if (userInfo.role === 'admin' || userInfo.role === 'vendor') {
                accountLink.href = 'dashboard.html';
            } else {
                accountLink.href = 'profile.html';
            }
            if (logoutBtn) logoutBtn.style.display = 'block';
        } else {
            accountLink.innerHTML = `<i class="fa fa-user-circle"></i><span>Login</span>`;
            accountLink.href = 'login.html';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }

    function handleLogout() {
        if (confirm('Are you sure you want to log out?')) {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    }
    
    // Attach logout listener if the button exists on the page
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // हर पेज पर हेडर को अपडेट करें
    updateUserHeader();


    // ===================================================================
    // 2. HOME PAGE LOGIC (यह सिर्फ index.html पर चलेगा)
    // ===================================================================
    const productListDiv = document.getElementById('product-list');
    if (productListDiv) {
        const cartIconBtn = document.getElementById('cart-icon-btn');
        const cartPopup = document.getElementById('cart-popup');
        const closeCartBtn = document.getElementById('close-cart-btn');
        const cartItemsDiv = document.getElementById('cart-items');
        const cartTotalSpan = document.getElementById('cart-total');
        const checkoutBtn = document.getElementById('checkout-btn');

        async function fetchAllProducts() {
            productListDiv.innerHTML = '<p>Loading products...</p>';
            try {
                const response = await fetch(`${API_BASE_URL}/api/products`);
                allProducts = await response.json();
                renderProducts(allProducts);
            } catch (error) {
                productListDiv.innerHTML = '<p>Could not load products.</p>';
            }
        }

        function renderProducts(products) {
            productListDiv.innerHTML = '';
            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <a href="product.html?id=${product._id}"><img src="${product.image}" alt="${product.name}"></a>
                    <h3>${product.name}</h3><p>₹${product.price}</p>
                    <button class="add-to-cart-btn" data-product-id="${product._id}">Add to Cart</button>`;
                productListDiv.appendChild(card);
            });
        }
        
        function renderCart() {
            if (!cartItemsDiv) return;
            cartItemsDiv.innerHTML = '';
            let total = 0;
            if (cart.length > 0 && allProducts.length > 0) {
                cart.forEach(cartItem => {
                    const product = allProducts.find(p => p._id === cartItem.productId);
                    if (product) {
                        total += product.price * cartItem.quantity;
                        const itemElement = document.createElement('div');
                        itemElement.className = 'cart-item';
                        itemElement.innerHTML = `<span>${product.name} (x${cartItem.quantity})</span>`;
                        cartItemsDiv.appendChild(itemElement);
                    }
                });
            }
            if (cart.length === 0) {
                cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
            }
            if(cartTotalSpan) cartTotalSpan.innerText = total.toFixed(2);
        }

        function addToCart(productId) {
            const existingItem = cart.find(item => item.productId === productId);
            if (existingItem) existingItem.quantity++;
            else cart.push({ productId, quantity: 1 });
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart();
        }

        async function initHomePage() {
            await fetchAllProducts();
            renderCart();
            if (productListDiv) productListDiv.addEventListener('click', e => {
                if(e.target.classList.contains('add-to-cart-btn')) addToCart(e.target.dataset.productId);
            });
            if (cartIconBtn) cartIconBtn.addEventListener('click', () => cartPopup.classList.add('open'));
            if (closeCartBtn) closeCartBtn.addEventListener('click', () => cartPopup.classList.remove('open'));
            if (checkoutBtn) checkoutBtn.addEventListener('click', () => {
                if (cart.length > 0) window.location.href = 'checkout.html';
                else alert('Your cart is empty.');
            });
        }
        
        initHomePage();
    }
    
    // ===================================================================
    // 3. CHECKOUT PAGE LOGIC (यह सिर्फ checkout.html पर चलेगा)
    // ===================================================================
    const shippingForm = document.getElementById('shipping-form');
    if(shippingForm) {
        const useLocationBtn = document.getElementById('use-location-btn');
        async function initializeCheckout() {
            // ... (यहाँ आपका पूरा checkout का लॉजिक आएगा) ...
            // यह सुनिश्चित करेगा कि कार्ट से प्रोडक्ट्स की जानकारी सर्वर से दोबारा ली जाए
            // ताकि कोई "Product not found" एरर न आए
        }

        if(useLocationBtn) {
            useLocationBtn.addEventListener('click', () => {
                // ... Geolocation का लॉजिक ...
            });
        }
        
        shippingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // ... ऑर्डर प्लेस करने का लॉजिक ...
        });

        initializeCheckout();
    }

});
