-- ECP Lab — Idempotent Migration for Phase 0/1 Audit Fixes (Aug 14, 2026)
-- Safe to run multiple times. Run AFTER database/schema.sql + rls-policies.sql
-- have been applied to a fresh DB, OR against an existing live DB that may
-- already contain some of these objects (uses IF NOT EXISTS / DROP IF EXISTS).
--
-- Apply order: schema.sql -> rls-policies.sql -> functions.sql
-- This file only contains the DELTA (new columns, changed policies, functions).

-- ============================================================================
-- 1. New columns
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code TEXT;

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS subject_tags TEXT[] DEFAULT '{}';
ALTER TABLE equipment ALTER COLUMN subject_tags SET DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS enrolled_subjects TEXT[] DEFAULT '{}';
ALTER TABLE users ALTER COLUMN enrolled_subjects SET DEFAULT '{}';

-- ============================================================================
-- 2. RLS policy changes (drop + recreate so reruns are safe)
-- ============================================================================

-- Constrain borrow_requests INSERT (students can't fake faculty/approved)
DROP POLICY IF EXISTS "Users create borrow requests" ON borrow_requests;
CREATE POLICY "Users create borrow requests" ON borrow_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      (request_type = 'student' AND status = 'pending')
      OR (request_type = 'faculty' AND status IN ('pending', 'approved') AND is_faculty())
      OR is_admin_or_staff()
    )
  );

-- Allow admins/staff to create damage reports on behalf of students
DROP POLICY IF EXISTS "Admin insert damage reports" ON damage_reports;
CREATE POLICY "Admin insert damage reports" ON damage_reports
  FOR INSERT WITH CHECK (is_admin_or_staff());

-- Tighten activity_logs insert (no anonymous writes)
DROP POLICY IF EXISTS "System insert activity logs" ON activity_logs;
CREATE POLICY "System insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 3. RPC functions (from database/functions.sql — CREATE OR REPLACE is idempotent)
-- ============================================================================

CREATE OR REPLACE FUNCTION lookup_login(identifier TEXT)
RETURNS TABLE (email TEXT, role TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email, u.role
  FROM users u
  WHERE u.id_no = identifier
    AND u.role IN ('student', 'faculty')
    AND u.status = 'active'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION lookup_login(TEXT) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION lookup_login(TEXT) FROM PUBLIC;

CREATE OR REPLACE FUNCTION submit_faculty_borrow(
  p_items JSONB,
  p_purpose TEXT,
  p_borrow_date DATE,
  p_return_date DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_class_schedule_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id UUID;
  v_item JSONB;
  v_eq_id UUID;
  v_qty INTEGER;
  v_avail INTEGER;
BEGIN
  IF NOT is_faculty() THEN
    RAISE EXCEPTION 'Only faculty can submit faculty borrow requests';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Select at least one item';
  END IF;

  IF p_purpose IS NULL OR btrim(p_purpose) = '' THEN
    RAISE EXCEPTION 'Purpose is required';
  END IF;

  INSERT INTO borrow_requests
    (user_id, request_type, status, purpose, borrow_date, return_date, notes,
     class_schedule_id, approved_by, approved_at)
  VALUES
    (auth.uid(), 'faculty', 'approved', btrim(p_purpose), p_borrow_date,
     p_return_date, p_notes, p_class_schedule_id, auth.uid(), now())
  RETURNING id INTO v_request_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_eq_id := (v_item.value->>'equipment_id')::UUID;
    v_qty := COALESCE((v_item.value->>'quantity')::INTEGER, 1);
    IF v_qty < 1 THEN
      RAISE EXCEPTION 'Quantity must be at least 1';
    END IF;

    SELECT available_quantity INTO v_avail
    FROM equipment WHERE id = v_eq_id;

    IF v_avail IS NULL THEN
      RAISE EXCEPTION 'Equipment not found';
    END IF;
    IF v_avail < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock (% available) for this item', v_avail;
    END IF;

    INSERT INTO borrow_items
      (borrow_request_id, equipment_id, quantity, returned_quantity, notes)
    VALUES
      (v_request_id, v_eq_id, v_qty, 0, v_item.value->>'notes');

    UPDATE equipment
    SET available_quantity = available_quantity - v_qty,
        status = CASE WHEN available_quantity - v_qty <= 0 THEN 'borrowed' ELSE status END
    WHERE id = v_eq_id;
  END LOOP;

  INSERT INTO notifications (role, title, message, type, reference_type, reference_id)
  VALUES ('admin', 'New Faculty Borrow Request',
          'A faculty member has submitted a borrow request (auto-approved).',
          'system', 'borrow_request', v_request_id);

  RETURN v_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_faculty_borrow(JSONB, TEXT, DATE, DATE, TEXT, UUID)
  TO authenticated;
REVOKE EXECUTE ON FUNCTION submit_faculty_borrow(JSONB, TEXT, DATE, DATE, TEXT, UUID)
  FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION complete_return(p_borrow_request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_status TEXT;
  v_item RECORD;
  v_remaining INTEGER;
BEGIN
  SELECT user_id, status INTO v_user_id, v_status
  FROM borrow_requests WHERE id = p_borrow_request_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Borrow request not found';
  END IF;

  IF NOT (is_admin_or_staff() OR v_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to complete this return';
  END IF;

  IF v_status NOT IN ('approved', 'borrowed') THEN
    RAISE EXCEPTION 'This request is not in an active state';
  END IF;

  UPDATE borrow_requests
  SET status = 'returned', actual_return_date = now()
  WHERE id = p_borrow_request_id;

  FOR v_item IN
    SELECT * FROM borrow_items WHERE borrow_request_id = p_borrow_request_id
  LOOP
    v_remaining := v_item.quantity - v_item.returned_quantity;
    IF v_remaining > 0 THEN
      UPDATE borrow_items
      SET returned_quantity = v_item.quantity
      WHERE id = v_item.id;

      UPDATE equipment
      SET available_quantity = available_quantity + v_remaining,
          status = CASE WHEN available_quantity + v_remaining > 0
                        AND status = 'borrowed' THEN 'available' ELSE status END
      WHERE id = v_item.equipment_id;
    END IF;
  END LOOP;

  INSERT INTO notifications (role, title, message, type, reference_type, reference_id)
  VALUES ('admin', 'Equipment Returned',
          'Equipment has been returned.',
          'borrow_status', 'borrow_request', p_borrow_request_id);

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_return(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION complete_return(UUID) FROM PUBLIC, anon;

-- ============================================================================
-- 4. Harden helper functions (mutable search_path + trigger-only exposure)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $fn$
  SELECT role FROM users WHERE id = auth.uid();
$fn$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $fn$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');
$fn$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION is_admin_or_staff()
RETURNS BOOLEAN AS $fn$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'));
$fn$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION is_faculty()
RETURNS BOOLEAN AS $fn$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'faculty');
$fn$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION is_faculty_or_admin()
RETURNS BOOLEAN AS $fn$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff', 'faculty'));
$fn$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public;

-- Trigger-only functions: no RPC exposure (run as table owner via trigger)
REVOKE EXECUTE ON FUNCTION update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION notify_push_on_insert() FROM PUBLIC, anon, authenticated;

-- Role helpers stay callable by anon+authenticated (RLS policies need them)
REVOKE EXECUTE ON FUNCTION auth_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_admin_or_staff() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_faculty() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_faculty_or_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_user_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_staff() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_faculty() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_faculty_or_admin() TO anon, authenticated;

-- ============================================================================
-- 5. Index unindexed foreign keys
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_alerts_created_by ON alerts(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_borrow_items_equipment_id ON borrow_items(equipment_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_approved_by ON borrow_requests(approved_by);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_class_schedule ON borrow_requests(class_schedule_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_borrow_request_id ON damage_reports(borrow_request_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_equipment_id ON damage_reports(equipment_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_resolved_by ON damage_reports(resolved_by);
CREATE INDEX IF NOT EXISTS idx_damage_reports_user_id ON damage_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_subcategory_id ON equipment(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_created_by ON maintenance(created_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_id ON maintenance(equipment_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_users_approved_by ON users(approved_by);
