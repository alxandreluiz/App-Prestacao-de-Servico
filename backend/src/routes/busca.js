const express = require('express');
const buscaController = require('../controllers/buscaController');
const { auth, ehPrestador } = require('../middleware/auth');

const router = express.Router();

// Rotas públicas
router.get('/prestadores/localizacao', buscaController.buscarPrestadores);
router.get('/prestadores/cidade', buscaController.buscarPorCidade);
router.get('/especialidades', buscaController.obterEspecialidades);
router.get('/prestadores/:id', buscaController.obterPrestadorDetalhado);

// Rotas protegidas (apenas prestadores)
router.post('/geolocalizacao', auth, ehPrestador, buscaController.atualizarGeolocalizacao);

module.exports = router;