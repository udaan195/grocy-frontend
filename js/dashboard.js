document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://grocy-backend.onrender.com';
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    if (!userInfo || !userInfo.token || (userInfo.role !== 'admin' && userInfo.role !== 'vendor')) {
        window.location.href = 'login.html';
        return;
    }

    // --- DOM Elements ---
    const addProductForm = document.getElementById('add-product-form');
    const myProductsListDiv = document.getElementById('my-products-list');
    const unitSelect = document.getElementById('product-unit');
    const pcsCountInput = document.getElementById('product-pcs-count');

    // --- Form Logic ---
    unitSelect.addEventListener('change', () => {
        pcsCountInput.style.display = unitSelect.value === 'pcs' ? 'block' : 'none';
    });

    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('product-id').value;
        const url = id ? `${API_BASE_URL}/api/products/${id}` : `${API_BASE_URL}/api/products`;
        const method = id ? 'PUT' : 'POST';

        const productData = {
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            price: document.getElementById('product-price').value,
            stock: document.getElementById('product-stock').value,
            category: document.getElementById('product-category').value,
            image: document.getElementById('product-image').value,
            unit: unitSelect.value,
            pcsCount: pcsCountInput.value || null,
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
                body: JSON.stringify(productData)
            });
            if (!response.ok) throw new Error('Failed to save product.');
            alert(`Product ${id ? 'updated' : 'added'} successfully!`);
            addProductForm.reset();
            pcsCountInput.style.display = 'none';
            document.getElementById('product-id').value = '';
            fetchMyProducts();
        } catch (error) { alert(error.message); }
    });

    // --- Data Fetching and Rendering ---
    async function fetchMyProducts() {
        const url = userInfo.role === 'admin' ? `${API_BASE_URL}/api/products` : `${API_BASE_URL}/api/products/myproducts`;
        try {
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${userInfo.token}` } });
            const products = await response.json();
            renderProducts(products);
        } catch (error) { myProductsListDiv.innerHTML = '<p>Could not load products.</p>'; }
    }

    function renderProducts(products) {
        myProductsListDiv.innerHTML = '';
        products.forEach(product => {
            const div = document.createElement('div');
            div.className = 'product-item-manage';
            div.innerHTML = `
                <p>${product.name} (Stock: ${product.stock})</p>
                <div>
                    <button class="edit-btn" data-id="${product._id}">Edit</button>
                    <button class="delete-btn" data-id="${product._id}">Delete</button>
                </div>
            `;
            myProductsListDiv.appendChild(div);
        });
    }

    myProductsListDiv.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this product?')) {
                // Delete logic here...
            }
        } else if (e.target.classList.contains('edit-btn')) {
            const product = (await (await fetch(`${API_BASE_URL}/api/products/${id}`)).json());
            document.getElementById('product-id').value = product._id;
            document.getElementById('product-name').value = product.name;
            // ... pre-fill all other form fields ...
            window.scrollTo(0, 0); // Scroll to top to see the form
        }
    });

    fetchMyProducts();
});

