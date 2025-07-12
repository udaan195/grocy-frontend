// Home Page Script (main.js)
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://grocy-backend.onrender.com';
    const productListDiv = document.getElementById('product-list');
    const searchInput = document.querySelector('.search-bar input');
    const categoriesDiv = document.querySelector('.categories');
    const cartPopup = document.getElementById('cart-popup');
    const cartIconBtn = document.getElementById('cart-icon-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    let allProducts = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || []; 

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
        if (!productsToRender || productsToRender.length === 0) {
            productListDiv.innerHTML = '<p>No products found.</p>';
            return;
        }
        productsToRender.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            // --- FIX: इमेज और सही HTML स्ट्रक्चर ---
            card.innerHTML = `
                <a href="product.html?id=${product._id}" class="product-link">
                    <div class="product-image-container">
                        <img src="${product.image}" alt="${product.name}" class="product-image">
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p class="price">₹${product.price} ${product.unit ? `<span class="unit-text">(${product.unit})</span>` : ''}</p>
                    </div>
                </a>
                <button class="add-to-cart-btn" data-product-id="${product._id}">Add to Cart</button>
            `;
            productListDiv.appendChild(card);
        });
    }

    function renderCart() {
        if (!cartItemsDiv || allProducts.length === 0) return;
        cartItemsDiv.innerHTML = '';
        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
        } else {
            cart.forEach(cartItem => {
                const product = allProducts.find(p => p._id === cartItem.productId);
                if (product) {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'cart-item';
                    itemElement.innerHTML = `<span>${product.name} (x${cartItem.quantity})</span>`;
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
    
    function filterAndRenderProducts() {
        if(!searchInput || !categoriesDiv) return;
        const keyword = searchInput.value.toLowerCase().trim();
        const activeCategory = categoriesDiv.querySelector('a.active')?.textContent || 'All';
        
        const filteredProducts = allProducts.filter(product => {
            const matchesKeyword = product.name.toLowerCase().includes(keyword);
            const matchesCategory = (category === 'All' || product.category.toLowerCase() === category.toLowerCase());
            return matchesKeyword && matchesCategory;
        });
        
        renderProducts(filteredProducts);
    }
    
    function setupEventListeners() {
        if (productListDiv) {
            productListDiv.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-to-cart-btn')) {
                    const productId = e.target.dataset.productId;
                    const existingItem = cart.find(item => item.productId === productId);
                    if (existingItem) existingItem.quantity++;
                    else cart.push({ productId, quantity: 1 });
                    localStorage.setItem('cart', JSON.stringify(cart));
                    renderCart();
                }
            });
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
        if (cartIconBtn) cartIconBtn.addEventListener('click', () => { if (cartPopup) cartPopup.classList.add('open'); });
        if (closeCartBtn) closeCartBtn.addEventListener('click', () => { if (cartPopup) cartPopup.classList.remove('open'); });
        if (checkoutBtn) checkoutBtn.addEventListener('click', () => {
            if (localStorage.getItem('userInfo')) {
                if (cart.length > 0) window.location.href = 'checkout.html';
                else alert('Your cart is empty!');
            } else {
                alert('Please login to proceed.');
                window.location.href = 'login.html';
            }
        });
    }

    async function init() {
        await fetchAllProducts();
        renderCart();
        setupEventListeners();
    }
    
    init();
});
