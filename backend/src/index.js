require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Servir arquivos estáticos (fotos)
app.use('/uploads', express.static('uploads'));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/perfil', require('./routes/perfil'));
app.use('/api/busca', require('./routes/busca'));
app.use('/api/agendamentos', require('./routes/agendamentos')); // ✅ NOVA ROTA DE AGENDAMENTOS

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    mensagem: '✅ API funcionando perfeitamente',
    timestamp: new Date()
  });
});

// Erro 404
app.use((req, res) => {
  res.status(404).json({
    sucesso: false,
    mensagem: 'Rota não encontrada'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📝 Teste a API em http://localhost:${PORT}/api/health`);
});