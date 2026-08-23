-- ============================================================================
-- MIGRATION: Add description column to subcategories
-- Run this in Supabase SQL Editor before using the new subcategory form.
-- ============================================================================

ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS description TEXT;
