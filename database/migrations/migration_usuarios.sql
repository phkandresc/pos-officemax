-- Migración para el sistema de Usuarios y Autenticación

-- 1. Crear tabla de Usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('ADMINISTRADOR', 'CAJERO')),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insertar usuarios por defecto
-- La contraseña para 'admin' es 'admin123'
-- La contraseña para 'cajero' es 'caja123'
-- Estos hashes fueron generados con bcrypt (saltRounds=10)
INSERT INTO usuarios (nombre, usuario, password_hash, rol) VALUES 
('Administrador', 'admin', '$2b$10$bfCSJMiZVHOOLF42POQonub.1r7FBBfvoncaC3L94aKZPWZkdRWM6', 'ADMINISTRADOR'),
('Cajero', 'cajero', '$2b$10$vP.s.tIItb/hJ6k7Z.eJReQpXj051aG90J0S3X/T3c9aFp3Kq6A/a', 'CAJERO');

-- 3. Añadir columna usuario_id a sesiones_caja (Opcional, pero recomendado para trazar la caja al usuario)
ALTER TABLE sesiones_caja 
ADD COLUMN usuario_id INTEGER REFERENCES usuarios(id) ON DELETE RESTRICT;

-- Asignar las sesiones existentes al primer usuario creado por defecto (Administrador) para evitar nulos
UPDATE sesiones_caja SET usuario_id = 1 WHERE usuario_id IS NULL;
