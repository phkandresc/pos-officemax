const { z } = require('zod');

// Middleware genérico para validar peticiones con Zod
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({
                status: 'error',
                message: 'Error de validación',
                errores: err.issues.map(e => ({
                    campo: e.path.join('.'),
                    mensaje: e.message
                }))
            });
        }
        next(err);
    }
};

module.exports = validate;
