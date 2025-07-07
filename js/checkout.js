document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'https://grocy-backend.onrender.com'; // **यहाँ अपना Render URL डालें**
  
    // --- Elements ---
    const summaryItemsDiv = document.getElementById('summary-items');
    const summaryTotalSpan = document.getElementById('summary-total');
    const shippingForm = document.getElementById('shipping-form');
    const checkoutContainer = document.getElementById('checkout-container');
    const successMessage = document.getElementById('success-message');
    const pincodeInput = document.getElementById('pincode');
    const cityInput = document.getElementById('city');
    const stateInput = document.getElementById('state');
    const useLocationBtn = document.getElementById('use-location-btn');

    // --- Get Data from localStorage ---
    const cart = JSON.parse(localStorage.getItem('cart'));
    const productsData = JSON.parse(localStorage.getItem('productsData'));
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // --- Guard Clause ---
    if (!cart || cart.length === 0 || !productsData) {
        if(checkoutContainer) {
            checkoutContainer.innerHTML = '<h2>Your cart is empty. <a href="index.html">Go back to shopping</a>.</h2>';
        }
        return;
    }
    
    // --- Pre-fill Form ---
    if (userInfo && shippingForm) {
        document.getElementById('name').value = userInfo.name || '';
        document.getElementById('email').value = userInfo.email || '';
        document.getElementById('phone').value = userInfo.phone || '';
        document.getElementById('address').value = userInfo.address || '';
        document.getElementById('city').value = userInfo.city || '';
        document.getElementById('pincode').value = userInfo.pincode || '';
        document.getElementById('state').value = userInfo.state || '';
    }

    // --- Render Order Summary ---
    let totalAmount = 0;
    summaryItemsDiv.innerHTML = '';
    cart.forEach(cartItem => {
        const product = productsData.find(p => p._id === cartItem.productId);
        if (product) {
            const itemElement = document.createElement('div');
            itemElement.className = 'summary-item';
            itemElement.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <div class="summary-item-details">
                    <p><strong>${product.name}</strong></p>
                    <p>Qty: ${cartItem.quantity}</p>
                </div>
                <span class="summary-item-price">₹${(product.price * cartItem.quantity).toFixed(2)}</span>
            `;
            summaryItemsDiv.appendChild(itemElement);
            totalAmount += product.price * cartItem.quantity;
        }
    });
    summaryTotalSpan.innerText = totalAmount.toFixed(2);

    // --- Event Listeners ---

    if(pincodeInput) {
        pincodeInput.addEventListener('input', async () => {
            if (pincodeInput.value.length === 6) {
                try {
                    const response = await fetch(`https://api.postalpincode.in/pincode/${pincodeInput.value}`);
                    const data = await response.json();
                    if (data[0].Status === 'Success') {
                        const postOffice = data[0].PostOffice[0];
                        cityInput.value = postOffice.District;
                        stateInput.value = postOffice.State;
                    } else { alert('Invalid Pincode'); }
                } catch (error) { console.error('Pincode fetch error:', error); }
            }
        });
    }

    if(useLocationBtn) {
        useLocationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                useLocationBtn.innerText = 'Fetching...';
                useLocationBtn.disabled = true;
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        if (data && data.address) {
                            document.getElementById('address').value = `${data.address.road || ''}`.trim();
                            document.getElementById('area').value = data.address.suburb || data.address.neighbourhood || '';
                            document.getElementById('pincode').value = data.address.postcode || '';
                            document.getElementById('city').value = data.address.city || data.address.town || '';
                            document.getElementById('state').value = data.address.state || '';
                        }
                    } catch (error) { alert('Could not get address from location.'); } 
                    finally {
                        useLocationBtn.innerText = 'Use my current location';
                        useLocationBtn.disabled = false;
                    }
                }, () => {
                    alert('Could not get your location. Please enable location services.');
                    useLocationBtn.innerText = 'Use my current location';
                    useLocationBtn.disabled = false;
                });
            } else { alert('Geolocation is not supported by this browser.'); }
        });
    }

    if(shippingForm) {
        shippingForm.addEventListener('submit', async (event) => {
          // COD ऑर्डर सेव करने के लिए
        const response = await fetch(`https://grocy-backend.onrender.com/api/orders`, { /* ... */ });
        
        // Razorpay ऑर्डर बनाने के लिए
        const orderResponse = await fetch(`${API_BASE_URL}/api/payment/orders`, { /* ... */ });

        // पेमेंट वेरिफाई करने के लिए
        const verificationResponse = await fetch(`${API_BASE_URL}/api/payment/verify`, { /* ... */ });
    });
});
            event.preventDefault();
            
            const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerText = 'Processing...';

            try {
                if (!userInfo) { throw new Error('You must be logged in.'); }

                const saveOrderToDb = async (paymentDetails = {}) => {
                    // checkout.js में
const orderItems = cart.map(item => {
    const product = productsData.find(p => p._id === item.productId);
    return { name: product.name, image: product.image, quantity: item.quantity, price: product.price, productId: product._id };
});

                    const orderData = {
                        orderItems,
                        shippingAddress: {
                            fullName: document.getElementById('name').value,
                            address: `${document.getElementById('address').value}, ${document.getElementById('area').value}`,
                            city: document.getElementById('city').value,
                            pincode: document.getElementById('pincode').value,
                            state: document.getElementById('state').value,
                            phone: document.getElementById('phone').value,
                        },
                        paymentMethod: selectedPaymentMethod,
                        totalAmount,
                        isPaid: paymentDetails.isPaid || false,
                        paidAt: paymentDetails.isPaid ? new Date() : null,
                        paymentResult: paymentDetails.razorpayResponse ? {
                            id: paymentDetails.razorpayResponse.razorpay_payment_id,
                            status: 'completed',
                        } : null,
                    };

                    const response = await fetch('https://grocy-backend.onrender.com/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
                        body: JSON.stringify(orderData)
                    });
                    if (!response.ok) throw new Error('Could not save your order to the database.');
                };

                if (selectedPaymentMethod === 'COD') {
                    await saveOrderToDb();
                    localStorage.removeItem('cart');
                    localStorage.removeItem('productsData');
                    checkoutContainer.style.display = 'none';
                    successMessage.style.display = 'block';
                } else if (selectedPaymentMethod === 'Online') {
                    const keyResponse = await fetch('https://grocy-backend.onrender.com/api/payment/getkey');
                    const { key } = await keyResponse.json();

                    const orderResponse = await fetch('https://grocy-backend.onrender.com/api/payment/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
                        body: JSON.stringify({ amount: totalAmount }),
                    });
                    const { data: razorpayOrder } = await orderResponse.json();

                    const options = {
                        key,
                        amount: razorpayOrder.amount,
                        name: 'Gorcy',
                        order_id: razorpayOrder.id,
                        handler: async function (response) {
                            const verificationBody = {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            };
                            const verificationResponse = await fetch('https://grocy-backend.onrender.com/api/payment/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(verificationBody),
                            });
                            if (!verificationResponse.ok) throw new Error('Payment verification failed.');
                            
                            await saveOrderToDb({ isPaid: true, razorpayResponse: response });
                            
                            localStorage.removeItem('cart');
                            localStorage.removeItem('productsData');
                            checkoutContainer.style.display = 'none';
                            successMessage.style.display = 'block';
                        },
                        prefill: { name: userInfo.name, email: userInfo.email, contact: document.getElementById('phone').value, },
                        theme: { color: '#28a745' }
                    };
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                    rzp.on('payment.failed', (response) => {
                        alert(`Payment failed: ${response.error.description}`);
                    });
                }
            } catch (error) {
                alert(`Error: ${error.message}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Place Order';
            }
        });
    }
});
