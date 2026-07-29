const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');

// Rutas base para /api/inventario
router.post('/movimiento', inventarioController.registrarMovimiento);
router.get('/movimientos', inventarioController.getMovimientos);

module.exports = router;
