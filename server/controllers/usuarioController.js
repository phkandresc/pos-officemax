const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');

const obtenerUsuarios = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1;
        const limite = parseInt(req.query.limite) || 25;
        const busqueda = req.query.q || '';
        const offset = (pagina - 1) * limite;

        const usuarios = await Usuario.findAll({ limite, offset, busqueda });
        const total = await Usuario.count({ busqueda });

        res.json({
            usuarios,
            total,
            pagina,
            totalPaginas: Math.ceil(total / limite)
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener usuarios' });
    }
};

const crearUsuario = async (req, res) => {
    try {
        const { nombre, usuario, password, rol, activo } = req.body;

        if (!nombre || !usuario || !password || !rol) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        // Verificar si existe el username
        const existeUsuario = await Usuario.findByUsername(usuario);
        if (existeUsuario) {
            return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
        }

        // Hashear contraseña
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const nuevoUsuario = await Usuario.create({
            nombre,
            usuario,
            password_hash,
            rol,
            activo
        });

        res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario: nuevoUsuario });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ error: 'Error interno al crear usuario' });
    }
};

const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, usuario, password, rol, activo } = req.body;

        // Validar si el usuario a actualizar existe
        const userToUpdate = await Usuario.findById(id);
        if (!userToUpdate) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Si actualizan el username, comprobar que no colisiona con otro existente
        if (usuario && usuario !== userToUpdate.usuario) {
            const existeRelacion = await Usuario.findByUsername(usuario);
            if (existeRelacion) {
                return res.status(400).json({ error: 'El nuevo nombre de usuario ya está en uso por otra persona' });
            }
        }

        const dataToUpdate = { nombre, usuario, rol, activo };

        // Si mandan password, hashearlo
        if (password && password.trim() !== '') {
            const saltRounds = 10;
            dataToUpdate.password_hash = await bcrypt.hash(password, saltRounds);
        }

        const usuarioActualizado = await Usuario.update(id, dataToUpdate);
        
        res.json({ mensaje: 'Usuario actualizado exitosamente', usuario: usuarioActualizado });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error interno al actualizar usuario' });
    }
};

const cambiarEstadoUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        
        const userToUpdate = await Usuario.findById(id);
        if (!userToUpdate) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const nuevoEstado = !userToUpdate.activo;
        const usuarioActualizado = await Usuario.toggleEstado(id, nuevoEstado);

        res.json({ mensaje: 'Estado del usuario actualizado exitosamente', usuario: usuarioActualizado });
    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        res.status(500).json({ error: 'Error interno al actualizar estado' });
    }
};

module.exports = {
    obtenerUsuarios,
    crearUsuario,
    actualizarUsuario,
    cambiarEstadoUsuario
};
