document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const submitButton = document.querySelector('.btn-login');

    // Limpar mensagem de erro anterior
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';

    // Desabilitar botão e mostrar loading
    submitButton.disabled = true;
    submitButton.classList.add('loading');

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Login bem-sucedido
            localStorage.setItem('token', data.token);
            window.location.href = '../sistemaSeguros.html'; // Redirecionar para sistemaSeguros.html
        } else {
            // Mostrar erro
            errorMessage.textContent = data.message || 'Erro ao fazer login';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro:', error);
        errorMessage.textContent = 'Erro de conexão. Tente novamente.';
        errorMessage.style.display = 'block';
    } finally {
        // Reabilitar botão e remover loading
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
    }
});