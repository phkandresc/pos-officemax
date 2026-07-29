const { pool } = require('../config/db');

class MovimientoInventario {
    /**
     * Registra un movimiento de stock usando transacciones seguras de PostgreSQL.
     * @param {Object} data - { producto_id, tipo_movimiento, cantidad, motivo, referencia_id }
     */
    static async registrarMovimiento(data) {
        const { producto_id, tipo_movimiento, cantidad, motivo, referencia_id } = data;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            console.log(`Iniciando movimiento [${tipo_movimiento}] para producto: ${producto_id}, Cantidad enviada: ${cantidad}`);

            // 1. Validar producto y hacer FOR UPDATE para bloquear concurrencia (evita condiciones de carrera)
            const prodResult = await client.query(
                'SELECT stock_actual, tipo_item, activo FROM productos WHERE id = $1 FOR UPDATE',
                [producto_id]
            );

            if (prodResult.rows.length === 0) {
                throw new Error('Producto no encontrado');
            }

            const producto = prodResult.rows[0];

            if (!producto.activo) {
                throw new Error('No se pueden realizar movimientos de stock en productos inactivos');
            }

            if (producto.tipo_item !== 'FISICO') {
                throw new Error('Los movimientos de stock solo aplican para ítems físicos (No Servicios/Recargas)');
            }

            // 2. Lógica de cálculo estricta según el tipo de movimiento
            let stockResultante;
            let cantidadRealAEjecutar = parseInt(cantidad, 10);
            const stockActual = parseInt(producto.stock_actual, 10);

            if (isNaN(cantidadRealAEjecutar) || cantidadRealAEjecutar <= 0) {
                throw new Error('La cantidad del movimiento debe ser un número entero mayor a cero');
            }

            switch (tipo_movimiento) {
                case 'ENTRADA':
                    stockResultante = stockActual + cantidadRealAEjecutar;
                    break;
                case 'SALIDA':
                    if (stockActual < cantidadRealAEjecutar) {
                        throw new Error(`Stock insuficiente. Stock actual: ${stockActual}, Intento de salida: ${cantidadRealAEjecutar}`);
                    }
                    stockResultante = stockActual - cantidadRealAEjecutar;
                    break;
                case 'AJUSTE':
                    // Ajuste directo: El cajero dice "Hay 50 en percha", stockResultante es 50 directamente.
                    stockResultante = cantidadRealAEjecutar;
                    cantidadRealAEjecutar = stockResultante - stockActual;
                    break;
                case 'VENTA':
                    throw new Error('El movimiento tipo VENTA está reservado para el proceso del POS, no uso directo desde inventario');
                default:
                    throw new Error('Tipo de movimiento inválido');
            }

            // 3. Actualizar la tabla productos
            await client.query(
                'UPDATE productos SET stock_actual = $1 WHERE id = $2',
                [stockResultante, producto_id]
            );

            // 4. Registrar en la tabla movimientos_inventario para auditoría
            const movResult = await client.query(
                `INSERT INTO movimientos_inventario 
                (producto_id, tipo_movimiento, cantidad, stock_resultante, motivo, referencia_id)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [producto_id, tipo_movimiento, cantidadRealAEjecutar, stockResultante, motivo || null, referencia_id || null]
            );

            await client.query('COMMIT');
            return movResult.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtiene el historial de movimientos de inventario (Kardex) con paginación y filtros.
     * @param {Object} filtros - { producto_id, busqueda, fecha_desde, fecha_hasta, pagina, limite }
     * @returns {{ movimientos, total, pagina, totalPaginas }}
     */
    static async getMovimientos(filtros = {}) {
        const { producto_id, busqueda, fecha_desde, fecha_hasta, pagina = 1, limite = 50 } = filtros;

        let conditions = [];
        let params = [];
        let paramIndex = 1;

        // Filtro por producto_id exacto
        if (producto_id) {
            params.push(parseInt(producto_id, 10));
            conditions.push(`mi.producto_id = $${paramIndex}`);
            paramIndex++;
        }

        // Filtro por búsqueda de nombre/código de producto
        if (busqueda) {
            params.push(`%${busqueda}%`);
            conditions.push(`(p.nombre ILIKE $${paramIndex} OR p.codigo_barras ILIKE $${paramIndex})`);
            paramIndex++;
        }

        // Filtro por rango de fechas
        if (fecha_desde) {
            params.push(fecha_desde);
            conditions.push(`mi.fecha_hora >= $${paramIndex}::timestamptz`);
            paramIndex++;
        }

        if (fecha_hasta) {
            params.push(fecha_hasta);
            conditions.push(`mi.fecha_hora <= ($${paramIndex}::date + INTERVAL '1 day')`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Obtener total para paginación
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM movimientos_inventario mi
            JOIN productos p ON mi.producto_id = p.id
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total, 10);

        // Calcular paginación
        const paginaNum = Math.max(1, parseInt(pagina, 10) || 1);
        const limiteNum = Math.min(500, Math.max(1, parseInt(limite, 10) || 50));
        const offset = (paginaNum - 1) * limiteNum;
        const totalPaginas = Math.ceil(total / limiteNum);

        // Consulta principal con paginación
        const dataParams = [...params, limiteNum, offset];
        const dataQuery = `
            SELECT 
                mi.id,
                mi.producto_id,
                p.nombre AS producto_nombre,
                p.codigo_barras,
                mi.tipo_movimiento,
                mi.cantidad,
                mi.stock_resultante,
                mi.referencia_id,
                mi.motivo,
                mi.fecha_hora
            FROM movimientos_inventario mi
            JOIN productos p ON mi.producto_id = p.id
            ${whereClause}
            ORDER BY mi.fecha_hora DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const result = await pool.query(dataQuery, dataParams);

        return {
            movimientos: result.rows,
            total,
            pagina: paginaNum,
            totalPaginas
        };
    }
}

module.exports = MovimientoInventario;


