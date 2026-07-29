-- =========================================================================
-- MIGRACIÓN: Mejoras al módulo de ventas
-- Fecha: 2026-02-25
-- =========================================================================

-- 1. Campo para registrar el monto que el cliente entrega (cálculo de cambio)
-- NULL cuando el pago es por TRANSFERENCIA
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS monto_recibido NUMERIC(10, 2);
