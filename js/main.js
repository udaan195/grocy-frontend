document.addEventListener('DOMContentLoaded', () => {
    // --- 1. सभी ज़रूरी एलिमेंट्स को पकड़ना ---
    const API_BASE_URL = 'https://grocy-backend.onrender.com';
    const productListDiv = document.getElementById('product-list');
    const searchForm = document.querySelector('.search-bar');
    const searchInput = document.querySelector('.search-bar input');
    const categoriesDiv = document.querySelector('.categories');
    const cartPopup = document.getElementById('cart-popup');
    const cartIconBtn = document.getElementById('cart-icon-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const accountLink = document.querySelector('a.header-icon');

    // --- 2. वेरिएबल्स ---
    let productsData = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // --- 3. सभी फंक्शन्स ---

    function updateUserHeader() {
        if (!accountLink) return;
        const userInfoString = localStorage.getItem('userInfo');

        if (userInfoString) {
            try {
                const userInfo = JSON.parse(userInfoString);
                if (userInfo && userInfo.token) {
                    const userName = userInfo.name ? userInfo.name.split(' ')[0] : 'User';
                    accountLink.innerHTML = `<i class="fa fa-user"></i><span>${userName}</span>`;
                    accountLink.href = 'profile.html';
                    return; // फंक्शन को यहीं रोक दें
                }
            } catch (e) {
                console.error("Error parsing userInfo:", e);
                localStorage.removeItem('userInfo'); // खराब डेटा को हटा दें
            }
        }
        // अगर ऊपर कुछ भी काम नहीं किया, तो लॉग-आउट दिखाएँ
        accountLink.innerHTML = `<i class="fa fa-user-circle"></i><span>Account</span>`;
        accountLink.href = 'login.html';
    }

    const fetchProducts = async (keyword = '', category = 'All') => {
        if (!productListDiv) return;
        productListDiv.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
        try {
            let url = `${API_BASE_URL}/api/products?keyword=${keyword}`;
            if (category && category !== 'All') {
                url += `&category=${category}`;
            }
            const response = await fetch(url);
            if (!response.ok) throw new Error('Could not load products');
            productsData = await response.json();
            renderProducts();
        } catch (error) {
            productListDiv.innerHTML = '<p>Could not load products. Please try again later.</p>';
        }
    };

    function renderProducts() {
        if (!productListDiv) return;
        productListDiv.innerHTML = '';
        if (!productsData || productsData.length === 0) {
            productListDiv.innerHTML = '<p>No products found.</p>';
            return;
        }
        productsData.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
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
                <button data-product-id="${product._id}">Add to Cart</button>
            `;
            productListDiv.appendChild(card);
        });
    }

    function updateCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }

    function renderCart() {
        if (!cartItemsDiv) return;
        cartItemsDiv.innerHTML = '';
        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p style="text-align:center; color:#777;">Your cart is empty.</p>';
        } else {
            cart.forEach(cartItem => {
                const product = productsData.find(p => p._id === cartItem.productId);
                if (product) {
                    const cartItemElement = document.createElement('div');
                    cartItemElement.className = 'cart-item';
                    cartItemElement.innerHTML = `
                        <span class="cart-item-name">${product.name}</span>
                        <div class="cart-item-controls">
                            <button class="btn-decrease" data-product-id="${product._id}">-</button>
                            <span class="cart-item-quantity">${cartItem.quantity}</span>
                            <button class="btn-increase" data-product-id="${product._id}">+</button>
                            <span class="cart-item-price">₹${(product.price * cartItem.quantity).toFixed(2)}</span>
                        </div>`;
                    cartItemsDiv.appendChild(cartItemElement);
                }
            });
        }
        const total = cart.reduce((sum, item) => {
            const product = productsData.find(p => p._id === item.productId);
            return sum + (product ? product.price * item.quantity : 0);
        }, 0);
        cartTotalSpan.innerText = total.toFixed(2);
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

    function handleCartQuantityChange(productId, change) {
        const cartItem = cart.find(item => item.productId === productId);
        if (!cartItem) return;

        if (change === -1) {
            cartItem.quantity--;
            if (cartItem.quantity <= 0) {
                cart = cart.filter(item => item.productId !== productId);
            }
        } else if (change === 1) {
            cartItem.quantity++;
        }
        updateCart();
    }

    // --- 4. सभी इवेंट लिस्नर्स ---
    if (productListDiv) {
        productListDiv.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                addToCart(e.target.dataset.productId);
            }
        });
    }
    if (cartItemsDiv) {
        cartItemsDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-increase')) {
                handleCartQuantityChange(e.target.dataset.productId, 1);
            } else if (e.target.classList.contains('btn-decrease')) {
                handleCartQuantityChange(e.target.dataset.productId, -1);
            }
        });
    }
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const activeCategory = document.querySelector('.categories a.active')?.textContent || 'All';
            fetchProducts(searchInput.value, activeCategory);
        });
    }
    if (categoriesDiv) {
        categoriesDiv.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                e.preventDefault();
                document.querySelectorAll('.categories a').forEach(a => a.classList.remove('active'));
                e.target.classList.add('active');
                fetchProducts('', e.target.textContent);
            }
        });
    }
    if (cartIconBtn) cartIconBtn.addEventListener('click', () => cartPopup.classList.add('open'));
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => cartPopup.classList.remove('open'));
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (localStorage.getItem('userInfo')) {
                if (cart.length > 0) {
                    window.location.href = 'checkout.html';
                } else {
                    alert('Your cart is empty!');
                }
            } else {
                alert('Please login to proceed to checkout.');
                window.location.href = 'login.html';
            }
        });
    }

    // --- 5. शुरुआती लोड ---
    updateUserHeader();
    fetchProducts();
    renderCart(); // कार्ट को पेज लोड पर भी रेंडर करें
});
