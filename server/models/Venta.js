const { pool } = require('../config/db');
const Configuracion = require('./Configuracion');

class Venta {
    /**
     * Registra una venta completa dentro de una transacción SQL.
     * 
     * Pasos transaccionales:
     * 1. Leer IVA vigente de configuracion
     * 2. Validar sesión de caja abierta
     * 3. Calcular subtotales (base 0%, base IVA, monto IVA, total)
     * 4. INSERT en ventas
     * 5. INSERT en detalle_ventas por cada ítem (copia precio_compra, precio_venta, graba_iva)
     * 6. UPDATE stock_actual en productos (solo FISICO)
     * 7. INSERT en movimientos_inventario tipo VENTA por cada ítem FISICO
     * 8. UPDATE sesiones_caja sumando el total a total_ingresos_ventas
     * 
     * @param {number} sesionCajaId
     * @param {number} clienteId - ID del cliente (default 1 = CONSUMIDOR FINAL)
     * @param {Array} items - [{ producto_id, cantidad }]
     * @param {string} metodoPago - 'EFECTIVO' | 'TRANSFERENCIA'
     * @param {number|null} montoRecibido - Monto entregado por el cliente (obligatorio en EFECTIVO)
     * @returns {Object} { venta, detalle, cliente, cambio }
     */
    static async registrar(sesionCajaId, clienteId = 1, items, metodoPago = 'EFECTIVO', montoRecibido = null) {
        if (!items || items.length === 0) {
            throw new Error('La venta debe tener al menos un ítem.');
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Leer IVA vigente
            const ivaResult = await client.query(
                "SELECT valor FROM configuracion WHERE llave = 'IVA_PORCENTAJE'"
            );
            if (ivaResult.rows.length === 0) {
                throw new Error('Configuración IVA_PORCENTAJE no encontrada.');
            }
            const ivaPorcentaje = parseFloat(ivaResult.rows[0].valor);
            const ivaDecimal = ivaPorcentaje / 100;

            // 2. Validar sesión de caja abierta
            const sesionResult = await client.query(
                `SELECT id FROM sesiones_caja WHERE id = $1 AND estado = 'ABIERTA'`,
                [sesionCajaId]
            );
            if (sesionResult.rows.length === 0) {
                throw new Error('La sesión de caja no está abierta o no existe.');
            }

            // 3. Obtener productos y calcular subtotales
            let subtotalBase0 = 0;
            let subtotalBaseIVA = 0;
            const detalles = [];

            for (const item of items) {
                const prodResult = await client.query(
                    `SELECT id, nombre, tipo_item, precio_compra, precio_venta, stock_actual, graba_iva, activo
                     FROM productos WHERE id = $1 FOR UPDATE`,
                    [item.producto_id]
                );

                if (prodResult.rows.length === 0) {
                    throw new Error(`Producto con ID ${item.producto_id} no encontrado.`);
                }

                const prod = prodResult.rows[0];

                if (!prod.activo) {
                    throw new Error(`El producto "${prod.nombre}" está desactivado.`);
                }

                const cantidad = parseInt(item.cantidad, 10);
                if (cantidad <= 0) {
                    throw new Error(`La cantidad para "${prod.nombre}" debe ser mayor a 0.`);
                }

                // Validar stock para ítems FISICO
                if (prod.tipo_item === 'FISICO' && prod.stock_actual < cantidad) {
                    throw new Error(
                        `Stock insuficiente para "${prod.nombre}". ` +
                        `Disponible: ${prod.stock_actual}, Solicitado: ${cantidad}`
                    );
                }

                const precioUnitario = parseFloat(prod.precio_venta);
                const subtotal = cantidad * precioUnitario;
                const aplicaIVA = prod.graba_iva;

                if (aplicaIVA) {
                    subtotalBaseIVA += subtotal;
                } else {
                    subtotalBase0 += subtotal;
                }

                detalles.push({
                    producto_id: prod.id,
                    nombre: prod.nombre,
                    tipo_item: prod.tipo_item,
                    cantidad,
                    costo_unitario: parseFloat(prod.precio_compra),
                    precio_unitario: precioUnitario,
                    aplico_iva: aplicaIVA,
                    subtotal,
                    stock_actual: prod.stock_actual
                });
            }

            const montoIVA = parseFloat((subtotalBaseIVA * ivaDecimal).toFixed(2));
            const totalFactura = parseFloat((subtotalBase0 + subtotalBaseIVA + montoIVA).toFixed(2));

            // 4. INSERT en ventas (incluye monto_recibido)
            const ventaResult = await client.query(
                `INSERT INTO ventas 
                    (sesion_caja_id, cliente_id, subtotal_base_0, subtotal_base_iva, 
                     porcentaje_iva_aplicado, monto_iva, total_factura, monto_recibido, metodo_pago)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [
                    sesionCajaId, clienteId,
                    subtotalBase0.toFixed(2), subtotalBaseIVA.toFixed(2),
                    ivaPorcentaje, montoIVA.toFixed(2), totalFactura.toFixed(2),
                    montoRecibido,
                    metodoPago
                ]
            );
            const venta = ventaResult.rows[0];

            // 5-7. INSERT detalle + UPDATE stock + INSERT movimiento inventario
            const detallesInsertados = [];
            for (const det of detalles) {
                // 5. INSERT detalle_ventas
                const detResult = await client.query(
                    `INSERT INTO detalle_ventas 
                        (venta_id, producto_id, cantidad, costo_unitario, precio_unitario, aplico_iva, subtotal)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     RETURNING *`,
                    [
                        venta.id, det.producto_id, det.cantidad,
                        det.costo_unitario.toFixed(2), det.precio_unitario.toFixed(2),
                        det.aplico_iva, det.subtotal.toFixed(2)
                    ]
                );
                const detalleRow = detResult.rows[0];
                detalleRow.nombre = det.nombre; // agregar nombre para el ticket
                detallesInsertados.push(detalleRow);

                // 6 y 7. Solo para ítems FISICO: descontar stock e insertar movimiento
                if (det.tipo_item === 'FISICO') {
                    const nuevoStock = det.stock_actual - det.cantidad;

                    await client.query(
                        `UPDATE productos SET stock_actual = $1 WHERE id = $2`,
                        [nuevoStock, det.producto_id]
                    );

                    await client.query(
                        `INSERT INTO movimientos_inventario 
                            (producto_id, tipo_movimiento, cantidad, stock_resultante, referencia_id, motivo)
                         VALUES ($1, 'VENTA', $2, $3, $4, $5)`,
                        [
                            det.producto_id,
                            -det.cantidad,
                            nuevoStock,
                            venta.id,
                            `Venta #${venta.id}`
                        ]
                    );
                }
            }

            // 8. UPDATE sesion_caja sumando el total
            await client.query(
                `UPDATE sesiones_caja 
                 SET total_ingresos_ventas = total_ingresos_ventas + $1
                 WHERE id = $2`,
                [totalFactura.toFixed(2), sesionCajaId]
            );

            // Obtener datos del cliente (para ticket y respuesta)
            const clienteResult = await client.query(
                'SELECT id, tipo_identificacion, identificacion, nombre, direccion, telefono FROM clientes WHERE id = $1',
                [clienteId]
            );
            const clienteData = clienteResult.rows[0] || null;

            await client.query('COMMIT');

            // Calcular cambio
            const cambio = (montoRecibido != null)
                ? parseFloat((montoRecibido - totalFactura).toFixed(2))
                : null;

            return { venta, detalle: detallesInsertados, cliente: clienteData, cambio };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Obtiene una venta por ID con su detalle y nombres de productos.
     */
    static async getById(id) {
        const ventaResult = await pool.query(
            'SELECT * FROM ventas WHERE id = $1',
            [id]
        );
        if (ventaResult.rows.length === 0) return null;

        const detalleResult = await pool.query(
            `SELECT dv.*, p.nombre 
             FROM detalle_ventas dv
             JOIN productos p ON p.id = dv.producto_id
             WHERE dv.venta_id = $1
             ORDER BY dv.id`,
            [id]
        );

        return {
            venta: ventaResult.rows[0],
            detalle: detalleResult.rows
        };
    }

    /**
     * Obtiene ventas de una sesión de caja.
     */
    static async getBySession(sesionId) {
        const result = await pool.query(
            `SELECT v.*, 
                    (SELECT COUNT(*) FROM detalle_ventas WHERE venta_id = v.id) AS total_items
             FROM ventas v
             WHERE v.sesion_caja_id = $1
             ORDER BY v.fecha_hora DESC`,
            [sesionId]
        );
        return result.rows;
    }

    /**
     * Anula una venta: marca como ANULADA, revierte stock y actualiza sesión.
     * Todo dentro de una transacción.
     */
    static async anular(id) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Obtener la venta
            const ventaResult = await client.query(
                `SELECT * FROM ventas WHERE id = $1 FOR UPDATE`,
                [id]
            );
            if (ventaResult.rows.length === 0) {
                throw new Error('Venta no encontrada.');
            }
            const venta = ventaResult.rows[0];

            if (venta.estado === 'ANULADA') {
                throw new Error('Esta venta ya fue anulada.');
            }

            // Verificar que la sesión sigue abierta
            const sesionResult = await client.query(
                `SELECT id FROM sesiones_caja WHERE id = $1 AND estado = 'ABIERTA'`,
                [venta.sesion_caja_id]
            );
            if (sesionResult.rows.length === 0) {
                throw new Error('No se puede anular una venta de una sesión cerrada.');
            }

            // Obtener detalle para revertir stock
            const detalleResult = await client.query(
                `SELECT dv.*, p.tipo_item, p.stock_actual, p.nombre
                 FROM detalle_ventas dv
                 JOIN productos p ON p.id = dv.producto_id
                 WHERE dv.venta_id = $1`,
                [id]
            );

            // Revertir stock de ítems FISICO
            for (const det of detalleResult.rows) {
                if (det.tipo_item === 'FISICO') {
                    const nuevoStock = det.stock_actual + det.cantidad;

                    await client.query(
                        `UPDATE productos SET stock_actual = $1 WHERE id = $2`,
                        [nuevoStock, det.producto_id]
                    );

                    await client.query(
                        `INSERT INTO movimientos_inventario 
                            (producto_id, tipo_movimiento, cantidad, stock_resultante, referencia_id, motivo)
                         VALUES ($1, 'AJUSTE', $2, $3, $4, $5)`,
                        [
                            det.producto_id,
                            det.cantidad,
                            nuevoStock,
                            venta.id,
                            `Anulación venta #${venta.id}`
                        ]
                    );
                }
            }

            // Marcar venta como ANULADA
            await client.query(
                `UPDATE ventas SET estado = 'ANULADA' WHERE id = $1`,
                [id]
            );

            // Restar del total de la sesión
            await client.query(
                `UPDATE sesiones_caja 
                 SET total_ingresos_ventas = total_ingresos_ventas - $1
                 WHERE id = $2`,
                [venta.total_factura, venta.sesion_caja_id]
            );

            await client.query('COMMIT');
            return { message: 'Venta anulada correctamente', venta_id: id };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Obtiene todos los datos necesarios para reimprimir un ticket.
     * @param {number} id - ID de la venta
     * @returns {Object|null} { venta, detalle, cliente }
     */
    static async getDatosTicket(id) {
        const ventaResult = await pool.query(
            'SELECT * FROM ventas WHERE id = $1',
            [id]
        );
        if (ventaResult.rows.length === 0) return null;
        const venta = ventaResult.rows[0];

        const detalleResult = await pool.query(
            `SELECT dv.*, p.nombre 
             FROM detalle_ventas dv
             JOIN productos p ON p.id = dv.producto_id
             WHERE dv.venta_id = $1
             ORDER BY dv.id`,
            [id]
        );

        const clienteResult = await pool.query(
            'SELECT id, tipo_identificacion, identificacion, nombre, direccion, telefono FROM clientes WHERE id = $1',
            [venta.cliente_id]
        );

        return {
            venta,
            detalle: detalleResult.rows,
            cliente: clienteResult.rows[0] || null
        };
    }
}

module.exports = Venta;
