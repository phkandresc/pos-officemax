-- =========================================================================
-- SISTEMA POS - PAPELERÍA (Versión Final - MVP Usuario Único)
-- Motor: PostgreSQL
-- =========================================================================

-- 1. TABLA DE CONFIGURACIÓN GLOBAL
CREATE TABLE configuracion (
    id SERIAL PRIMARY KEY,
    llave VARCHAR(50) UNIQUE NOT NULL,
    valor VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO configuracion (llave, valor, descripcion) 
VALUES ('IVA_PORCENTAJE', '15.00', 'Porcentaje de IVA actual para cálculos internos (SRI)');

-- =========================================================================

-- 2. TABLA DE CLIENTES
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    tipo_identificacion VARCHAR(20) DEFAULT 'CEDULA' CHECK (tipo_identificacion IN ('CEDULA', 'RUC', 'PASAPORTE', 'OTRO')),
    identificacion VARCHAR(20) UNIQUE NOT NULL, 
    nombre VARCHAR(150) NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    correo VARCHAR(100),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cliente por defecto para las ventas rápidas en mostrador
INSERT INTO clientes (tipo_identificacion, identificacion, nombre, direccion) 
VALUES ('OTRO', '9999999999999', 'CONSUMIDOR FINAL', 'CUENCA');

-- =========================================================================

-- 3. TABLA DE PRODUCTOS Y SERVICIOS
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    codigo_barras VARCHAR(50) UNIQUE, 
    nombre VARCHAR(150) NOT NULL,
    tipo_item VARCHAR(20) NOT NULL CHECK (tipo_item IN ('FISICO', 'SERVICIO', 'RECARGA')),
    precio_compra NUMERIC(10, 2) DEFAULT 0.00,
    precio_venta NUMERIC(10, 2) NOT NULL,
    stock_actual INTEGER DEFAULT 0,
    graba_iva BOOLEAN DEFAULT TRUE, 
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_codigo ON productos(codigo_barras);

-- =========================================================================

-- 4. TABLA DE SESIONES DE CAJA
CREATE TABLE sesiones_caja (
    id SERIAL PRIMARY KEY,
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    saldo_inicial NUMERIC(10, 2) DEFAULT 0.00, 
    total_ingresos_ventas NUMERIC(10, 2) DEFAULT 0.00,
    total_ingresos_recargas NUMERIC(10, 2) DEFAULT 0.00, 
    saldo_final_esperado NUMERIC(10, 2) DEFAULT 0.00,
    saldo_final_real NUMERIC(10, 2), 
    estado VARCHAR(20) DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'CERRADA'))
);

-- =========================================================================

-- 5. TABLA DE MOVIMIENTOS DE CAJA (Egresos e Ingresos Extraordinarios)
CREATE TABLE movimientos_caja (
    id SERIAL PRIMARY KEY,
    sesion_caja_id INTEGER NOT NULL REFERENCES sesiones_caja(id) ON DELETE RESTRICT,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('INGRESO_EXTRA', 'EGRESO')),
    monto NUMERIC(10, 2) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================

-- 6. TABLA DE VENTAS 
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    sesion_caja_id INTEGER NOT NULL REFERENCES sesiones_caja(id) ON DELETE RESTRICT,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT DEFAULT 1,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    subtotal_base_0 NUMERIC(10, 2) DEFAULT 0.00,
    subtotal_base_iva NUMERIC(10, 2) DEFAULT 0.00,
    porcentaje_iva_aplicado NUMERIC(5, 2) NOT NULL, 
    monto_iva NUMERIC(10, 2) DEFAULT 0.00,
    total_factura NUMERIC(10, 2) NOT NULL,
    
    metodo_pago VARCHAR(20) DEFAULT 'EFECTIVO' CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA')),
    estado VARCHAR(20) DEFAULT 'COMPLETADA' CHECK (estado IN ('COMPLETADA', 'ANULADA'))
);

-- =========================================================================

-- 7. TABLA DE DETALLE DE VENTAS
CREATE TABLE detalle_ventas (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL,
    costo_unitario NUMERIC(10, 2) NOT NULL, -- Imprescindible para el cálculo de utilidades exactas si el precio_compra cambia en el futuro
    precio_unitario NUMERIC(10, 2) NOT NULL, 
    aplico_iva BOOLEAN NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    
    CONSTRAINT chk_subtotal CHECK (subtotal = cantidad * precio_unitario)
);

-- =========================================================================

-- 8. TABLA DE MOVIMIENTOS DE INVENTARIO
CREATE TABLE movimientos_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'VENTA')),
    cantidad INTEGER NOT NULL, 
    stock_resultante INTEGER NOT NULL,
    referencia_id INTEGER, 
    motivo VARCHAR(255), 
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_movimientos_producto ON movimientos_inventario(producto_id);