const { pool } = require('../config/db');

class SesionCaja {
    /**
     * Obtiene la sesión de caja actualmente abierta (solo puede haber una).
     * @returns {Object|null}
     */
    static async getActiva() {
        const result = await pool.query(
            `SELECT * FROM sesiones_caja WHERE estado = 'ABIERTA' LIMIT 1`
        );
        return result.rows[0] || null;
    }

    /**
     * Obtiene una sesión por su ID.
     */
    static async getById(id) {
        const result = await pool.query(
            'SELECT * FROM sesiones_caja WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Abre una nueva sesión de caja. Valida que no exista otra abierta.
     * @param {number} saldoInicial
     * @param {number} usuarioId - ID del usuario que abre la caja
     * @returns {Object} La sesión creada
     */
    static async abrir(saldoInicial, usuarioId) {
        // Verificar que no hay otra sesión abierta
        const activa = await this.getActiva();
        if (activa) {
            throw new Error('Ya existe una sesión de caja abierta. Ciérrala antes de abrir una nueva.');
        }

        const result = await pool.query(
            `INSERT INTO sesiones_caja (saldo_inicial, saldo_final_esperado, usuario_id)
             VALUES ($1, $1, $2)
             RETURNING *`,
            [saldoInicial || 0, usuarioId]
        );
        return result.rows[0];
    }

    /**
     * Cierra la sesión de caja activa.
     * Calcula saldo_final_esperado = saldo_inicial + ventas + recargas + ingresos_extra - egresos.
     * @param {number} saldoFinalReal - Monto físico contado
     * @returns {Object} La sesión cerrada con los totales
     */
    static async cerrar(saldoFinalReal) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Obtener sesión activa
            const sesionResult = await client.query(
                `SELECT * FROM sesiones_caja WHERE estado = 'ABIERTA' LIMIT 1 FOR UPDATE`
            );
            if (sesionResult.rows.length === 0) {
                throw new Error('No hay una sesión de caja abierta para cerrar.');
            }
            const sesion = sesionResult.rows[0];

            // Calcular totales de movimientos extraordinarios
            const movResult = await client.query(
                `SELECT 
                    COALESCE(SUM(CASE WHEN tipo_movimiento = 'INGRESO_EXTRA' THEN monto ELSE 0 END), 0) AS total_ingresos_extra,
                    COALESCE(SUM(CASE WHEN tipo_movimiento = 'EGRESO' THEN monto ELSE 0 END), 0) AS total_egresos
                 FROM movimientos_caja
                 WHERE sesion_caja_id = $1`,
                [sesion.id]
            );
            const { total_ingresos_extra, total_egresos } = movResult.rows[0];

            // Saldo esperado = inicial + ventas + recargas + ingresos_extra - egresos
            const saldoEsperado = parseFloat(sesion.saldo_inicial)
                + parseFloat(sesion.total_ingresos_ventas)
                + parseFloat(sesion.total_ingresos_recargas)
                + parseFloat(total_ingresos_extra)
                - parseFloat(total_egresos);

            // Cerrar sesión
            const updateResult = await client.query(
                `UPDATE sesiones_caja 
                 SET estado = 'CERRADA',
                     fecha_cierre = CURRENT_TIMESTAMP,
                     saldo_final_esperado = $1,
                     saldo_final_real = $2
                 WHERE id = $3
                 RETURNING *`,
                [saldoEsperado.toFixed(2), saldoFinalReal, sesion.id]
            );

            await client.query('COMMIT');

            const sesionCerrada = updateResult.rows[0];
            sesionCerrada.total_ingresos_extra = parseFloat(total_ingresos_extra);
            sesionCerrada.total_egresos = parseFloat(total_egresos);
            sesionCerrada.diferencia = (parseFloat(saldoFinalReal) - saldoEsperado).toFixed(2);

            return sesionCerrada;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Registra un movimiento extraordinario (ingreso/egreso) en la sesión activa.
     */
    static async registrarMovimiento(tipoMovimiento, monto, descripcion) {
        const sesion = await this.getActiva();
        if (!sesion) {
            throw new Error('No hay una sesión de caja abierta para registrar movimientos.');
        }

        const validTipos = ['INGRESO_EXTRA', 'EGRESO'];
        if (!validTipos.includes(tipoMovimiento)) {
            throw new Error('Tipo de movimiento inválido. Debe ser INGRESO_EXTRA o EGRESO.');
        }

        const result = await pool.query(
            `INSERT INTO movimientos_caja (sesion_caja_id, tipo_movimiento, monto, descripcion)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [sesion.id, tipoMovimiento, monto, descripcion]
        );

        return result.rows[0];
    }

    /**
     * Obtiene los movimientos extraordinarios de una sesión.
     */
    static async getMovimientos(sesionId) {
        const result = await pool.query(
            `SELECT * FROM movimientos_caja 
             WHERE sesion_caja_id = $1 
             ORDER BY fecha_hora DESC`,
            [sesionId]
        );
        return result.rows;
    }

    /**
     * Genera un resumen completo de la sesión para cuadre.
     */
    static async getResumen(sesionId) {
        // Datos de la sesión
        const sesion = await this.getById(sesionId);
        if (!sesion) throw new Error('Sesión de caja no encontrada.');

        // Movimientos extraordinarios
        const movResult = await pool.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'INGRESO_EXTRA' THEN monto ELSE 0 END), 0) AS total_ingresos_extra,
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'EGRESO' THEN monto ELSE 0 END), 0) AS total_egresos,
                COUNT(*) AS total_movimientos
             FROM movimientos_caja
             WHERE sesion_caja_id = $1`,
            [sesionId]
        );

        // Conteo de ventas
        const ventasResult = await pool.query(
            `SELECT 
                COUNT(*) AS total_ventas,
                COALESCE(SUM(CASE WHEN estado = 'COMPLETADA' THEN total_factura ELSE 0 END), 0) AS total_vendido,
                COALESCE(SUM(CASE WHEN estado = 'ANULADA' THEN total_factura ELSE 0 END), 0) AS total_anulado
             FROM ventas
             WHERE sesion_caja_id = $1`,
            [sesionId]
        );

        const mov = movResult.rows[0];
        const ventas = ventasResult.rows[0];

        const saldoEsperado = parseFloat(sesion.saldo_inicial)
            + parseFloat(sesion.total_ingresos_ventas)
            + parseFloat(sesion.total_ingresos_recargas)
            + parseFloat(mov.total_ingresos_extra)
            - parseFloat(mov.total_egresos);

        return {
            sesion,
            ventas: {
                cantidad: parseInt(ventas.total_ventas, 10),
                total_vendido: parseFloat(ventas.total_vendido),
                total_anulado: parseFloat(ventas.total_anulado)
            },
            movimientos: {
                cantidad: parseInt(mov.total_movimientos, 10),
                total_ingresos_extra: parseFloat(mov.total_ingresos_extra),
                total_egresos: parseFloat(mov.total_egresos)
            },
            saldo_esperado: parseFloat(saldoEsperado.toFixed(2)),
            diferencia: sesion.saldo_final_real
                ? parseFloat((parseFloat(sesion.saldo_final_real) - saldoEsperado).toFixed(2))
                : null
        };
    }
}

module.exports = SesionCaja;
