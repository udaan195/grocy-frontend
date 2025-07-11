document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & Elements ---
    const API_BASE_URL = 'https://grocy-backend.onrender.com';
    const productListDiv = document.getElementById('product-list');
    const searchForm = document.querySelector('.search-bar');
    const searchInput = document.querySelector('.search-bar input');
    const categoriesDiv = document.querySelector('.categories');
    
    // Cart Popup Elements
    const cartPopup = document.getElementById('cart-popup');
    const cartIconBtn = document.getElementById('cart-icon-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    // --- State Variables ---
    let allProducts = []; // सभी प्रोडक्ट्स की एक मास्टर लिस्ट
    let cart = JSON.parse(localStorage.getItem('cart')) || []; 

    // --- Main Functions ---

    // 1. सर्वर से सभी प्रोडक्ट्स लाना
    async function fetchAllProducts() {
        if (!productListDiv) return;
        productListDiv.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
        try {
            const response = await fetch(`${API_BASE_URL}/api/products`);
            if (!response.ok) throw new Error('Could not load products');
            allProducts = await response.json();
            renderProducts(allProducts);
        } catch (error) {
            productListDiv.innerHTML = '<p>Could not load products. Please try again later.</p>';
        }
    }

    // 2. प्रोडक्ट्स को पेज पर दिखाना
    function renderProducts(productsToRender) {
        if (!productListDiv) return;
        productListDiv.innerHTML = '';
        if (productsToRender.length === 0) {
            productListDiv.innerHTML = '<p>No products found for this selection.</p>';
            return;
        }
        productsToRender.forEach(product => {
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
                <button class="add-to-cart-btn" data-product-id="${product._id}">Add to Cart</button>
            `;
            productListDiv.appendChild(card);
        });
    }

    // 3. कार्ट को अपडेट और सेव करना
    function updateCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }

    // 4. कार्ट पॉपअप को दिखाना (Render Cart)
    function renderCart() {
        if (!cartItemsDiv || allProducts.length === 0) return;
        cartItemsDiv.innerHTML = '';
        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p style="text-align:center; color:#777;">Your cart is empty.</p>';
        } else {
            cart.forEach(cartItem => {
                const product = allProducts.find(p => p._id === cartItem.productId);
                if (product) {
                    const cartItemElement = document.createElement('div');
                    cartItemElement.className = 'cart-item';
                    // --- FIX: कार्ट पॉपअप में Quantity (+/-) बटन्स जोड़े गए ---
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

    // 6. कार्ट में क्वांटिटी बदलना
    function handleCartQuantityChange(productId, change) {
        const cartItem = cart.find(item => item.productId === productId);
        if (cartItem) {
            cartItem.quantity += change;
            if (cartItem.quantity <= 0) {
                cart = cart.filter(item => item.productId !== productId);
            }
            updateCart();
        }
    }
    
    // 7. सर्च और फ़िल्टर का लॉजिक
    function filterAndRenderProducts() {
        if(!searchInput || !categoriesDiv) return;
        const keyword = searchInput.value.toLowerCase().trim();
        const activeCategoryElement = categoriesDiv.querySelector('a.active');
        const category = activeCategoryElement ? activeCategoryElement.textContent : 'All';
        
        const filteredProducts = allProducts.filter(product => {
            const matchesKeyword = product.name.toLowerCase().includes(keyword);
            // --- FIX: कैटेगरी को case-insensitive बनाया गया ---
            const matchesCategory = (category === 'All' || product.category.toLowerCase() === category.toLowerCase());
            return matchesKeyword && matchesCategory;
        });
        
        renderProducts(filteredProducts);
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
        
        // --- FIX: कार्ट पॉपअप में +/- बटन के लिए नया Event Listener ---
        if (cartItemsDiv) {
            cartItemsDiv.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                if (!productId) return;
                if (e.target.classList.contains('btn-increase')) handleCartQuantityChange(productId, 1);
                if (e.target.classList.contains('btn-decrease')) handleCartQuantityChange(productId, -1);
            });
        }
        
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
        
        if (cartIconBtn) cartIconBtn.addEventListener('click', () => { if (cartPopup) cartPopup.classList.add('open'); });
        if (closeCartBtn) closeCartBtn.addEventListener('click', () => { if (cartPopup) cartPopup.classList.remove('open'); });

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (localStorage.getItem('userInfo')) {
                    if (cart.length > 0) {
                        window.location.href = 'checkout.html';
                    } else { alert('Your cart is empty!'); }
                } else {
                    alert('Please login to proceed to checkout.');
                    window.location.href = 'login.html';
                }
            });
        }
    }

    // --- Initial Page Load Function ---
    async function init() {
        await fetchAllProducts();
        renderCart();
        setupEventListeners();
    }
    
    init();
});

