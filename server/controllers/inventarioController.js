const MovimientoInventario = require('../models/MovimientoInventario');

// POST /api/inventario/movimiento
exports.registrarMovimiento = async (req, res) => {
    try {
        const { producto_id, tipo_movimiento, cantidad, motivo } = req.body;

        // Validaciones básicas de payload
        if (!producto_id || !tipo_movimiento || cantidad === undefined) {
            return res.status(400).json({ error: 'Faltan parámetros obligatorios: producto_id, tipo_movimiento, cantidad' });
        }

        const resultado = await MovimientoInventario.registrarMovimiento({
            producto_id,
            tipo_movimiento,
            cantidad,
            motivo
        });

        res.status(201).json({
            mensaje: 'Movimiento de stock registrado exitosamente',
            movimiento: resultado
        });

    } catch (err) {
        console.error('Error registrando movimiento de stock:', err);
        const errorMsg = err.message;
        const codigosClienteError = ['Stock insuficiente', 'Producto no encontrado', 'tipo_item', 'reservado', 'inactivos', 'mayor a cero'];

        const esErrorCausadoPorCliente = codigosClienteError.some(k => errorMsg.includes(k));

        if (esErrorCausadoPorCliente) {
            return res.status(400).json({ error: errorMsg });
        }

        res.status(500).json({ error: 'Error interno o de Base de Datos procesando el movimiento' });
    }
};

// GET /api/inventario/movimientos
// Soporta: ?producto_id=1 &busqueda=texto &fecha_desde=2026-01-01 &fecha_hasta=2026-02-28 &pagina=1 &limite=50
exports.getMovimientos = async (req, res) => {
    try {
        const { producto_id, busqueda, fecha_desde, fecha_hasta, pagina, limite } = req.query;

        const resultado = await MovimientoInventario.getMovimientos({
            producto_id: producto_id ? parseInt(producto_id, 10) : undefined,
            busqueda,
            fecha_desde,
            fecha_hasta,
            pagina,
            limite
        });

        res.json(resultado);

    } catch (err) {
        console.error('Error obteniendo movimientos de inventario (Kardex):', err);
        res.status(500).json({ error: 'Error interno o de Base de Datos al obtener el kardex' });
    }
};
