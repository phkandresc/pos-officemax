const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

// Ruta estática antes de /:id para evitar colisiones
router.get('/sesion/:sesionId', ventaController.getVentasBySesion);

// CRUD de ventas
router.post('/', ventaController.registrarVenta);
router.get('/:id', ventaController.getVentaById);
router.patch('/:id/anular', ventaController.anularVenta);
router.post('/:id/reimprimir', ventaController.reimprimirTicket);

module.exports = router;
