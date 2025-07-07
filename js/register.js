document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const response = await fetch('https://grocy-backend.onrender.com/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Registration successful! Please login.');
                window.location.href = 'login.html'; // लॉगिन पेज पर भेजें (जो हम बाद में बनाएँगे)
            } else {
                alert(`Error: ${data.message}`); // सर्वर से आया एरर दिखाएँ
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Could not connect to the server.');
        }
    });
});
