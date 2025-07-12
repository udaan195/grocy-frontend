document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_BASE_URL = 'https://grocy-backend.onrender.com';

    // --- DOM Elements ---
    const summaryItemsDiv = document.getElementById('summary-items');
    const summaryTotalSpan = document.getElementById('summary-total');
    const shippingForm = document.getElementById('shipping-form');
    const checkoutContainer = document.getElementById('checkout-container');
    const successMessage = document.getElementById('success-message');
    const useLocationBtn = document.getElementById('use-location-btn');
    
    // Modal Elements
    const detailsModal = document.getElementById('details-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalImage = document.getElementById('modal-image');
    const modalDescription = document.getElementById('modal-description');
    
    // --- State Variables ---
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    let productsData = []; // हम यह सर्वर से ताज़ा मंगाएंगे

    // --- Main Initializer Function ---
    async function initializeCheckout() {
        if (!userInfo || !userInfo.token) {
            alert('Please log in to proceed.');
            window.location.href = 'login.html';
            return;
        }
        if (cart.length === 0) {
            if(checkoutContainer) checkoutContainer.innerHTML = '<h2>Your cart is empty. <a href="index.html">Continue shopping</a>.</h2>';
            return;
        }

        try {
            const productIds = cart.map(item => item.productId);
            const response = await fetch(`${API_BASE_URL}/api/products/byIds`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: productIds })
            });
            if (!response.ok) throw new Error('Could not fetch product details.');
            
            productsData = await response.json();
            
            const validatedCart = cart.filter(item => productsData.some(p => p._id === item.productId));
            if (validatedCart.length !== cart.length) {
                alert('Some items were removed from your cart as they are no longer available.');
                cart = validatedCart;
                localStorage.setItem('cart', JSON.stringify(cart));
            }

            renderCheckoutSummary();
            setupEventListeners();

        } catch (error) {
            if(checkoutContainer) checkoutContainer.innerHTML = `<h2>Error: ${error.message}</h2>`;
        }
    }

    // --- Helper Functions ---
    function renderCheckoutSummary() {
        if (!summaryItemsDiv) return;
        summaryItemsDiv.innerHTML = '';
        let totalAmount = 0;

        cart.forEach(cartItem => {
            const product = productsData.find(p => p._id === cartItem.productId);
            if (product) {
                const itemTotal = product.price * cartItem.quantity;
                totalAmount += itemTotal;
                const itemElement = document.createElement('div');
                itemElement.className = 'summary-item';
                itemElement.dataset.productId = product._id; // प्रोडक्ट ID को क्लिक के लिए सेव करें
                itemElement.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" class="summary-item-image">
                    <div class="summary-item-details">
                        <p><strong>${product.name}</strong></p>
                        <div class="summary-quantity-controls">
                            <button class="btn-decrease" data-product-id="${product._id}">-</button>
                            <span>${cartItem.quantity}</span>
                            <button class="btn-increase" data-product-id="${product._id}">+</button>
                        </div>
                    </div>
                    <span class="summary-item-price">₹${itemTotal.toFixed(2)}</span>
                `;
                summaryItemsDiv.appendChild(itemElement);
            }
        });
        if(summaryTotalSpan) summaryTotalSpan.innerText = totalAmount.toFixed(2);
    }

    function handleQuantityChange(productId, change) {
        const cartItem = cart.find(item => item.productId === productId);
        if (cartItem) {
            cartItem.quantity += change;
            if (cartItem.quantity <= 0) {
                cart = cart.filter(item => item.productId !== productId);
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCheckoutSummary();
        }
    }
    
    function handleGeolocation() {
        if (navigator.geolocation) {
            useLocationBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Fetching...';
            useLocationBtn.disabled = true;
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if (data && data.address) {
                        document.getElementById('address').value = [data.address.road, data.address.house_number].filter(Boolean).join(', ') || '';
                        document.getElementById('pincode').value = data.address.postcode || '';
                        document.getElementById('city').value = data.address.city || data.address.town || '';
                        document.getElementById('state').value = data.address.state || '';
                    }
                } catch (error) { alert('Could not get address from your location.'); } 
                finally {
                    useLocationBtn.innerHTML = '<i class="fa fa-map-marker-alt"></i> Use my current location';
                    useLocationBtn.disabled = false;
                }
            }, () => {
                alert('Could not get your location. Please enable location services.');
                useLocationBtn.innerHTML = '<i class="fa fa-map-marker-alt"></i> Use my current location';
                useLocationBtn.disabled = false;
            });
        } else { alert('Geolocation is not supported by this browser.'); }
    }

    function showProductDetailsModal(productId) {
        const product = productsData.find(p => p._id === productId);
        if (product && detailsModal) {
            modalTitle.innerText = product.name;
            modalImage.src = product.image;
            modalDescription.innerText = product.description;
            detailsModal.style.display = 'flex';
        }
    }

    async function handlePlaceOrder(event) {
        event.preventDefault();
        // ... (Place Order Logic, यह पहले जैसा ही रहेगा) ...
    }

    function setupEventListeners() {
        if (summaryItemsDiv) {
            summaryItemsDiv.addEventListener('click', (e) => {
                const productId = e.target.closest('.summary-item')?.dataset.productId;
                if (e.target.classList.contains('btn-increase')) handleQuantityChange(e.target.dataset.productId, 1);
                else if (e.target.classList.contains('btn-decrease')) handleQuantityChange(e.target.dataset.productId, -1);
                else if (productId) showProductDetailsModal(productId);
            });
        }
        if (shippingForm) shippingForm.addEventListener('submit', handlePlaceOrder);
        if (useLocationBtn) useLocationBtn.addEventListener('click', handleGeolocation);
        if (closeModalBtn) closeModalBtn.addEventListener('click', () => detailsModal.style.display = 'none');
    }

    initializeCheckout();
});

