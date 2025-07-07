document.addEventListener('DOMContentLoaded', async () => {
    // 1. URL से टोकन निकालें
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
        try {
            // 2. इस टोकन का उपयोग करके यूजर की पूरी प्रोफाइल जानकारी पाएँ
            const response = await fetch('https://grocy-backend.onrender.com/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const userProfile = await response.json();

            if (response.ok) {
                // 3. पूरी जानकारी (प्रोफाइल + टोकन) को localStorage में सेव करें
                localStorage.setItem('userInfo', JSON.stringify({ ...userProfile, token }));
                // 4. मुख्य पेज पर भेजें
                window.location.href = 'index.html';
            } else {
                throw new Error('Could not fetch user profile.');
            }
        } catch (error) {
            console.error('Auth callback error:', error);
            alert('Authentication failed. Please try again.');
            window.location.href = 'login.html';
        }
    } else {
        alert('Authentication token not found.');
        window.location.href = 'login.html';
    }
});
