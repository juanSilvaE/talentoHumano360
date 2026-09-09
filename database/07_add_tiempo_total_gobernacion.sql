-- ═══════════════════════════════════════════════════════════════════════════
-- 07_add_tiempo_total_gobernacion.sql
-- Agrega columna tiempo_total_gobernacion en rel_principal
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE rel_principal ADD COLUMN IF NOT EXISTS tiempo_total_gobernacion TEXT;

COMMENT ON COLUMN rel_principal.tiempo_total_gobernacion IS 'Tiempo total acumulado en la gobernación (tiempo de servicio + otro tiempo)';
