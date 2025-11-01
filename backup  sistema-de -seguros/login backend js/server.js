const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Simulação de banco de dados de usuários
const users = {
    'nicolas': 'bolo123',
    'user': 'user123'
};

// Endpoint de login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
    }

    if (users[username] && users[username] === password) {
        // Gerar token simples (em produção, use JWT)
        const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
        res.json({ token, message: 'Login realizado com sucesso' });
    } else {
        res.status(401).json({ message: 'Credenciais inválidas' });
    }
});

// Iniciar servidor
app.listen(PORT, 'localhost', () => {
    console.log(`Servidor iniciado em http://localhost:${PORT}`);
});