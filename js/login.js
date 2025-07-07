document.addEventListener('DOMContentLoaded', () => {
  
  const API_BASE_URL = 'https://grocy-backend.onrender.com'; // **यहाँ अपना Render URL डालें**
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('https://grocy-backend.onrender.com/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();

            if (response.ok) {
                // **यह सबसे ज़रूरी हिस्सा है**
                // हम यूजर की पूरी जानकारी (नाम, ईमेल, आदि) और टोकन दोनों को सेव करेंगे
                localStorage.setItem('userInfo', JSON.stringify(data));
                window.location.href = 'index.html';
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });
});
