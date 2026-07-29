const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Rutas estáticas ANTES de /:id para evitar colisiones
router.get('/buscar/:identificacion', clienteController.buscarPorIdentificacion);

// Rutas CRUD base para /api/clientes
router.get('/', clienteController.getAllClientes);
router.get('/:id', clienteController.getClienteById);
router.post('/', clienteController.createCliente);
router.put('/:id', clienteController.updateCliente);
router.delete('/:id', clienteController.deleteCliente);

module.exports = router;
