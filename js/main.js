
  document.addEventListener('DOMContentLoaded', () => {
    // सबसे ऊपर यह लाइन जोड़ें
    const API_BASE_URL = 'https://grocy-backend.onrender.com'; // **यहाँ अपना Render URL डालें**
    // --- 1. सभी ज़रूरी एलिमेंट्स को पकड़ना ---
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
    
    const accountLink = document.querySelector('a.header-icon[href*="login.html"], a.header-icon[href*="profile.html"]'); 

    // --- 2. वेरिएबल्स ---
    let productsData = []; 
    let cart = []; 
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // --- 3. सभी फंक्शन्स ---

    // frontend/js/main.js के अंदर
function updateUserHeader() {
    console.log('updateUserHeader function called.');
    const accountLink = document.querySelector('a.header-icon[href*="login.html"], a.header-icon[href*="profile.html"]'); 
    if (!accountLink) {
        console.log('Account link not found.');
        return;
    }

    const userInfoString = localStorage.getItem('userInfo');
    console.log('Reading from localStorage:', userInfoString);

    if (userInfoString) {
        try {
            const userInfo = JSON.parse(userInfoString);
            if (userInfo && userInfo.token) {
                console.log('Token found in userInfo. Updating header for logged-in user.');
                const userName = userInfo.name ? userInfo.name.split(' ')[0] : 'User';
                accountLink.innerHTML = `<i class="fa fa-user"></i><span>${userName}</span>`;
                accountLink.href = 'profile.html';
                return;
            }
        } catch (e) {
            console.error('Error parsing userInfo from localStorage:', e);
        }
    }

    console.log('No valid token found. Setting header for logged-out user.');
    accountLink.innerHTML = `<i class="fa fa-user-circle"></i><span>Account</span>`;
    accountLink.href = 'login.html';
}


    // Agar upar ki koi bhi condition poori nahi hui, to user ko logged-out maanein
    accountLink.innerHTML = `<i class="fa fa-user-circle"></i><span>Account</span>`;
    accountLink.href = 'login.html';
}



   const fetchProducts = async (keyword = '', category = 'All') => {
    if(!productListDiv) return;
    productListDiv.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
    
    // User ki info aur token nikalein
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const token = userInfo ? userInfo.token : null;

    // Headers object banayein
    const headers = {
        'Content-Type': 'application/json',
    };

    // Agar token hai, to usko headers mein daalein
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        let url = `${API_BASE_URL}/api/products?keyword=${keyword}`;
        if (category && category !== 'All') {
            url += `&category=${category}`;
        }

        // fetch call mein headers ka istemal karein
        const response = await fetch(url, { headers: headers });

        if (!response.ok) throw new Error(`HTTP error!`);
        const products = await response.json();
        productsData = products;
        renderProducts();
    } catch (error) {
        productListDiv.innerHTML = '<p>Could not load products. Is the backend server running?</p>';
    }
};


    function renderProducts() {
        if(!productListDiv) return;
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
                        <p class="price">
                            ₹${product.price} 
                            ${product.unit ? `<span class="unit-text">(${product.unit})</span>` : ''}
                        </p>
                    </div>
                </a>
                <button data-product-id="${product._id}">Add to Cart</button>
            `;
            productListDiv.appendChild(card);
        });
    }

    function renderCart() {
        if(!cartItemsDiv) return;
        cartItemsDiv.innerHTML = '';
        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p style="text-align:center; color:#777;">Your cart is empty.</p>';
        } else {
            cart.forEach(cartItem => {
                const product = productsData.find(p => p._id === cartItem.productId);
                if (product) {
                    const cartItemElement = document.createElement('div');
                    cartItemElement.className = 'cart-item';
                    cartItemElement.innerHTML = `<span class="cart-item-name">${product.name} ${product.unit ? `(${product.unit})` : ''}</span><div class="cart-item-controls"><button class="btn-decrease" data-product-id="${product._id}">-</button><span class="cart-item-quantity">${cartItem.quantity}</span><button class="btn-increase" data-product-id="${product._id}">+</button><span class="cart-item-price">₹${product.price * cartItem.quantity}</span></div>`;
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
        const product = productsData.find(p => p._id === productId);
        if (!product) return;

        const minQty = product.minBuyQuantity || 1;
        const maxQty = product.maxBuyQuantity;
        const existingItem = cart.find(item => item.productId === productId);

        if (existingItem) {
            if (maxQty && (existingItem.quantity + 1) > maxQty) {
                alert(`You can only buy a maximum of ${maxQty} units of this item.`);
                return;
            }
            existingItem.quantity++;
        } else {
            if (minQty > 1) {
                alert(`This item has a minimum purchase quantity of ${minQty}. Adding ${minQty} to your cart.`);
            }
            cart.push({ productId: productId, quantity: minQty });
        }
        renderCart();
    }

    // --- 4. सभी इवेंट लिस्नर्स ---
    if(productListDiv) {
        productListDiv.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON' && event.target.hasAttribute('data-product-id')) {
                addToCart(event.target.getAttribute('data-product-id'));
            }
        });
    }

    if(cartItemsDiv) {
        cartItemsDiv.addEventListener('click', (event) => {
            const target = event.target;
            const productId = target.getAttribute('data-product-id');
            if (!productId) return;
            const product = productsData.find(p => p._id === productId);
            const cartItem = cart.find(item => item.productId === productId);
            if (!cartItem || !product) return;

            const minQty = product.minBuyQuantity || 1;
            const maxQty = product.maxBuyQuantity;

            if (target.classList.contains('btn-increase')) {
                if (maxQty && (cartItem.quantity + 1) > maxQty) {
                    alert(`You can only buy a maximum of ${maxQty} units.`);
                    return;
                }
                cartItem.quantity++;
            }
            if (target.classList.contains('btn-decrease')) {
                if (cartItem.quantity <= minQty) {
                    cart = cart.filter(item => item.productId !== productId);
                    alert(`Item with minimum quantity of ${minQty} removed from cart.`);
                } else {
                    cartItem.quantity--;
                }
            }
            renderCart();
        });
    }
    
    if(searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const activeCategory = document.querySelector('.categories a.active').textContent;
            fetchProducts(searchInput.value, activeCategory);
        });
    }

    if(categoriesDiv) {
        categoriesDiv.addEventListener('click', (event) => {
            if (event.target.tagName === 'A') {
                event.preventDefault();
                const category = event.target.textContent;
                document.querySelectorAll('.categories a').forEach(a => a.classList.remove('active'));
                event.target.classList.add('active');
                searchInput.value = '';
                fetchProducts('', category);
            }
        });
    }
    
    if(cartIconBtn) cartIconBtn.addEventListener('click', () => { cartPopup.classList.add('open'); });
    if(closeCartBtn) closeCartBtn.addEventListener('click', () => { cartPopup.classList.remove('open'); });

    if(checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (userInfo) {
                if (cart.length > 0) {
                    localStorage.setItem('cart', JSON.stringify(cart));
                    localStorage.setItem('productsData', JSON.stringify(productsData));
                    window.location.href = 'checkout.html';
                } else { alert('Your cart is empty!'); }
            } else {
                alert('Please login to proceed to checkout.');
                window.location.href = 'login.html';
            }
        });
    }

    // --- 5. शुरुआती लोड ---
    updateUserHeader();
    fetchProducts();
});
