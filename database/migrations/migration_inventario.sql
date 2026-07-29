-- =========================================================================
-- MIGRACIÓN: Mejoras al módulo de inventario
-- Fecha: 2026-02-24
-- =========================================================================

-- 1. Campo de stock mínimo por producto (umbral de alerta)
ALTER TABLE productos ADD COLUMN IF NOT EXISTS stock_minimo INTEGER DEFAULT 5;

-- 2. Campo de descripción/notas internas
ALTER TABLE productos ADD COLUMN IF NOT EXISTS descripcion TEXT;
