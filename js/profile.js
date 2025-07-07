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
    const showOrdersBtn = document.getElementById('show-orders-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const editFormContainer = document.getElementById('edit-profile-form-container');
    const editForm = document.getElementById('edit-profile-form');
    const orderHistoryDiv = document.getElementById('customer-order-history');
    const orderHistoryList = document.getElementById('order-history-list');

    // Populate initial data
    if (nameSpan) nameSpan.innerText = userInfo.name;
    if (emailSpan) emailSpan.innerText = userInfo.email;
    if (addressSpan) {
        const fullAddress = [userInfo.address, userInfo.city, userInfo.pincode].filter(Boolean).join(', ');
        addressSpan.innerText = fullAddress || 'Not Provided';
    }
    
    // Show/Hide Links based on Role
    if (adminPanelLink && showOrdersBtn) {
        if (userInfo.role === 'admin' || userInfo.role === 'vendor') {
            adminPanelLink.style.display = 'block';
            showOrdersBtn.style.display = 'none';
        } else {
            adminPanelLink.style.display = 'none';
            showOrdersBtn.style.display = 'block';
        }
    }

    // Logout Button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userInfo');
            window.location.href = 'index.html';
        });
    }

    // Show/Hide Edit Form
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            const isHidden = editFormContainer.style.display === 'none';
            editFormContainer.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                document.getElementById('edit-name').value = userInfo.name || '';
                document.getElementById('edit-address').value = userInfo.address || '';
                document.getElementById('edit-city').value = userInfo.city || '';
                document.getElementById('edit-pincode').value = userInfo.pincode || '';
            }
        });
    }
    
    // Handle Profile Update
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updatedData = {
                name: document.getElementById('edit-name').value,
                address: document.getElementById('edit-address').value,
                city: document.getElementById('edit-city').value,
                pincode: document.getElementById('edit-pincode').value,
            };
            try {
                const response = await fetch('https://grocy-backend.onrender.com/api/users/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
                    body: JSON.stringify(updatedData)
                });
                const data = await response.json();
                if (response.ok) {
                    alert('Profile updated successfully! New info will be available on next login.');
                    localStorage.setItem('userInfo', JSON.stringify(data));
                    window.location.reload(); 
                } else { throw new Error(data.message); }
            } catch (error) { alert(`Error: ${error.message}`); }
        });
    }
    
    // Show/Hide Order History for Customer
    if (showOrdersBtn) {
        showOrdersBtn.addEventListener('click', () => {
            const isHidden = orderHistoryDiv.style.display === 'none';
            orderHistoryDiv.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                fetchMyOrders();
            }
        });
    }

    async function fetchMyOrders() {
        if (!orderHistoryList) return;
        orderHistoryList.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
        try {
            const response = await fetch('https://grocy-backend.onrender.com/api/orders/myorders', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            if (!response.ok) throw new Error('Could not fetch orders.');
            const orders = await response.json();
            renderOrders(orders);
        } catch (error) {
            orderHistoryList.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }
    
    function renderOrders(orders) {
        if (!orderHistoryList) return;
        orderHistoryList.innerHTML = '';
        if (orders.length === 0) {
            orderHistoryList.innerHTML = '<p>You have no past orders.</p>';
        } else {
            orders.forEach(order => {
                const orderDiv = document.createElement('div');
                orderDiv.className = 'order-history-item';
                orderDiv.innerHTML = `
                    <p><strong>Order ID:</strong> ${order._id}</p>
                    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> ₹${order.totalAmount.toFixed(2)}</p>
                    <p><strong>Status:</strong> ${order.status}</p>
                `;
                orderHistoryList.appendChild(orderDiv);
            });
        }
    }
});
