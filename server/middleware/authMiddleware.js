const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_pos_papeleria_2024';

// Middleware genérico para verificar token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No autorizado, falta token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// Middleware para verificar si el rol es Administrador
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    if (req.user.rol !== 'ADMINISTRADOR') {
        return res.status(403).json({ error: 'Acceso denegado, se requiere rol de Administrador' });
    }

    next();
};

module.exports = {
    verifyToken,
    requireAdmin
};
