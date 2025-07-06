document.addEventListener('DOMContentLoaded', () => {
    const productDetailsContainer = document.getElementById('product-details-container');

    // URL से प्रोडक्ट की ID निकालें
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        productDetailsContainer.innerHTML = '<h2>Product not found!</h2>';
        return;
    }

    const fetchProduct = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/products/${productId}`);
            if (!response.ok) {
                throw new Error('Product not found');
            }
            const product = await response.json();
            renderProductDetails(product);
        } catch (error) {
            productDetailsContainer.innerHTML = `<h2>Error: ${error.message}</h2>`;
        }
    };

    const renderProductDetails = (product) => {
        productDetailsContainer.innerHTML = `
            <div class="product-detail-layout">
                <div class="product-detail-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-detail-info">
                    <h1>${product.name}</h1>
                    <p class="price">
                        ₹${product.price}
                        ${product.unit ? `<span class="unit-text">(${product.unit})</span>` : ''}
                    </p>
                    <p class="description">${product.description || 'No description available.'}</p>
                    <button class="add-to-cart-btn" data-product-id="${product._id}">Add to Cart</button>
                </div>
            </div>
        `;
    };

    fetchProduct();
});
