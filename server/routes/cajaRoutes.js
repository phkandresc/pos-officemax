const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/cajaController');
const { verifyToken } = require('../middleware/authMiddleware');

// Sesión de caja
router.post('/abrir', verifyToken, cajaController.abrirCaja);
router.post('/cerrar', verifyToken, cajaController.cerrarCaja);
router.get('/activa', cajaController.getCajaActiva);

// Movimientos extraordinarios
router.post('/movimiento', verifyToken, cajaController.registrarMovimiento);
router.get('/:id/movimientos', verifyToken, cajaController.getMovimientos);

// Resumen para cuadre
router.get('/:id/resumen', verifyToken, cajaController.getResumen);

module.exports = router;
