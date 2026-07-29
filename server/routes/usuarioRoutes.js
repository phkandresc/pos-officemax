const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Obtener la lista de usuarios
router.get('/', usuarioController.obtenerUsuarios);

// Crear un nuevo usuario
router.post('/', usuarioController.crearUsuario);

// Actualizar un usuario existente
router.put('/:id', usuarioController.actualizarUsuario);

// Cambiar estado (activar/desactivar) de un usuario
router.patch('/:id/estado', usuarioController.cambiarEstadoUsuario);

module.exports = router;
