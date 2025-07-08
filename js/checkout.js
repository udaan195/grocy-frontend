document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_BASE_URL = 'https://grocy-backend.onrender.com';

    // --- DOM Elements (आपके HTML के हिसाब से) ---
    const summaryItemsDiv = document.getElementById('summary-items');
    const summaryTotalSpan = document.getElementById('summary-total');
    const shippingForm = document.getElementById('shipping-form');
    const checkoutContainer = document.getElementById('checkout-container');
    const successMessage = document.getElementById('success-message');
    
    // Address fields
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    const areaInput = document.getElementById('area');
    const landmarkInput = document.getElementById('landmark');
    const pincodeInput = document.getElementById('pincode');
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');
    const useLocationBtn = document.getElementById('use-location-btn');
    
    // --- localStorage से डेटा निकालें ---
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

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
            // सर्वर से कार्ट में मौजूद प्रोडक्ट्स की ताज़ा और सही जानकारी माँगें
            const productIds = cart.map(item => item.productId);
            const response = await fetch(`${API_BASE_URL}/api/products/byIds`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: productIds })
            });

            if (!response.ok) throw new Error('Could not fetch product details.');
            
            const productsDataFromServer = await response.json();
            
            // कार्ट को क्लीन और वैलिडेट करें
            const validatedCart = cart.filter(cartItem => 
                productsDataFromServer.some(p => p._id === cartItem.productId)
            );
            
            if (validatedCart.length !== cart.length) {
                alert('Some items in your cart were no longer available and have been automatically removed. Please review your order.');
                localStorage.setItem('cart', JSON.stringify(validatedCart));
                window.location.reload(); // पेज को रीलोड करें ताकि सही कार्ट दिखे
                return;
            }

            // अब पेज को रेंडर करें और इवेंट्स सेट करें
            renderOrderSummary(validatedCart, productsDataFromServer);
            prefillShippingForm();
            setupEventListeners(validatedCart, productsDataFromServer);

        } catch (error) {
            if(checkoutContainer) checkoutContainer.innerHTML = `<h2>An error occurred: ${error.message}</h2>`;
        }
    }

    // --- Helper Functions ---

    function renderOrderSummary(currentCart, productsData) {
        let totalAmount = 0;
        summaryItemsDiv.innerHTML = '';
        currentCart.forEach(cartItem => {
            const product = productsData.find(p => p._id === cartItem.productId);
            if (product) {
                const itemTotal = product.price * cartItem.quantity;
                totalAmount += itemTotal;
                const itemElement = document.createElement('div');
                itemElement.className = 'summary-item';
                itemElement.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" class="summary-item-image">
                    <div class="summary-item-details">
                        <p><strong>${product.name}</strong></p>
                        <p>Qty: ${cartItem.quantity}</p>
                    </div>
                    <span class="summary-item-price">₹${itemTotal.toFixed(2)}</span>
                `;
                summaryItemsDiv.appendChild(itemElement);
            }
        });
        summaryTotalSpan.innerText = totalAmount.toFixed(2);
    }

    function prefillShippingForm() {
        if (shippingForm && userInfo) {
            nameInput.value = userInfo.name || '';
            emailInput.value = userInfo.email || '';
            phoneInput.value = userInfo.phone || '';
            addressInput.value = userInfo.address || '';
            cityInput.value = userInfo.city || '';
            pincodeInput.value = userInfo.pincode || '';
            stateInput.value = userInfo.state || '';
        }
    }

    async function handlePincodeLookup() {
        if (pincodeInput.value.length === 6) {
            try {
                const response = await fetch(`https://api.postalpincode.in/pincode/${pincodeInput.value}`);
                const data = await response.json();
                if (data && data[0].Status === 'Success') {
                    const postOffice = data[0].PostOffice[0];
                    cityInput.value = postOffice.District;
                    stateInput.value = postOffice.State;
                }
            } catch (error) { console.error('Pincode fetch error:', error); }
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
                        addressInput.value = [data.address.road, data.address.house_number].filter(Boolean).join(', ') || '';
                        areaInput.value = data.address.suburb || data.address.neighbourhood || '';
                        pincodeInput.value = data.address.postcode || '';
                        cityInput.value = data.address.city || data.address.town || '';
                        stateInput.value = data.address.state || '';
                    }
                } catch (error) {
                    alert('Could not get address from your location.');
                } finally {
                    useLocationBtn.innerHTML = '<i class="fa fa-map-marker-alt"></i> Use my current location';
                    useLocationBtn.disabled = false;
                }
            }, () => {
                alert('Could not get your location. Please enable location services in your browser.');
                useLocationBtn.innerHTML = '<i class="fa fa-map-marker-alt"></i> Use my current location';
                useLocationBtn.disabled = false;
            });
        } else { alert('Geolocation is not supported by this browser.'); }
    }
    
    async function handlePlaceOrder(event, currentCart, productsData) {
        event.preventDefault();
        const submitBtn = shippingForm.querySelector('button[type="submit"]');
        if (!shippingForm.checkValidity()) {
            alert('Please fill all required fields.');
            shippingForm.reportValidity();
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerText = 'Processing...';

        const orderPayload = {
            orderItems: currentCart.map(item => {
                const product = productsData.find(p => p._id === item.productId);
                return { name: product.name, image: product.image, quantity: item.quantity, price: product.price, product: item.productId };
            }),
            shippingAddress: {
                fullName: nameInput.value,
                address: addressInput.value,
                area: areaInput.value,
                landmark: landmarkInput.value,
                city: cityInput.value,
                pincode: pincodeInput.value,
                state: stateInput.value,
                phone: phoneInput.value,
            },
            paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
            totalAmount: parseFloat(summaryTotalSpan.innerText),
        };
        
        try {
            await saveOrderToDb(orderPayload);
            showSuccessMessage();
        } catch(error) {
            alert(`Order placement failed: ${error.message}`);
            submitBtn.disabled = false;
            submitBtn.innerText = 'Place Order';
        }
    }

    async function saveOrderToDb(orderPayload) {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
            body: JSON.stringify(orderPayload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Could not save your order.');
        }
    }

    function showSuccessMessage() {
        localStorage.removeItem('cart');
        if(checkoutContainer) checkoutContainer.style.display = 'none';
        if(successMessage) successMessage.style.display = 'block';
    }
    
    function setupEventListeners(validCart, productsData) {
        if (shippingForm) shippingForm.addEventListener('submit', (event) => handlePlaceOrder(event, validCart, productsData));
        if (pincodeInput) pincodeInput.addEventListener('input', handlePincodeLookup);
        if (useLocationBtn) useLocationBtn.addEventListener('click', handleGeolocation);
    }

    // --- Start the process ---
    initializeCheckout();
});
