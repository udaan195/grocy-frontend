// frontend/js/checkout.js (FINAL DEBUGGING VERSION)

document.addEventListener('DOMContentLoaded', () => {
    console.log('Checkout page script loaded.');

    // --- Configuration ---
    const API_BASE_URL = 'https://grocy-backend.onrender.com';

    // --- DOM Elements ---
    const summaryItemsDiv = document.getElementById('summary-items');
    const summaryTotalSpan = document.getElementById('summary-total');
    const shippingForm = document.getElementById('shipping-form');
    const checkoutContainer = document.getElementById('checkout-container');
    const successMessage = document.getElementById('success-message');

    // --- Main Initializer Function ---
    async function initializeCheckout() {
        console.log('Initializing checkout...');

        const cartString = localStorage.getItem('cart');
        const userInfoString = localStorage.getItem('userInfo');

        console.log('Cart from localStorage:', cartString);
        console.log('User Info from localStorage:', userInfoString);

        const cart = JSON.parse(cartString) || [];
        const userInfo = JSON.parse(userInfoString);

        if (!userInfo || !userInfo.token) {
            alert('DEBUG: No user info or token found. Redirecting to login.');
            window.location.href = 'login.html';
            return;
        }

        if (cart.length === 0) {
            console.log('DEBUG: Cart is empty.');
            if(checkoutContainer) checkoutContainer.innerHTML = '<h2>Your cart is empty. <a href="index.html">Continue shopping</a>.</h2>';
            return;
        }

        console.log('Cart and User Info seem OK. Fetching product details...');

        try {
            const productIds = cart.map(item => item.productId);
            const response = await fetch(`${API_BASE_URL}/api/products/byIds`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: productIds })
            });

            if (!response.ok) throw new Error('Could not fetch product details from server.');
            
            const productsDataFromServer = await response.json();
            console.log('Received product details from server:', productsDataFromServer);
            
            // कार्ट को वैलिडेट करें
            const validatedCart = cart.filter(cartItem => 
                productsDataFromServer.some(p => p._id === cartItem.productId)
            );
            
            if (validatedCart.length !== cart.length) {
                alert('Some items were removed from your cart as they are no longer available.');
                localStorage.setItem('cart', JSON.stringify(validatedCart));
                window.location.reload();
                return;
            }

            renderOrderSummary(validatedCart, productsDataFromServer);
            setupEventListeners(validatedCart, productsDataFromServer);

        } catch (error) {
            console.error('ERROR during initialization:', error);
            if(checkoutContainer) checkoutContainer.innerHTML = `<h2>An error occurred: ${error.message}</h2>`;
        }
    }

    function renderOrderSummary(currentCart, productsData) {
        console.log('Rendering order summary...');
        // ... (यह फंक्शन जैसा था वैसा ही रहेगा)
        let totalAmount = 0;
        summaryItemsDiv.innerHTML = '';
        currentCart.forEach(cartItem => {
            const product = productsData.find(p => p._id === cartItem.productId);
            if (product) {
                totalAmount += product.price * cartItem.quantity;
                // ... (HTML बनाने का लॉजिक)
            }
        });
        summaryTotalSpan.innerText = totalAmount.toFixed(2);
    }
    
    function setupEventListeners(validCart, productsData) {
        console.log('Setting up event listeners...');
        if (shippingForm) {
            shippingForm.addEventListener('submit', (event) => handlePlaceOrder(event, validCart, productsData));
        }
    }

    async function handlePlaceOrder(event, currentCart, productsData) {
        event.preventDefault();
        console.log('"Place Order" button clicked.');
        
        const submitBtn = shippingForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = 'Processing...';

        // दोबारा जांचें कि userInfo अभी भी मौजूद है
        const finalUserInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!finalUserInfo || !finalUserInfo.token) {
            alert('FATAL DEBUG: User Info disappeared before placing order. Please log in again.');
            submitBtn.disabled = false;
            submitBtn.innerText = 'Place Order';
            window.location.href = 'login.html';
            return;
        }

        const orderPayload = {
            orderItems: currentCart.map(item => {
                const product = productsData.find(p => p._id === item.productId);
                return { name: product.name, image: product.image, quantity: item.quantity, price: product.price, product: item.productId };
            }),
            shippingAddress: { fullName: document.getElementById('name').value /* ... other fields ... */ },
            paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
            totalAmount: parseFloat(summaryTotalSpan.innerText),
        };

        console.log('Order payload to be sent:', JSON.stringify(orderPayload, null, 2));
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${finalUserInfo.token}` },
                body: JSON.stringify(orderPayload)
            });

            const responseData = await response.json();
            console.log('Response from server:', responseData);

            if (!response.ok) {
                throw new Error(responseData.message || 'Server returned an error.');
            }

            console.log('Order placed successfully.');
            localStorage.removeItem('cart');
            checkoutContainer.style.display = 'none';
            successMessage.style.display = 'block';

        } catch(error) {
            alert(`Order placement failed: ${error.message}`);
            console.error('ERROR during order placement:', error);
            submitBtn.disabled = false;
            submitBtn.innerText = 'Place Order';
        }
    }

    // --- Start the process ---
    initializeCheckout();
});

