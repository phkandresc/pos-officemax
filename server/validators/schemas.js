const { z } = require('zod');

const loginSchema = z.object({
    body: z.object({
        username: z.string().min(1, 'El usuario es obligatorio'),
        password: z.string().min(1, 'La contraseña es obligatoria')
    })
});

const ventaItemSchema = z.object({
    producto_id: z.number().int().positive('ID de producto inválido'),
    cantidad: z.number().positive('La cantidad debe ser mayor a 0')
});

const registrarVentaSchema = z.object({
    body: z.object({
        items: z.array(ventaItemSchema).min(1, 'Debe incluir al menos un ítem'),
        metodo_pago: z.enum(['EFECTIVO', 'TRANSFERENCIA']).optional(),
        cliente_id: z.number().int().optional(),
        monto_recibido: z.number().nonnegative('El monto recibido no puede ser negativo').optional(),
        imprimir_ticket: z.boolean().optional()
    }).refine((data) => {
        if ((!data.metodo_pago || data.metodo_pago === 'EFECTIVO') && data.monto_recibido == null) {
            return false;
        }
        return true;
    }, {
        message: 'El monto recibido es obligatorio para pagos en EFECTIVO',
        path: ['monto_recibido']
    })
});

const productoSchema = z.object({
    body: z.object({
        codigo_barras: z.string().optional(),
        nombre: z.string().min(1, 'El nombre es obligatorio'),
        tipo_item: z.enum(['FISICO', 'SERVICIO', 'RECARGA']),
        precio_compra: z.number().min(0, 'El precio de compra no puede ser negativo'),
        precio_venta: z.number().min(0, 'El precio de venta no puede ser negativo'),
        stock_actual: z.number().min(0, 'El stock no puede ser negativo').optional(),
        stock_minimo: z.number().min(0, 'El stock mínimo no puede ser negativo').optional(),
        graba_iva: z.boolean()
    })
});

module.exports = {
    loginSchema,
    registrarVentaSchema,
    productoSchema
};
