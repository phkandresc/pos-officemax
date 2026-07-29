-- Script de Optimización de Rendimiento
-- Diseñado para PC de bajos recursos y base de datos PostgreSQL

-- 1. Habilitar extensión de Trigramas (pg_trgm)
-- Esta extensión permite hacer búsquedas difusas muy rápidas con el operador ILIKE ('%texto%').
-- Requiere permisos de superusuario o que el usuario sea propietario de la BD.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Crear Índice GIN para nombres de productos
-- Este índice acelerará masivamente las búsquedas por nombre sin importar dónde esté el término.
CREATE INDEX IF NOT EXISTS idx_productos_nombre_trgm 
ON productos USING gin (nombre gin_trgm_ops);

-- 3. Crear Índice GIN para código de barras
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras_trgm 
ON productos USING gin (codigo_barras gin_trgm_ops);

-- 4. Índice tradicional B-Tree para el estado 'activo'
-- Optimizará los filtros WHERE activo = true
CREATE INDEX IF NOT EXISTS idx_productos_activo
ON productos (activo);

-- 5. Índice B-Tree para ordenamientos (opcional pero ayuda)
CREATE INDEX IF NOT EXISTS idx_productos_nombre_asc
ON productos (nombre ASC);

-- 6. Actualizar las estadísticas de la base de datos
-- Ayuda al planificador de consultas de PostgreSQL a saber cómo usar los índices nuevos.
ANALYZE productos;
