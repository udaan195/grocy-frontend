document.addEventListener('DOMContentLoaded', () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    if (!userInfo) {
        window.location.href = 'login.html';
        return;
    }

    // Elements
    const nameSpan = document.getElementById('profile-name');
    const emailSpan = document.getElementById('profile-email');
    const addressSpan = document.getElementById('profile-address');
    const adminPanelLink = document.getElementById('admin-panel-link');
    const showVendorOrdersBtn = document.getElementById('show-vendor-orders-btn');
    const showCustomerOrdersBtn = document.getElementById('show-customer-orders-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const editFormContainer = document.getElementById('edit-profile-form-container');
    const editForm = document.getElementById('edit-profile-form');
    const orderHistoryContainer = document.getElementById('order-history-container');
    const orderHistoryTitle = document.getElementById('order-history-title');
    const orderHistoryList = document.getElementById('order-history-list');

    // Populate user data
    nameSpan.innerText = userInfo.name;
    emailSpan.innerText = userInfo.email;
    const fullAddress = [userInfo.address, userInfo.city, userInfo.pincode].filter(Boolean).join(', ');
    addressSpan.innerText = fullAddress || 'Not Provided';
    
    // Show/Hide Links based on Role
    if (userInfo.role === 'admin') {
        adminPanelLink.style.display = 'block';
    } else if (userInfo.role === 'vendor') {
        showVendorOrdersBtn.style.display = 'block';
    } else {
        showCustomerOrdersBtn.style.display = 'block';
    }

    // Logout Button
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('userInfo');
        window.location.href = 'index.html';
    });

    // Edit Profile Logic
    editProfileBtn.addEventListener('click', () => {
        editFormContainer.style.display = editFormContainer.style.display === 'none' ? 'block' : 'none';
        if (editFormContainer.style.display === 'block') {
            document.getElementById('edit-name').value = userInfo.name || '';
            document.getElementById('edit-address').value = userInfo.address || '';
            document.getElementById('edit-city').value = userInfo.city || '';
            document.getElementById('edit-pincode').value = userInfo.pincode || '';
        }
    });
    
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // ... (Profile update logic remains the same)
    });
    
    // Show Order History Logic
    const handleShowOrders = async (role) => {
        const isHidden = orderHistoryContainer.style.display === 'none';
        orderHistoryContainer.style.display = isHidden ? 'block' : 'none';

        if (isHidden) {
            let url = '';
            if (role === 'customer') {
                orderHistoryTitle.innerText = 'My Purchase History';
                url = 'http://localhost:3000/api/orders/myorders';
            } else if (role === 'vendor') {
                orderHistoryTitle.innerText = 'My Sales Orders';
                url = 'http://localhost:3000/api/orders/vendor';
            }

            orderHistoryList.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
            try {
                const response = await fetch(url, { headers: { 'Authorization': `Bearer ${userInfo.token}` } });
                if (!response.ok) throw new Error('Could not fetch orders.');
                const orders = await response.json();
                renderOrders(orders, role);
            } catch (error) {
                orderHistoryList.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        }
    };

    showCustomerOrdersBtn.addEventListener('click', () => handleShowOrders('customer'));
    showVendorOrdersBtn.addEventListener('click', () => handleShowOrders('vendor'));

    function renderOrders(orders, role) {
        orderHistoryList.innerHTML = '';
        if (orders.length === 0) {
            orderHistoryList.innerHTML = '<p>No orders found.</p>';
            return;
        }
        orders.forEach(order => {
            const orderDiv = document.createElement('div');
            orderDiv.className = 'order-history-item';
            // अगर वेंडर देख रहा है तो ग्राहक का नाम दिखाओ, अगर ग्राहक देख रहा है तो वेंडर का नाम
            const otherParty = role === 'vendor' ? `Customer: ${order.user.name}` : `Sold by: ${order.vendor.name}`;
            
            orderDiv.innerHTML = `
                <p><strong>Order ID:</strong> ${order._id}</p>
                <p><strong>${otherParty}</strong></p>
                <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Total:</strong> ₹${order.totalAmount.toFixed(2)}</p>
                <p><strong>Status:</strong> ${order.status}</p>
            `;
            orderHistoryList.appendChild(orderDiv);
        });
    }
});

