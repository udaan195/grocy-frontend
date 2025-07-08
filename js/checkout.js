document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_BASE_URL = 'https://grocy-backend.onrender.com';

    // --- DOM Elements (आपके HTML के हिसाब से) ---
    const summaryItemsDiv = document.getElementById('summary-items');
    const summaryTotalSpan = document.getElementById('summary-total');
    const shippingForm = document.getElementById('shipping-form');
    const checkoutContainer = document.getElementById('checkout-container');
    const successMessage = document.getElementById('success-message');
    const pincodeInput = document.getElementById('pincode');
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');
    const useLocationBtn = document.getElementById('use-location-btn');
    const addressInput = document.getElementById('address');
    const areaInput = document.getElementById('area');

    // --- localStorage से डेटा निकालें ---
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const productsData = JSON.parse(localStorage.getItem('productsData')) || [];
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // --- Guard Clauses: ज़रूरी जांच ---
    if (!userInfo || !userInfo.token) {
        alert('Please log in to proceed.');
        window.location.href = 'login.html';
        return;
    }
    if (cart.length === 0 || productsData.length === 0) {
        if (checkoutContainer) {
            checkoutContainer.innerHTML = '<h2>Your cart is empty. <a href="index.html">Continue shopping</a>.</h2>';
        }
        return;
    }

    // --- Main Functions ---

    function renderOrderSummary() {
        let totalAmount = 0;
        summaryItemsDiv.innerHTML = '';
        cart.forEach(cartItem => {
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
            document.getElementById('name').value = userInfo.name || '';
            document.getElementById('email').value = userInfo.email || '';
            document.getElementById('phone').value = userInfo.phone || '';
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
                } else {
                    cityInput.value = '';
                    stateInput.value = '';
                }
            } catch (error) {
                console.error('Pincode fetch error:', error);
            }
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
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }
    
    async function handlePlaceOrder(event) {
        event.preventDefault();
        const submitBtn = shippingForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = 'Processing...';

        const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        const totalAmount = parseFloat(summaryTotalSpan.innerText);

        const orderPayload = {
            orderItems: cart.map(item => {
                const product = productsData.find(p => p._id === item.productId);
                return { name: product.name, image: product.image, quantity: item.quantity, price: product.price, product: item.productId };
            }),
            shippingAddress: {
                fullName: document.getElementById('name').value,
                address: addressInput.value,
                area: areaInput.value,
                city: cityInput.value,
                pincode: pincodeInput.value,
                state: stateInput.value,
                phone: document.getElementById('phone').value,
            },
            paymentMethod: selectedPaymentMethod,
            totalAmount: totalAmount,
        };

        try {
            if (selectedPaymentMethod === 'COD') {
                await saveOrderToDb(orderPayload);
                showSuccessMessage();
            } else if (selectedPaymentMethod === 'Online') {
                await handleRazorpayPayment(orderPayload);
            }
        } catch (error) {
            alert(`An error occurred: ${error.message}`);
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
        return await response.json();
    }

    async function handleRazorpayPayment(orderPayload) {
        try {
            const keyResponse = await fetch(`${API_BASE_URL}/api/payment/getkey`);
            const { key } = await keyResponse.json();

            const orderResponse = await fetch(`${API_BASE_URL}/api/payment/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
                body: JSON.stringify({ amount: orderPayload.totalAmount }),
            });
            const { data: razorpayOrder } = await orderResponse.json();

            const options = {
                key,
                amount: razorpayOrder.amount,
                currency: "INR",
                name: "Grocy",
                order_id: razorpayOrder.id,
                handler: async function (response) {
                    const verificationBody = { ...response };
                    const verificationResponse = await fetch(`${API_BASE_URL}/api/payment/verify`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(verificationBody),
                    });
                    if (!verificationResponse.ok) throw new Error('Payment verification failed.');
                    
                    orderPayload.isPaid = true;
                    orderPayload.paidAt = new Date();
                    orderPayload.paymentResult = { id: response.razorpay_payment_id, status: 'completed' };
                    await saveOrderToDb(orderPayload);
                    showSuccessMessage();
                },
                prefill: {
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    contact: document.getElementById('phone').value,
                },
                theme: { color: '#28a745' }
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => {
                alert(`Payment failed: ${response.error.description}`);
            });
            rzp.open();
        } catch (error) {
            throw error; // Re-throw error to be caught by handlePlaceOrder
        }
    }
    
    function showSuccessMessage() {
        localStorage.removeItem('cart');
        localStorage.removeItem('productsData');
        checkoutContainer.style.display = 'none';
        successMessage.style.display = 'block';
    }

    // --- Initial Load & Event Listeners ---
    renderOrderSummary();
    prefillShippingForm();
    if (shippingForm) shippingForm.addEventListener('submit', handlePlaceOrder);
    if (pincodeInput) pincodeInput.addEventListener('input', handlePincodeLookup);
    if (useLocationBtn) useLocationBtn.addEventListener('click', handleGeolocation);
});
