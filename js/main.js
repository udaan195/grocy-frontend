// FINAL DEBUGGING SCRIPT for main.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("PAGE LOADED: Starting main.js...");

    // --- Configuration & Elements ---
    const API_BASE_URL = 'https://grocy-backend.onrender.com';
    const productListDiv = document.getElementById('product-list');
    const cartItemsDiv = document.getElementById('cart-items');
    const cartIconBtn = document.getElementById('cart-icon-btn');
    const cartPopup = document.getElementById('cart-popup');
    
    // --- State Variables ---
    let allProducts = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // --- Main Functions ---

    // 1. सर्वर से सभी प्रोडक्ट्स लाना
    async function fetchAllProducts() {
        console.log("STEP 1: Fetching all products from server...");
        if (!productListDiv) {
            console.error("ERROR: product-list div not found!");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/products`);
            allProducts = await response.json();
            console.log("STEP 2: Products received from server. Total products:", allProducts.length);
            console.log("First product received:", allProducts[0]); // पहला प्रोडक्ट दिखाएँ
            renderProducts(allProducts);
        } catch (error) {
            console.error("ERROR during fetchAllProducts:", error);
            productListDiv.innerHTML = '<p>Could not load products.</p>';
        }
    }

    // 2. प्रोडक्ट्स को पेज पर दिखाना
    function renderProducts(productsToRender) {
        console.log("Rendering products on page...");
        // ... (यह फंक्शन सिर्फ प्रोडक्ट्स दिखाता है, इसमें गलती नहीं है) ...
        if (!productListDiv) return;
        productListDiv.innerHTML = '';
        productsToRender.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `<h3>${product.name}</h3><p>₹${product.price}</p><button class="add-to-cart-btn" data-product-id="${product._id}">Add to Cart</button>`;
            productListDiv.appendChild(card);
        });
    }

    // 3. कार्ट पॉपअप को दिखाना (Render Cart) - यहीं पर असली जांच होगी
    function renderCart() {
        console.log("STEP 3: renderCart function called.");
        console.log("--- DEBUGGING renderCart ---");
        
        // क. क्या हमारे पास प्रोडक्ट्स की मास्टर लिस्ट है?
        console.log("Master 'allProducts' list has", allProducts.length, "items.");
        
        // ख. क्या हमारे कार्ट में कोई आइटम है?
        console.log("Current 'cart' array:", cart);

        if (!cartItemsDiv) {
            console.error("FATAL: cart-items div not found!");
            return;
        }
        cartItemsDiv.innerHTML = '';
        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
            return;
        }

        let itemsRenderedCount = 0;
        cart.forEach((cartItem, index) => {
            console.log(`--> Checking cart item #${index + 1}: Looking for Product ID -> ${cartItem.productId}`);
            const product = allProducts.find(p => p._id === cartItem.productId);
            
            if (product) {
                console.log(`   SUCCESS: Found product in master list: ${product.name}`);
                itemsRenderedCount++;
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `<span>${product.name} (x${cartItem.quantity})</span>`;
                cartItemsDiv.appendChild(itemElement);
            } else {
                console.error(`   FAILURE: Could NOT find Product ID ${cartItem.productId} in the master list.`);
            }
        });

        if (itemsRenderedCount === 0 && cart.length > 0) {
            alert("DEBUG ALERT: Cart has items, but none of them were found in the product list. Check the console for ID mismatches.");
        }
        console.log("--- DEBUGGING FINISHED ---");
    }
    
    // --- Event Handlers & Initial Load ---
    function setupEventListeners() {
        if (productListDiv) {
            productListDiv.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-to-cart-btn')) {
                    const productId = e.target.dataset.productId;
                    console.log(`Add to Cart button clicked for ID: ${productId}`);
                    const existingItem = cart.find(item => item.productId === productId);
                    if (existingItem) {
                        existingItem.quantity++;
                    } else {
                        cart.push({ productId: productId, quantity: 1 });
                    }
                    localStorage.setItem('cart', JSON.stringify(cart));
                    renderCart();
                }
            });
        }
        if (cartIconBtn) {
            cartIconBtn.addEventListener('click', () => {
                console.log("Cart icon clicked. Re-rendering cart before showing.");
                renderCart(); // पॉपअप खोलने से ठीक पहले कार्ट को दोबारा रेंडर करें
                if (cartPopup) cartPopup.classList.add('open');
            });
        }
        if (closeCartBtn) closeCartBtn.addEventListener('click', () => { if (cartPopup) cartPopup.classList.remove('open'); });
    }

    async function init() {
        await fetchAllProducts();
        renderCart();
        setupEventListeners();
    }
    
    init();
});
