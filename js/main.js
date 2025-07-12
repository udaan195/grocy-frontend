// Simplified main.js for final testing

document.addEventListener('DOMContentLoaded', () => {
    // --- सिर्फ टेस्ट के लिए ज़रूरी चीज़ें ---
    const productListDiv = document.getElementById('product-list');
    const API_BASE_URL = 'https://grocy-backend.onrender.com';

    // 1. पहला अलर्ट: क्या यह स्क्रिप्ट चल रही है?
    alert("टेस्ट 1: पेज लोड हो गया है और main.js चल रही है।");

    // 2. देखें कि ज़रूरी HTML एलिमेंट मौजूद है या नहीं
    if (!productListDiv) {
        alert("सबसे बड़ी गलती: आपके index.html में id='product-list' वाला div नहीं मिला।");
        return;
    }

    // 3. सर्वर से डेटा लाने का फंक्शन
    async function testFetchProducts() {
        productListDiv.innerHTML = "<h2>सर्वर से प्रोडक्ट्स लाने की कोशिश की जा रही है...</h2>";
        try {
            alert("टेस्ट 2: अब सर्वर से प्रोडक्ट्स मंगाए जा रहे हैं...");
            const response = await fetch(`${API_BASE_URL}/api/products`);
            
            alert(`टेस्ट 3: सर्वर से जवाब मिला! Status Code है: ${response.status}`);

            if (!response.ok) {
                throw new Error(`सर्वर ने एरर दिया: ${response.status}`);
            }

            const products = await response.json();
            
            if (products.length > 0) {
                alert(`सफलता! सर्वर से ${products.length} प्रोडक्ट्स मिल गए।`);
                productListDiv.innerHTML = `<h1 style='color:green;'>टेस्ट सफल! प्रोडक्ट्स लोड हो गए।</h1>`;
            } else {
                alert("टेस्ट तो ठीक हुआ, लेकिन सर्वर ने 0 प्रोडक्ट्स भेजे। शायद डेटाबेस खाली है।");
                productListDiv.innerHTML = "<h1>टेस्ट ठीक है, पर सर्वर से कोई प्रोडक्ट नहीं मिला।</h1>";
            }

        } catch (error) {
            alert(`टेस्ट फेल! एरर आया है: ${error.message}`);
            productListDiv.innerHTML = `<h1 style='color:red;'>टेस्ट फेल हो गया। एरर: ${error.message}</h1>`;
        }
    }

    // फंक्शन को चलाएं
    testFetchProducts();
});
