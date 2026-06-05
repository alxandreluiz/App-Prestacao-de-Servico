const express = require('express');
const perfilController = require('../controllers/perfilController');
const { auth, ehPrestador } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configurar upload de fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Rotas protegidas
router.get('/me', auth, perfilController.obterPerfil);
router.put('/cliente', auth, perfilController.atualizarPerfilCliente);
router.put('/prestador', auth, ehPrestador, perfilController.atualizarPerfilPrestador);
router.post('/foto', auth, upload.single('foto'), perfilController.uploadFotoPerfil);

// Rotas públicas (listagem de prestadores)
router.get('/prestadores', perfilController.listarPrestadores);
router.get('/prestadores/:id', perfilController.obterPrestador);

module.exports = router;