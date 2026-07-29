const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const validate = require('../middleware/validate');
const { productoSchema } = require('../validators/schemas');

// Rutas estáticas ANTES de /:id para evitar colisiones
router.get('/bajo-stock', productoController.getBajoStock);
router.get('/inactivos', productoController.getInactivos);

// Rutas CRUD base para /api/productos
router.get('/', productoController.getAllProductos);
router.get('/:id', productoController.getProductoById);
router.post('/', validate(productoSchema), productoController.createProducto);
router.put('/:id', validate(productoSchema), productoController.updateProducto);
router.delete('/:id', productoController.deactivateProducto);

// Reactivar producto desactivado
router.patch('/:id/reactivar', productoController.reactivarProducto);

module.exports = router;
