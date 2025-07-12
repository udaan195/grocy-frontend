// frontend/js/profile.js (Final Code)
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://grocy-backend.onrender.com';
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // --- DOM Elements ---
    const nameSpan = document.getElementById('profile-name'); // मान लीजिए आपके पास यह IDs हैं
    const emailSpan = document.getElementById('profile-email');
    const viewOrdersBtn = document.getElementById('view-orders-btn');
    const orderHistoryContainer = document.getElementById('order-history-container');

    // --- Auth Guard ---
    if (!userInfo || !userInfo.token) {
        window.location.href = 'login.html';
        return;
    }

    // --- Populate Profile Info ---
    if (nameSpan) nameSpan.innerText = userInfo.name;
    if (emailSpan) emailSpan.innerText = userInfo.email;

    // --- Event Listener ---
    viewOrdersBtn.addEventListener('click', async () => {
        viewOrdersBtn.innerText = 'Loading...';
        viewOrdersBtn.disabled = true;
        orderHistoryContainer.style.display = 'block';
        orderHistoryContainer.innerHTML = '<p>Fetching your orders...</p>';

        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/myorders`, {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Could not fetch your orders.');
            }

            const orders = await response.json();
            renderOrderHistory(orders);

        } catch (error) {
            orderHistoryContainer.innerHTML = `<p style="color:red;">${error.message}</p>`;
        } finally {
            viewOrdersBtn.style.display = 'none'; // बटन को छिपा दें
        }
    });

    function renderOrderHistory(orders) {
        if (orders.length === 0) {
            orderHistoryContainer.innerHTML = '<p>You have no orders yet.</p>';
            return;
        }

        orderHistoryContainer.innerHTML = ''; // पुराना कंटेंट साफ़ करें
        orders.forEach(order => {
            const orderDiv = document.createElement('div');
            orderDiv.className = 'order-history-item'; // CSS के लिए क्लास

            let itemsHtml = order.orderItems.map(item => `<li>${item.name} (Qty: ${item.quantity})</li>`).join('');

            orderDiv.innerHTML = `
                <h4>Order ID: ${order._id}</h4>
                <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Total:</strong> ₹${order.totalAmount.toFixed(2)}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <ul>${itemsHtml}</ul>
            `;
            orderHistoryContainer.appendChild(orderDiv);
        });
    }
});
