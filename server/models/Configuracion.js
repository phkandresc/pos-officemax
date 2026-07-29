const { pool } = require('../config/db');

class Configuracion {
    /**
     * Obtiene el porcentaje de IVA actualmente configurado.
     * @returns {number} Porcentaje de IVA (ej. 15.00)
     */
    static async getIVA() {
        const result = await pool.query(
            "SELECT valor FROM configuracion WHERE llave = 'IVA_PORCENTAJE'"
        );
        if (result.rows.length === 0) {
            throw new Error('Configuración IVA_PORCENTAJE no encontrada en la base de datos');
        }
        return parseFloat(result.rows[0].valor);
    }

    /**
     * Obtiene un valor de configuración por su llave.
     * @param {string} llave
     * @returns {string|null}
     */
    static async get(llave) {
        const result = await pool.query(
            'SELECT valor FROM configuracion WHERE llave = $1',
            [llave]
        );
        return result.rows[0]?.valor || null;
    }
}

module.exports = Configuracion;
