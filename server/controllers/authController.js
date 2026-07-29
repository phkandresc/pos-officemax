const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');

const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_pos_papeleria_2024';

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Faltan credenciales' });
        }

        const usuario = await Usuario.findByUsername(username);

        if (!usuario) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        if (!usuario.activo) {
            return res.status(403).json({ error: 'Usuario inactivo' });
        }

        const passwordMatch = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        // Generar JWT
        const token = jwt.sign(
            { id: usuario.id, username: usuario.usuario, rol: usuario.rol },
            JWT_SECRET,
            { expiresIn: '12h' } // El token expira en 12 horas
        );

        res.json({
            token,
            user: {
                id: usuario.id,
                nombre: usuario.nombre,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getMe = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.user.id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ user: usuario });
    } catch (error) {
        console.error('Error en getMe:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    login,
    getMe
};
