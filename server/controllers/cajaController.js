const SesionCaja = require('../models/SesionCaja');

// POST /api/caja/abrir
exports.abrirCaja = async (req, res) => {
    try {
        const { saldo_inicial } = req.body;
        const usuario_id = req.user.id;
        const sesion = await SesionCaja.abrir(saldo_inicial || 0, usuario_id);
        res.status(201).json(sesion);
    } catch (err) {
        console.error('Error abriendo caja:', err);
        const status = err.message.includes('Ya existe') ? 409 : 500;
        res.status(status).json({ error: err.message });
    }
};

// POST /api/caja/cerrar
exports.cerrarCaja = async (req, res) => {
    try {
        const { saldo_final_real } = req.body;
        if (saldo_final_real == null) {
            return res.status(400).json({ error: 'saldo_final_real es obligatorio' });
        }
        const sesion = await SesionCaja.cerrar(parseFloat(saldo_final_real));
        res.json(sesion);
    } catch (err) {
        console.error('Error cerrando caja:', err);
        const status = err.message.includes('No hay') ? 404 : 500;
        res.status(status).json({ error: err.message });
    }
};

// GET /api/caja/activa
exports.getCajaActiva = async (req, res) => {
    try {
        const sesion = await SesionCaja.getActiva();
        res.json(sesion); // null si no hay sesión abierta
    } catch (err) {
        console.error('Error obteniendo caja activa:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// POST /api/caja/movimiento
exports.registrarMovimiento = async (req, res) => {
    try {
        const { tipo_movimiento, monto, descripcion } = req.body;

        if (!tipo_movimiento || !monto || !descripcion) {
            return res.status(400).json({ error: 'tipo_movimiento, monto y descripcion son obligatorios' });
        }

        const movimiento = await SesionCaja.registrarMovimiento(tipo_movimiento, parseFloat(monto), descripcion);
        res.status(201).json(movimiento);
    } catch (err) {
        console.error('Error registrando movimiento:', err);
        const status = err.message.includes('No hay') ? 404 : 400;
        res.status(status).json({ error: err.message });
    }
};

// GET /api/caja/:id/movimientos
exports.getMovimientos = async (req, res) => {
    try {
        const movimientos = await SesionCaja.getMovimientos(req.params.id);
        res.json(movimientos);
    } catch (err) {
        console.error('Error obteniendo movimientos:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// GET /api/caja/:id/resumen
exports.getResumen = async (req, res) => {
    try {
        const resumen = await SesionCaja.getResumen(req.params.id);
        res.json(resumen);
    } catch (err) {
        console.error('Error obteniendo resumen:', err);
        const status = err.message.includes('no encontrada') ? 404 : 500;
        res.status(status).json({ error: err.message });
    }
};
