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
            checkoutContainer.innerHTML = '<h2>Your cart is empty. <a href="index.html">Continue shopping</a>.</h2>';
            return;
        }

        try {
            // सर्वर से प्रोडक्ट्स की ताज़ा जानकारी माँगें
            const productIds = cart.map(item => item.productId);
            const response = await fetch(`${API_BASE_URL}/api/products/byIds`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: productIds })
            });

            if (!response.ok) throw new Error('Could not fetch product details.');
            
            const productsData = await response.json();
            
            // अब पेज को रेंडर करें और इवेंट्स सेट करें
            renderOrderSummary(productsData);
            prefillShippingForm();
            setupEventListeners(productsData);

        } catch (error) {
            checkoutContainer.innerHTML = `<h2>Error: ${error.message}</h2>`;
        }
    }

    // --- Helper Functions ---

    function renderOrderSummary(productsData) {
        let totalAmount = 0;
        summaryItemsDiv.innerHTML = '';
        cart.forEach(cartItem => {
            const product = productsData.find(p => p._id === cartItem.productId);
            if (product) {
                const itemTotal = product.price * cartItem.quantity;
                totalAmount += itemTotal;
                const itemElement = document.createElement('div');
                itemElement.className = 'summary-item'; // Use your CSS class
                itemElement.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
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
                    // Using a CORS-friendly proxy for Nominatim might be more reliable
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if (data && data.address) {
                        addressInput.value = [data.address.road, data.address.house_number].filter(Boolean).join(', ') || '';
                        areaInput.value = data.address.suburb || data.address.neighbourhood || '';
                        pincodeInput.value = data.address.postcode || '';
                        cityInput.value = data.address.city || data.address.town || '';
                        stateInput.value = data.address.state || '';
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
    
    async function handlePlaceOrder(event, productsData) {
        event.preventDefault();
        const submitBtn = shippingForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = 'Processing...';

        const orderPayload = {
            orderItems: cart.map(item => {
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
        
        // Final validation
        if (!orderPayload.shippingAddress.fullName || !orderPayload.shippingAddress.phone || !orderPayload.shippingAddress.address || !orderPayload.shippingAddress.pincode) {
            alert('Please fill all required address fields.');
            submitBtn.disabled = false;
            submitBtn.innerText = 'Place Order';
            return;
        }

        try {
            // For now, let's assume all orders are COD for simplicity. You can add Razorpay logic back here.
            await saveOrderToDb(orderPayload);
            showSuccessMessage();
        } catch(error) {
            alert(`Error: ${error.message}`);
