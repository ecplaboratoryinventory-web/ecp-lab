-- ============================================================================
-- MIGRATION: Consolidate categories into 3 fixed mains
-- Electronics / Chemistry / Physics
--
-- - Creates the 3 main categories if missing
-- - Re-points subcategories + equipment from the 15 legacy categories
-- - Deletes the legacy categories (leftover subcategories cascade-delete)
--
-- Safe to re-run.
-- ============================================================================

BEGIN;

-- 1. Ensure the 3 fixed main categories exist -------------------------------
INSERT INTO categories (name, description)
SELECT v.name, v.description
FROM (
  VALUES
    ('Electronics', 'Electronics and computer laboratory equipment'),
    ('Chemistry',   'Chemistry laboratory equipment'),
    ('Physics',     'Physics laboratory equipment')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = v.name);

-- 2. Legacy -> main category mapping ----------------------------------------
CREATE TEMP TABLE cat_map (old_name TEXT, new_name TEXT);
INSERT INTO cat_map (old_name, new_name) VALUES
  -- Electronics
  ('Electronic',          'Electronics'),
  ('Microcontrollers',    'Electronics'),
  ('Single Board PCs',    'Electronics'),
  ('Desktop PCs',         'Electronics'),
  ('Components',          'Electronics'),
  ('Electrical Equipment','Electronics'),
  -- Chemistry
  ('Chemicals',           'Chemistry'),
  ('Chemicals and Reagents', 'Chemistry'),
  ('Glassware',           'Chemistry'),
  ('Consumables',         'Chemistry'),
  -- Physics
  ('Microscopes',         'Physics'),
  ('Measuring Instruments', 'Physics'),
  ('Optical Equipment',   'Physics'),
  ('Mechanics Equipment', 'Physics'),
  ('Safety Equipment',    'Physics');

-- Sanity: every legacy category must be mapped before touching data
DO $$
DECLARE
  unmapped INT;
BEGIN
  SELECT count(*) INTO unmapped
  FROM categories c
  WHERE c.name NOT IN ('Electronics', 'Chemistry', 'Physics')
    AND c.name NOT IN (SELECT old_name FROM cat_map);
  IF unmapped > 0 THEN
    RAISE EXCEPTION '% legacy category/categories are not mapped — aborting', unmapped;
  END IF;
END $$;

-- 3. Re-parent subcategories to their new main category ---------------------
UPDATE subcategories s
SET category_id = c_new.id
FROM categories c_old, categories c_new, cat_map m
WHERE s.category_id = c_old.id
  AND c_old.name = m.old_name
  AND c_new.name = m.new_name;

-- 4. Re-point equipment to its new main category ----------------------------
-- (subcategory_id stays valid: those rows were re-parented above)
UPDATE equipment e
SET category_id = c_new.id
FROM categories c_old, categories c_new, cat_map m
WHERE e.category_id = c_old.id
  AND c_old.name = m.old_name
  AND c_new.name = m.new_name;

-- 5. Delete legacy categories ------------------------------------------------
DELETE FROM categories
WHERE name IN (SELECT old_name FROM cat_map);

DROP TABLE cat_map;

COMMIT;
