// frontend/js/login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Login form submitted.');
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('https://grocy-backend.onrender.com/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            console.log('Data received from server:', data);

            if (response.ok && data.token) {
                console.log('Login successful, saving to localStorage...');
                localStorage.setItem('userInfo', JSON.stringify(data));
                console.log('Saved to localStorage. Redirecting to index.html...');
                window.location.href = 'index.html';
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('FATAL: Login request failed.', error);
            alert(`Error: ${error.message}`);
        }
    });
});
