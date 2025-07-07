document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const productForm = document.getElementById('product-form');
    const productListDiv = document.getElementById('product-list-admin');
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const productIdInput = document.getElementById('productId');
    const nameInput = document.getElementById('name');
    const priceInput = document.getElementById('price');
    const categoryInput = document.getElementById('category');
    const imageInput = document.getElementById('image');
    const unitInput = document.getElementById('product-unit');
    const minBuyInput = document.getElementById('min-buy');
    const maxBuyInput = document.getElementById('max-buy');
    
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // --- Auth & Admin/Vendor Check ---
    if (!userInfo || (userInfo.role !== 'admin' && userInfo.role !== 'vendor')) {
        alert('Access Denied. You must be an admin or vendor.');
        window.location.href = 'index.html';
        return;
    }

    const API_BASE_URL = 'https://grocy-backend.onrender.com/api/products';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userInfo.token}`
    };

    // --- Functions ---
    const fetchProducts = async () => {
        // अगर यूजर एडमिन है, तो सभी प्रोडक्ट लाओ। अगर वेंडर है, तो सिर्फ उसके प्रोडक्ट लाओ।
        const url = (userInfo.role === 'admin') ? API_BASE_URL : `https://grocy-backend.onrender.com/myproducts`;
        
        try {
            const response = await fetch(url, { headers });
            const products = await response.json();
            renderProducts(products);
        } catch (error) { 
            console.error('Error fetching products:', error); 
        }
    };

    const renderProducts = (products) => {
        productListDiv.innerHTML = '';
        products.forEach(product => {
            const item = document.createElement('div');
            item.className = 'product-item';
            item.innerHTML = `
                <div class="product-item-details">
                    <strong>${product.name}</strong><br>
                    <small>${product.category} - ₹${product.price} ${product.unit ? `(${product.unit})` : ''}</small>
                </div>
                <div class="product-item-actions">
                    <button class="btn-edit" data-id="${product._id}"><i class="fa fa-pencil"></i></button>
                    <button class="btn-delete" data-id="${product._id}"><i class="fa fa-trash"></i></button>
                </div>
            `;
            productListDiv.appendChild(item);
        });
    };

    const resetForm = () => {
        productForm.reset();
        productIdInput.value = '';
        formTitle.innerText = 'Add New Product';
        submitBtn.innerText = 'Add Product';
        cancelBtn.style.display = 'none';
    };

    // --- Event Listeners ---
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = productIdInput.value;
        const isEditing = !!id;
        
        const url = isEditing ? `${API_BASE_URL}/${id}` : API_BASE_URL;
        const method = isEditing ? 'PUT' : 'POST';

        const productData = {
            name: nameInput.value,
            price: priceInput.value,
            category: categoryInput.value,
            image: imageInput.value,
            unit: unitInput.value,
            minBuyQuantity: minBuyInput.value,
            maxBuyQuantity: maxBuyInput.value
        };

        try {
            const response = await fetch(url, { method, headers, body: JSON.stringify(productData) });
            if (response.ok) {
                alert(`Product ${isEditing ? 'updated' : 'added'} successfully!`);
                resetForm();
                fetchProducts();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            alert('An error occurred.');
        }
    });

    productListDiv.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;
        
        if (target.classList.contains('btn-delete')) {
            if (confirm('Are you sure you want to delete this product?')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE', headers });
                    if (response.ok) {
                        alert('Product deleted!');
                        fetchProducts();
                    } else { alert('Error deleting product.'); }
                } catch (error) { console.error('Delete error:', error); }
            }
        }
        
        if (target.classList.contains('btn-edit')) {
            const response = await fetch(`${API_BASE_URL}/${id}`);
            const product = await response.json();
            if (product) {
                productIdInput.value = product._id;
                nameInput.value = product.name;
                priceInput.value = product.price;
                categoryInput.value = product.category;
                imageInput.value = product.image;
                unitInput.value = product.unit || '';
                minBuyInput.value = product.minBuyQuantity || '1';
                maxBuyInput.value = product.maxBuyQuantity || '';
                formTitle.innerText = 'Edit Product';
                submitBtn.innerText = 'Update Product';
                cancelBtn.style.display = 'inline-block';
                window.scrollTo(0, 0);
            }
        }
    });
    
    cancelBtn.addEventListener('click', resetForm);
    
    // --- Initial Load ---
    fetchProducts();
});
