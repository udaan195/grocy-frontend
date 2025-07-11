document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://grocy-backend.onrender.com';
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    if (!userInfo || !userInfo.token || (userInfo.role !== 'admin' && userInfo.role !== 'vendor')) {
        window.location.href = 'login.html';
        return;
    }

    const addProductForm = document.getElementById('add-product-form');
    const myProductsListDiv = document.getElementById('my-products-list');

    // Add Product Form Logic
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productData = {
            name: document.getElementById('product-name').value,
            price: document.getElementById('product-price').value,
            category: document.getElementById('product-category').value,
            image: document.getElementById('product-image').value,
            unit: document.getElementById('product-unit').value,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                throw new Error('Failed to add product.');
            }

            alert('Product added successfully!');
            addProductForm.reset();
            fetchMyProducts(); // Refresh the product list

        } catch (error) {
            alert(error.message);
        }
    });

    // Fetch and Display Vendor's Products
    async function fetchMyProducts() {
        try {
            // एडमिन के लिए सभी प्रोडक्ट, वेंडर के लिए सिर्फ अपने प्रोडक्ट
            const url = userInfo.role === 'admin' 
                ? `${API_BASE_URL}/api/products` 
                : `${API_BASE_URL}/api/products/myproducts`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const products = await response.json();

            myProductsListDiv.innerHTML = ''; // Clear list
            products.forEach(product => {
                const productDiv = document.createElement('div');
                productDiv.className = 'product-card'; // Use your existing class
                productDiv.innerHTML = `<h3>${product.name}</h3><p>₹${product.price}</p>`;
                myProductsListDiv.appendChild(productDiv);
            });

        } catch (error) {
            myProductsListDiv.innerHTML = '<p>Could not load products.</p>';
        }
    }

    // Initial load
    fetchMyProducts();
});
