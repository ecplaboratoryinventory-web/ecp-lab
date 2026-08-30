-- ============================================================================
-- MIGRATION: Damage Reports — per-item damage type
--
-- - Adds damage_type so each damaged item can be categorized:
--   minor_damage | major_damage | missing_parts | lost
--
-- Safe to re-run.
-- ============================================================================

ALTER TABLE damage_reports ADD COLUMN IF NOT EXISTS damage_type TEXT;

ALTER TABLE damage_reports DROP CONSTRAINT IF EXISTS damage_reports_damage_type_check;
ALTER TABLE damage_reports ADD CONSTRAINT damage_reports_damage_type_check
  CHECK (damage_type IS NULL OR damage_type IN ('minor_damage', 'major_damage', 'missing_parts', 'lost'));
