document.addEventListener('DOMContentLoaded', () => {
    const ordersTableBody = document.getElementById('orders-table-body');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    if (!userInfo || (userInfo.role !== 'admin' && userInfo.role !== 'vendor')) {
        alert('Access Denied.');
        window.location.href = 'index.html';
        return;
    }

    const API_URL = 'http://localhost:3000/api/orders';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userInfo.token}`
    };

    const fetchAllOrders = async () => {
    try {
        ordersTableBody.innerHTML = '<tr><td colspan="7">Loading orders...</td></tr>';
        
        // **यह रहा ज़रूरी बदलाव**
        // अगर एडमिन है तो सभी ऑर्डर लाओ, अगर वेंडर है तो सिर्फ उसके ऑर्डर लाओ
        const url = (userInfo.role === 'admin') 
            ? 'http://localhost:3000/api/orders' 
            : 'http://localhost:3000/api/orders/vendor';

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${userInfo.token}`
            }
        });

        if (!response.ok) { throw new Error('Failed to fetch orders.'); }
        const orders = await response.json();
        renderOrders(orders);
    } catch (error) {
        ordersTableBody.innerHTML = `<tr><td colspan="7" style="color:red;">Error: ${error.message}</td></tr>`;
    }
};


    const renderOrders = (orders) => {
        ordersTableBody.innerHTML = '';
        if (orders.length === 0) {
            ordersTableBody.innerHTML = '<tr><td colspan="7">No orders found.</td></tr>';
            return;
        }
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order._id}</td>
                <td>${order.user ? order.user.name : 'N/A'}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td><strong>₹${order.totalAmount.toFixed(2)}</strong></td>
                <td>${order.isPaid ? '<span class="status-paid">Yes</span>' : '<span class="status-not-paid">No</span>'}</td>
                <td id="status-${order._id}">${order.status}</td>
                <td>
                    <select class="status-select" data-id="${order._id}">
                        <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                        <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
            `;
            ordersTableBody.appendChild(row);
        });
    };

    ordersTableBody.addEventListener('change', async (e) => {
        if (e.target.classList.contains('status-select')) {
            const orderId = e.target.dataset.id;
            const newStatus = e.target.value;
            try {
                const response = await fetch(`${API_URL}/${orderId}/status`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ status: newStatus })
                });
                if (response.ok) {
                    document.getElementById(`status-${orderId}`).innerText = newStatus;
                    alert('Status updated successfully!');
                } else {
                    alert('Failed to update status.');
                }
            } catch (error) {
                alert('An error occurred.');
            }
        }
    });

    fetchOrders();
});
