const Venta = require('../models/Venta');
const SesionCaja = require('../models/SesionCaja');
const { imprimirTicket } = require('../services/ticketService');

// POST /api/ventas
exports.registrarVenta = async (req, res) => {
    try {
        const { items, metodo_pago, cliente_id, monto_recibido, imprimir_ticket } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Se requiere al menos un ítem en la venta' });
        }

        // Validar monto_recibido obligatorio en EFECTIVO
        const metodo = metodo_pago || 'EFECTIVO';
        if (metodo === 'EFECTIVO' && (monto_recibido == null || parseFloat(monto_recibido) <= 0)) {
            return res.status(400).json({ error: 'El monto recibido es obligatorio para pagos en efectivo' });
        }

        // Obtener la sesión activa automáticamente
        const sesion = await SesionCaja.getActiva();
        if (!sesion) {
            return res.status(400).json({ error: 'No hay una sesión de caja abierta. Abre la caja primero.' });
        }

        const montoRecibidoNum = monto_recibido != null ? parseFloat(monto_recibido) : null;

        const resultado = await Venta.registrar(
            sesion.id,
            cliente_id || 1,
            items,
            metodo,
            montoRecibidoNum
        );

        // Imprimir ticket solo si el cajero lo solicitó (checkbox)
        if (imprimir_ticket === true) {
            try {
                await imprimirTicket(resultado.venta, resultado.detalle, resultado.cliente);
            } catch (printErr) {
                console.error('⚠️  Error al imprimir ticket (la venta fue registrada):', printErr.message);
            }
        }

        res.status(201).json(resultado);
    } catch (err) {
        console.error('Error registrando venta:', err);
        // Errores de negocio conocidos
        if (err.message.includes('Stock insuficiente') ||
            err.message.includes('desactivado') ||
            err.message.includes('no encontrado') ||
            err.message.includes('mayor a 0')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: err.message || 'Error interno al registrar la venta' });
    }
};

// GET /api/ventas/:id
exports.getVentaById = async (req, res) => {
    try {
        const resultado = await Venta.getById(req.params.id);
        if (!resultado) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        res.json(resultado);
    } catch (err) {
        console.error('Error obteniendo venta:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// PATCH /api/ventas/:id/anular
exports.anularVenta = async (req, res) => {
    try {
        const resultado = await Venta.anular(req.params.id);
        res.json(resultado);
    } catch (err) {
        console.error('Error anulando venta:', err);
        if (err.message.includes('ya fue anulada') || err.message.includes('sesión cerrada')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: err.message || 'Error interno al anular' });
    }
};

// GET /api/ventas/sesion/:sesionId
exports.getVentasBySesion = async (req, res) => {
    try {
        const ventas = await Venta.getBySession(req.params.sesionId);
        res.json(ventas);
    } catch (err) {
        console.error('Error obteniendo ventas de la sesión:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// POST /api/ventas/:id/reimprimir
exports.reimprimirTicket = async (req, res) => {
    try {
        const datos = await Venta.getDatosTicket(req.params.id);
        if (!datos) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        if (datos.venta.estado === 'ANULADA') {
            return res.status(400).json({ error: 'No se puede reimprimir un ticket de una venta anulada' });
        }

        await imprimirTicket(datos.venta, datos.detalle, datos.cliente);
        res.json({ message: `Ticket de venta #${datos.venta.id} enviado a imprimir` });
    } catch (err) {
        console.error('Error reimprimiendo ticket:', err);
        res.status(500).json({ error: err.message || 'Error al reimprimir el ticket' });
    }
};
