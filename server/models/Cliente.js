const { pool } = require('../config/db');

class Cliente {
    /**
     * Obtener clientes con paginación y búsqueda opcional.
     * @param {Object} filtros - { busqueda, pagina, limite }
     * @returns {{ clientes, total, pagina, totalPaginas }}
     */
    static async getAll(filtros = {}) {
        const { busqueda = '', pagina = 1, limite = 25 } = filtros;

        let conditions = [];
        let params = [];
        let paramIndex = 1;

        if (busqueda) {
            params.push(`%${busqueda}%`);
            conditions.push(`(nombre ILIKE $${paramIndex} OR identificacion ILIKE $${paramIndex})`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Total para paginación
        const countResult = await pool.query(
            `SELECT COUNT(*) AS total FROM clientes ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].total, 10);

        // Calcular offset
        const paginaNum = Math.max(1, parseInt(pagina, 10) || 1);
        const limiteNum = Math.min(200, Math.max(1, parseInt(limite, 10) || 25));
        const offset = (paginaNum - 1) * limiteNum;
        const totalPaginas = Math.ceil(total / limiteNum);

        // Consulta principal
        const dataParams = [...params, limiteNum, offset];
        const query = `
            SELECT id, tipo_identificacion, identificacion, nombre, 
                   direccion, telefono, correo, fecha_registro
            FROM clientes
            ${whereClause}
            ORDER BY nombre ASC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const result = await pool.query(query, dataParams);

        return {
            clientes: result.rows,
            total,
            pagina: paginaNum,
            totalPaginas
        };
    }

    // Obtener un cliente por ID
    static async getById(id) {
        const result = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
        return result.rows[0];
    }

    // Buscar por identificación exacta (para uso en POS)
    static async buscarPorIdentificacion(identificacion) {
        const result = await pool.query(
            'SELECT * FROM clientes WHERE identificacion = $1',
            [identificacion]
        );
        return result.rows[0];
    }

    // Crear nuevo cliente
    static async create(clienteData) {
        const { tipo_identificacion, identificacion, nombre, direccion, telefono, correo } = clienteData;

        const query = `
            INSERT INTO clientes (tipo_identificacion, identificacion, nombre, direccion, telefono, correo)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const params = [
            tipo_identificacion || 'CEDULA',
            identificacion,
            nombre.toUpperCase(),
            direccion || null,
            telefono || null,
            correo || null
        ];

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    // Actualizar cliente
    static async update(id, clienteData) {
        const { tipo_identificacion, identificacion, nombre, direccion, telefono, correo } = clienteData;

        const query = `
            UPDATE clientes
            SET tipo_identificacion = $1,
                identificacion = $2,
                nombre = $3,
                direccion = $4,
                telefono = $5,
                correo = $6
            WHERE id = $7
            RETURNING *;
        `;
        const params = [
            tipo_identificacion || 'CEDULA',
            identificacion,
            nombre.toUpperCase(),
            direccion || null,
            telefono || null,
            correo || null,
            id
        ];

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    // Eliminar cliente (ON DELETE RESTRICT protege si tiene ventas)
    static async delete(id) {
        const result = await pool.query(
            'DELETE FROM clientes WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0];
    }
}

module.exports = Cliente;
