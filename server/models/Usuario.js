const { pool } = require('../config/db');

class Usuario {
    static async findByUsername(username) {
        const query = `
            SELECT id, nombre, usuario, password_hash, rol, activo
            FROM usuarios
            WHERE usuario = $1
        `;
        const result = await pool.query(query, [username]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = `
            SELECT id, nombre, usuario, rol, activo
            FROM usuarios
            WHERE id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async findAll({ limite = 25, offset = 0, busqueda = '' }) {
        let query = `
            SELECT id, nombre, usuario, rol, activo, fecha_creacion
            FROM usuarios
        `;
        const params = [];

        if (busqueda) {
            query += ` WHERE nombre ILIKE $1 OR usuario ILIKE $1 `;
            params.push(`%${busqueda}%`);
        }

        query += ` ORDER BY id ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limite, offset);

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async count({ busqueda = '' }) {
        let query = `SELECT COUNT(*) FROM usuarios`;
        const params = [];
        
        if (busqueda) {
            query += ` WHERE nombre ILIKE $1 OR usuario ILIKE $1 `;
            params.push(`%${busqueda}%`);
        }

        const result = await pool.query(query, params);
        return parseInt(result.rows[0].count);
    }

    static async create(data) {
        const query = `
            INSERT INTO usuarios (nombre, usuario, password_hash, rol, activo)
            VALUES ($1, $2, $3, $4, COALESCE($5, true))
            RETURNING id, nombre, usuario, rol, activo
        `;
        const params = [data.nombre, data.usuario, data.password_hash, data.rol, data.activo];
        
        const result = await pool.query(query, params);
        return result.rows[0];
    }

    static async update(id, data) {
        // Build dynamic update query depending if password is provided
        let query = `UPDATE usuarios SET `;
        const params = [];
        let index = 1;

        if (data.nombre) {
            query += `nombre = $${index++}, `;
            params.push(data.nombre);
        }
        if (data.usuario) {
            query += `usuario = $${index++}, `;
            params.push(data.usuario);
        }
        if (data.rol) {
            query += `rol = $${index++}, `;
            params.push(data.rol);
        }
        if (data.password_hash) {
            query += `password_hash = $${index++}, `;
            params.push(data.password_hash);
        }
        if (data.activo !== undefined) {
            query += `activo = $${index++}, `;
            params.push(data.activo);
        }

        // Remove last comma
        query = query.replace(/, $/, ' ');
        
        query += ` WHERE id = $${index} RETURNING id, nombre, usuario, rol, activo`;
        params.push(id);

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    static async toggleEstado(id, nuevoEstado) {
        const query = `
            UPDATE usuarios 
            SET activo = $1 
            WHERE id = $2 
            RETURNING id, nombre, usuario, rol, activo
        `;
        const result = await pool.query(query, [nuevoEstado, id]);
        return result.rows[0];
    }
}

module.exports = Usuario;

