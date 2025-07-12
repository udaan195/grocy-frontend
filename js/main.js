// frontend/js/main.js (Final Code with Race Condition Fix)

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & Elements ---
    const API_BASE_URL = 'https://grocy-backend.onrender.com';
    const productListDiv = document.getElementById('product-list');
    const cartPopup = document.getElementById('cart-popup');
    const cartIconBtn = document.getElementById('cart-icon-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    // --- State Variables ---
    let allProducts = []; // सभी प्रोडक्ट्स की एक मास्टर लिस्ट यहीं सेव होगी
    let cart = JSON.parse(localStorage.getItem('cart')) || []; 

    // --- Main Functions ---

    // 1. सर्वर से सभी प्रोडक्ट्स लाना
    async function fetchAllProducts() {
        if (!productListDiv) return;
        productListDiv.innerHTML = '<p>Loading products...</p>';
        try {
            const response = await fetch(`${API_BASE_URL}/api/products`);
            if (!response.ok) throw new Error('Could not load products');
            allProducts = await response.json(); // मास्टर लिस्ट को भरें
            renderProducts(allProducts);
        } catch (error) {
            productListDiv.innerHTML = '<p>Could not load products. Please try again later.</p>';
        }
    }

    // 2. प्रोडक्ट्स को पेज पर दिखाना
    function renderProducts(productsToRender) {
        if (!productListDiv) return;
        productListDiv.innerHTML = '';
        productsToRender.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <a href="product.html?id=${product._id}" class="product-link">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p class="price">₹${product.price}</p>
                    </div>
                </a>
                <button class="add-to-cart-btn" data-product-id="${product._id}">Add to Cart</button>
            `;
            productListDiv.appendChild(card);
        });
    }

    // 3. कार्ट को अपडेट और सेव करना
    function updateCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart(); // कार्ट को दोबारा दिखाएँ
    }

    // 4. कार्ट पॉपअप को दिखाना (Render Cart)
    function renderCart() {
        if (!cartItemsDiv) return;
        cartItemsDiv.innerHTML = '';
        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
        } else {
            cart.forEach(cartItem => {
                // allProducts की मास्टर लिस्ट में से प्रोडक्ट की पूरी जानकारी निकालें
                const product = allProducts.find(p => p._id === cartItem.productId);
                if (product) { // अगर प्रोडक्ट की जानकारी मिल गई है, तभी उसे दिखाएँ
                    const cartItemElement = document.createElement('div');
                    cartItemElement.className = 'cart-item';
                    cartItemElement.innerHTML = `
                        <span class="cart-item-name">${product.name}</span>
                        <div class="cart-item-controls">
                            <button class="btn-decrease" data-product-id="${product._id}">-</button>
                            <span class="cart-item-quantity">${cartItem.quantity}</span>
                            <button class="btn-increase" data-product-id="${product._id}">+</button>
                        </div>
                    `;
                    cartItemsDiv.appendChild(cartItemElement);
                }
            });
        }
        const total = cart.reduce((sum, item) => {
            const product = allProducts.find(p => p._id === item.productId);
            return sum + (product ? product.price * item.quantity : 0);
        }, 0);
        if(cartTotalSpan) cartTotalSpan.innerText = total.toFixed(2);
    }
    
    // 5. कार्ट में आइटम जोड़ना
    function addToCart(productId) {
        const existingItem = cart.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ productId: productId, quantity: 1 });
        }
        updateCart();
    }
    
    // --- Event Listeners Setup ---
    function setupEventListeners() {
        if (productListDiv) {
            productListDiv.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-to-cart-btn')) {
                    addToCart(e.target.dataset.productId);
                }
            });
        }
        // ... बाकी के event listeners जैसे search, category filter, cart +/- buttons ...
        if (cartIconBtn) cartIconBtn.addEventListener('click', () => cartPopup.classList.add('open'));
        if (closeCartBtn) closeCartBtn.addEventListener('click', () => cartPopup.classList.remove('open'));
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (localStorage.getItem('userInfo')) {
                    if (cart.length > 0) {
                        window.location.href = 'checkout.html';
                    } else { alert('Your cart is empty!'); }
                } else {
                    alert('Please login to proceed.');
                    window.location.href = 'login.html';
                }
            });
        }
    }

    // --- FIX: Initial Page Load Function ---
    async function init() {
        // Step 1: पहले प्रोडक्ट्स की पूरी लिस्ट आने का इंतज़ार करें
        await fetchAllProducts();
        
        // Step 2: अब जब प्रोडक्ट्स आ चुके हैं, तब कार्ट को सही से दिखाएँ
        renderCart();

        // Step 3: अब सभी बटन्स के Event Listeners सेट करें
        setupEventListeners();
    }
    
    // पेज लोड होने पर मुख्य फंक्शन चलाएँ
    init();
});
