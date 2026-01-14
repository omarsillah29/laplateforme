document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

/**
 * Gère la soumission du formulaire de connexion.
 * @param {Event} e - L'événement de soumission.
 */
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    const hashedPassword = CryptoJS.SHA256(password).toString();

    try {
        const response = await fetch('api/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: hashedPassword
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            saveSession({ email: result.user.email, role: result.user.role });
            window.location.href = 'dashboard.html';
        } else {
            errorMessage.textContent = result.error || 'Email ou mot de passe incorrect.';
        }
    } catch (error) {
        errorMessage.textContent = 'Une erreur de communication avec le serveur est survenue.';
        console.error('Login error:', error);
    }
}

/**
 * Gère la soumission du formulaire d'inscription.
 * @param {Event} e - L'événement de soumission.
 */
async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.textContent = '';

    // 1. Valider le domaine de l'email
    if (!email.endsWith('@laplateforme.io')) {
        errorMessage.textContent = 'L\'adresse email doit appartenir au domaine @laplateforme.io.';
        return;
    }

    // 2. Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
        errorMessage.textContent = 'Les mots de passe ne correspondent pas.';
        return;
    }

    const hashedPassword = CryptoJS.SHA256(password).toString();

    try {
        const response = await fetch('api/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: hashedPassword
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            window.location.href = 'index.html';
        } else {
            errorMessage.textContent = result.error || 'Une erreur est survenue.';
        }
    } catch (error) {
        errorMessage.textContent = 'Une erreur de communication avec le serveur est survenue.';
        console.error('Registration error:', error);
    }
}
