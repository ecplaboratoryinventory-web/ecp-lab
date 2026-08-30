-- ============================================================================
-- MIGRATION: Damage Reports — partial replacement status
--
-- - Adds a 'partial' status (PENDING / REPLACED / PARTIAL)
-- - Adds replaced_quantity to track how many damaged units have been replaced
--
-- Safe to re-run.
-- ============================================================================

ALTER TABLE damage_reports DROP CONSTRAINT IF EXISTS damage_reports_status_check;
ALTER TABLE damage_reports ADD CONSTRAINT damage_reports_status_check
  CHECK (status IN ('pending', 'resolved', 'partial', 'dismissed'));

ALTER TABLE damage_reports ADD COLUMN IF NOT EXISTS replaced_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE damage_reports ADD COLUMN IF NOT EXISTS replaced_at TIMESTAMPTZ;
