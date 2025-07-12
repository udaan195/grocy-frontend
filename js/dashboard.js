document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & Initial Data ---
    const API_BASE_URL = 'https://grocy-backend.onrender.com';
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // --- Auth Guard ---
    if (!userInfo || !userInfo.token || (userInfo.role !== 'admin' && userInfo.role !== 'vendor')) {
        window.location.href = 'login.html';
        return;
    }

    // --- DOM Elements ---
    const welcomeMessage = document.getElementById('welcome-message');
    const addProductForm = document.getElementById('add-product-form');
    const myProductsListDiv = document.getElementById('my-products-list');
    const myOrdersListDiv = document.getElementById('my-orders-list');
    
    // Form fields
    const hiddenProductIdInput = document.getElementById('product-id');
    const nameInput = document.getElementById('product-name');
    const descriptionInput = document.getElementById('product-description');
    const priceInput = document.getElementById('product-price');
    const stockInput = document.getElementById('product-stock');
    const categorySelect = document.getElementById('product-category');
    const imageInput = document.getElementById('product-image');
    const unitSelect = document.getElementById('product-unit');
    const pcsCountInput = document.getElementById('product-pcs-count');
    
    // View switching buttons and views
    const showProductsBtn = document.getElementById('show-products-btn');
    const showOrdersBtn = document.getElementById('show-orders-btn');
    const productsView = document.getElementById('products-view');
    const ordersView = document.getElementById('orders-view');

    // --- Main Logic ---
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userInfo.token}`
    };

    // --- Function Definitions ---

    // 1. Welcome Message सेट करना
    if (welcomeMessage) {
        welcomeMessage.innerText = `Welcome, ${userInfo.name}!`;
    }

    // 2. दृश्य बदलना (Products/Orders)
    function switchView(view) {
        if (view === 'products') {
            productsView.style.display = 'block';
            ordersView.style.display = 'none';
            showProductsBtn.classList.add('active');
            showOrdersBtn.classList.remove('active');
            fetchMyProducts();
        } else {
            productsView.style.display = 'none';
            ordersView.style.display = 'block';
            showProductsBtn.classList.remove('active');
            showOrdersBtn.classList.add('active');
            fetchMyOrders();
        }
    }

    // 3. प्रोडक्ट्स लाना और दिखाना
    async function fetchMyProducts() {
        myProductsListDiv.innerHTML = '<p>Loading products...</p>';
        const url = userInfo.role === 'admin' ? `${API_BASE_URL}/api/products` : `${API_BASE_URL}/api/products/myproducts`;
        try {
            const response = await fetch(url, { headers });
            const products = await response.json();
            renderProducts(products);
        } catch (error) {
            myProductsListDiv.innerHTML = '<p>Could not load products.</p>';
        }
    }

    function renderProducts(products) {
        if (!products || products.length === 0) {
            myProductsListDiv.innerHTML = '<p>You have not added any products yet.</p>';
            return;
        }
        myProductsListDiv.innerHTML = '';
        products.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-item-manage'; // CSS के लिए क्लास
            div.innerHTML = `
                <div class="product-item-info">
                    <strong>${p.name}</strong>
                    <span>(Stock: ${p.stock})</span>
                </div>
                <div class="item-actions">
                    <button class="edit-btn" data-id="${p._id}">Edit</button>
                    <button class="delete-btn" data-id="${p._id}">Delete</button>
                </div>`;
            myProductsListDiv.appendChild(div);
        });
    }

    // 4. ऑर्डर्स लाना और दिखाना
    async function fetchMyOrders() {
        myOrdersListDiv.innerHTML = '<p>Loading orders...</p>';
        const url = userInfo.role === 'admin' ? `${API_BASE_URL}/api/orders` : `${API_BASE_URL}/api/orders/vendor`;
        try {
            const response = await fetch(url, { headers });
            const orders = await response.json();
            renderOrders(orders);
        } catch (error) {
            myOrdersListDiv.innerHTML = '<p>Could not load orders.</p>';
        }
    }

    function renderOrders(orders) {
        if (!orders || orders.length === 0) {
            myOrdersListDiv.innerHTML = '<p>No orders found.</p>';
            return;
        }
        myOrdersListDiv.innerHTML = '';
        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-item-manage'; // CSS के लिए क्लास
            orderCard.innerHTML = `
                <div>
                    <p><strong>Order ID:</strong> ${order._id.slice(-6)}</p> <p><strong>Customer:</strong> ${order.user ? order.user.name : 'N/A'}</p>
                    <p><strong>Total:</strong> ₹${order.totalAmount.toFixed(2)} | <strong>Status:</strong> ${order.status}</p>
                </div>
                <div class="item-actions">
                    <button class="update-status-btn" data-id="${order._id}">Update Status</button>
                </div>`;
            myOrdersListDiv.appendChild(orderCard);
        });
    }

    // 5. फॉर्म सबमिट (Add/Edit) करने का लॉजिक
    async function handleFormSubmit(e) {
        e.preventDefault();
        const id = hiddenProductIdInput.value;
        const url = id ? `${API_BASE_URL}/api/products/${id}` : `${API_BASE_URL}/api/products`;
        const method = id ? 'PUT' : 'POST';

        const productData = {
            name: nameInput.value,
            description: descriptionInput.value,
            price: priceInput.value,
            stock: stockInput.value,
            category: categorySelect.value,
            image: imageInput.value,
            unit: unitSelect.value,
            pcsCount: pcsCountInput.value || null,
        };

        try {
            const response = await fetch(url, { method, headers, body: JSON.stringify(productData) });
            if (!response.ok) throw new Error('Failed to save product.');
            alert(`Product ${id ? 'updated' : 'added'} successfully!`);
            addProductForm.reset();
            pcsCountInput.style.display = 'none';
            hiddenProductIdInput.value = '';
            fetchMyProducts(); // लिस्ट रिफ्रेश करें
        } catch (error) {
            alert(error.message);
        }
    }

    // 6. प्रोडक्ट लिस्ट में Edit/Delete क्लिक का लॉजिक
    async function handleProductListClick(e) {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this product?')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE', headers });
                    if (!response.ok) throw new Error('Failed to delete product.');
                    alert('Product deleted successfully.');
                    fetchMyProducts();
                } catch (error) { alert(error.message); }
            }
        } else if (e.target.classList.contains('edit-btn')) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/products/${id}`);
                const product = await response.json();
                
                hiddenProductIdInput.value = product._id;
                nameInput.value = product.name;
                descriptionInput.value = product.description;
                priceInput.value = product.price;
                stockInput.value = product.stock;
                categorySelect.value = product.category;
                imageInput.value = product.image;
                unitSelect.value = product.unit;
                pcsCountInput.value = product.pcsCount || '';
                pcsCountInput.style.display = product.unit === 'pcs' ? 'block' : 'none';
                
                window.scrollTo({ top: 0, behavior: 'smooth' }); // फॉर्म देखने के लिए ऊपर स्क्रॉल करें
            } catch (error) {
                alert('Could not fetch product details for editing.');
            }
        }
    }

    // --- Event Listeners को सेट करना ---
    showProductsBtn.addEventListener('click', () => switchView('products'));
    showOrdersBtn.addEventListener('click', () => switchView('orders'));
    unitSelect.addEventListener('change', () => {
        pcsCountInput.style.display = unitSelect.value === 'pcs' ? 'block' : 'none';
    });
    addProductForm.addEventListener('submit', handleFormSubmit);
    myProductsListDiv.addEventListener('click', handleProductListClick);

    // --- Initial Load ---
    switchView('products'); // डैशबोर्ड लोड होते ही प्रोडक्ट्स का व्यू दिखाएं
});
