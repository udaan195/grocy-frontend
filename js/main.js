// FINAL AND DEFENSIVE main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_BASE_URL = 'https://grocy-backend.onrender.com';

    // --- DOM Elements ---
    const accountLink = document.getElementById('account-link');
    const logoutBtn = document.getElementById('logout-btn');
    const productListDiv = document.getElementById('product-list');
    const cartPopup = document.getElementById('cart-popup');
    const cartIconBtn = document.getElementById('cart-icon-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const searchForm = document.querySelector('.search-bar');
    const searchInput = document.querySelector('.search-bar input');
    const categoriesDiv = document.querySelector('.categories');

    // --- State Variables ---
    let allProducts = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // --- AUTHENTICATION & HEADER LOGIC ---
    function updateUserHeader() {
        if (!accountLink) return; // Defensive Check

        const userInfoString = localStorage.getItem('userInfo');
        if (userInfoString) {
            try {
                const userInfo = JSON.parse(userInfoString);
                if (userInfo && userInfo.token) {
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
        accountLink.innerHTML = `<i class="fa fa-user-circle"></i><span>Login</span>`;
        accountLink.href = 'login.html';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }

    function handleLogout() {
        if (confirm('Are you sure you want to log out?')) {
            localStorage.clear(); // सब कुछ साफ़ कर दें
            window.location.href = 'index.html';
        }
    }

    // --- PRODUCT & CART LOGIC ---
    async function fetchAllProducts() {
        if (!productListDiv) return;
        productListDiv.innerHTML = '<p>Loading products...</p>';
        try {
            const response = await fetch(`${API_BASE_URL}/api/products`);
            if (!response.ok) throw new Error('Could not load products');
            allProducts = await response.json();
            renderProducts(allProducts);
        } catch (error) {
            productListDiv.innerHTML = '<p>Could not load products.</p>';
        }
    }

    function renderProducts(productsToRender) {
        if (!productListDiv) return;
        productListDiv.innerHTML = '';
        productsToRender.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <a href="product.html?id=${product._id}" class="product-link">
                    <div class="product-image-container"><img src="${product.image}" alt="${product.name}" class="product-image"></div>
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

    function renderCart() {
        if (!cartItemsDiv || !allProducts) return;
        cartItemsDiv.innerHTML = '';
        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
        } else {
            cart.forEach(cartItem => {
                const product = allProducts.find(p => p._id === cartItem.productId);
                if (product) {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'cart-item';
                    itemElement.innerHTML = `<span>${product.name} (x${cartItem.quantity})</span><span>₹${(product.price * cartItem.quantity).toFixed(2)}</span>`;
                    cartItemsDiv.appendChild(itemElement);
                }
            });
        }
        const total = cart.reduce((sum, item) => {
            const product = allProducts.find(p => p._id === item.productId);
            return sum + (product ? product.price * item.quantity : 0);
        }, 0);
        if (cartTotalSpan) cartTotalSpan.innerText = total.toFixed(2);
    }

    function updateCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }

    function addToCart(productId) {
        const existingItem = cart.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ productId: productId, quantity: 1 });
        }
        updateCart();
    }
    
    function filterAndRenderProducts() {
        if(!searchInput || !categoriesDiv) return;
        const keyword = searchInput.value.toLowerCase().trim();
        const activeCategory = categoriesDiv.querySelector('a.active')?.textContent || 'All';
        const filteredProducts = allProducts.filter(p => 
            p.name.toLowerCase().includes(keyword) && 
            (activeCategory === 'All' || p.category === activeCategory)
        );
        renderProducts(filteredProducts);
    }
    
    // --- EVENT LISTENERS SETUP ---
    function setupEventListeners() {
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
        if (cartIconBtn) cartIconBtn.addEventListener('click', () => { if (cartPopup) cartPopup.classList.add('open'); });
        if (closeCartBtn) closeCartBtn.addEventListener('click', () => { if (cartPopup) cartPopup.classList.remove('open'); });
        if (productListDiv) productListDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) addToCart(e.target.dataset.productId);
        });
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => { e.preventDefault(); filterAndRenderProducts(); });
            searchInput.addEventListener('keyup', filterAndRenderProducts);
        }
        if (categoriesDiv) {
            categoriesDiv.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') {
                    e.preventDefault();
                    document.querySelectorAll('.categories a').forEach(a => a.classList.remove('active'));
                    e.target.classList.add('active');
                    filterAndRenderProducts();
                }
            });
        }
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (localStorage.getItem('userInfo')) {
                    if (cart.length > 0) window.location.href = 'checkout.html';
                    else alert('Your cart is empty!');
                } else {
                    alert('Please login to proceed.');
                    window.location.href = 'login.html';
                }
            });
        }
    }

    // --- INITIAL PAGE LOAD ---
    async function init() {
        updateUserHeader();
        await fetchAllProducts();
        renderCart();
        setupEventListeners();
    }
    
    init();
});
