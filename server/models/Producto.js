const { pool } = require('../config/db');

class Producto {
    /**
     * Obtener productos activos con paginación y filtros opcionales.
     * @param {Object} filtros - { busqueda, tipo_item, pagina, limite }
     * @returns {{ productos, total, pagina, totalPaginas }}
     */
    static async getAll(filtros = {}) {
        const { busqueda = '', tipo_item = '', pagina = 1, limite = 50 } = filtros;

        let conditions = ['activo = true'];
        let params = [];
        let paramIndex = 1;

        if (busqueda) {
            params.push(`%${busqueda}%`);
            conditions.push(`(nombre ILIKE $${paramIndex} OR codigo_barras ILIKE $${paramIndex})`);
            paramIndex++;
        }

        if (tipo_item) {
            params.push(tipo_item);
            conditions.push(`tipo_item = $${paramIndex}`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Obtener total para la paginación
        const countResult = await pool.query(
            `SELECT COUNT(*) AS total FROM productos ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].total, 10);

        // Calcular offset
        const paginaNum = Math.max(1, parseInt(pagina, 10) || 1);
        const limiteNum = Math.min(200, Math.max(1, parseInt(limite, 10) || 50));
        const offset = (paginaNum - 1) * limiteNum;
        const totalPaginas = Math.ceil(total / limiteNum);

        // Consulta principal con paginación
        const dataParams = [...params, limiteNum, offset];
        const query = `
            SELECT id, codigo_barras, nombre, tipo_item, precio_compra, precio_venta, 
                   stock_actual, stock_minimo, graba_iva, activo, descripcion, fecha_creacion 
            FROM productos 
            ${whereClause}
            ORDER BY nombre ASC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const result = await pool.query(query, dataParams);

        return {
            productos: result.rows,
            total,
            pagina: paginaNum,
            totalPaginas
        };
    }

    // Obtener un solo producto por ID
    static async getById(id) {
        const result = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
        return result.rows[0];
    }

    // Crear un nuevo producto
    static async create(productoData) {
        const { codigo_barras, nombre, tipo_item, precio_compra, precio_venta, graba_iva, stock_minimo, descripcion } = productoData;

        const query = `
            INSERT INTO productos (codigo_barras, nombre, tipo_item, precio_compra, precio_venta, stock_actual, graba_iva, stock_minimo, descripcion)
            VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8)
            RETURNING *;
        `;
        const params = [
            codigo_barras || null,
            nombre.toUpperCase(),
            tipo_item,
            precio_compra || 0.00,
            precio_venta,
            graba_iva !== undefined ? graba_iva : true,
            stock_minimo !== undefined ? parseInt(stock_minimo, 10) : 5,
            descripcion || null
        ];

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    // Actualizar producto (NO actualiza el stock directamente)
    static async update(id, productoData) {
        const { codigo_barras, nombre, tipo_item, precio_compra, precio_venta, graba_iva, stock_minimo, descripcion } = productoData;

        const query = `
            UPDATE productos 
            SET codigo_barras = $1, 
                nombre = $2, 
                tipo_item = $3, 
                precio_compra = $4, 
                precio_venta = $5, 
                graba_iva = $6,
                stock_minimo = $7,
                descripcion = $8
            WHERE id = $9 AND activo = true
            RETURNING *;
        `;

        const params = [
            codigo_barras || null,
            nombre.toUpperCase(),
            tipo_item,
            precio_compra || 0.00,
            precio_venta,
            graba_iva !== undefined ? graba_iva : true,
            stock_minimo !== undefined ? parseInt(stock_minimo, 10) : 5,
            descripcion || null,
            id
        ];

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    // Desactivar (ON DELETE RESTRICT compliance)
    static async deactivate(id) {
        const result = await pool.query(
            'UPDATE productos SET activo = false WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0];
    }

    // Reactivar un producto desactivado
    static async reactivar(id) {
        const result = await pool.query(
            'UPDATE productos SET activo = true WHERE id = $1 AND activo = false RETURNING *',
            [id]
        );
        return result.rows[0];
    }

    /**
     * Obtener productos con stock bajo su mínimo configurado.
     * Solo aplica a ítems FISICO activos.
     */
    static async getBajoStock() {
        const query = `
            SELECT id, codigo_barras, nombre, precio_venta, stock_actual, stock_minimo, descripcion
            FROM productos
            WHERE activo = true 
              AND tipo_item = 'FISICO' 
              AND stock_actual <= stock_minimo
            ORDER BY (stock_actual - stock_minimo) ASC, nombre ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Obtener todos los productos inactivos (desactivados).
     */
    static async getInactivos() {
        const query = `
            SELECT id, codigo_barras, nombre, tipo_item, precio_compra, precio_venta, 
                   stock_actual, stock_minimo, graba_iva, descripcion, fecha_creacion
            FROM productos
            WHERE activo = false
            ORDER BY nombre ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = Producto;
