const express = require('express');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Rotas públicas
router.post('/registro', authController.registro);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Rotas protegidas
router.get('/me', auth, authController.obterUsuarioAtual);

module.exports = router;