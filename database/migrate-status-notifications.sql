-- ECP Lab — Equipment Status Migration + Notification System
-- Run after: database/schema.sql, database/functions.sql, database/rls-policies.sql
--
-- Task 1: Remove 'needs_replacement', rename 'under_maintenance' to 'damaged'
-- Task 2: Comprehensive notification RPC functions for all roles

-- ============================================================================
-- TASK 1: Equipment Status Cleanup
-- ============================================================================

-- Migrate existing data before changing constraint
UPDATE equipment SET status = 'damaged' WHERE status = 'under_maintenance';
UPDATE equipment SET status = 'available' WHERE status = 'needs_replacement';
UPDATE equipment SET condition = 'poor' WHERE condition = 'needs_replacement';

-- Drop old CHECK constraint and create new one (available, borrowed, damaged only)
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_status_check;
ALTER TABLE equipment ADD CONSTRAINT equipment_status_check
  CHECK (status IN ('available', 'borrowed', 'damaged'));

-- Update schema.sql reference comment
COMMENT ON COLUMN equipment.status IS 'Equipment availability status: available, borrowed, or damaged';

-- ============================================================================
-- TASK 2: Notification RPC Functions
-- ============================================================================

-- FUNCTION: notify_role_users(p_role, p_title, p_message, p_type, p_reference_type, p_reference_id)
-- Insert a notification visible to ALL users with the given role.
-- Used for system-wide broadcasts (e.g., new borrow request pending faculty review).
CREATE OR REPLACE FUNCTION notify_role_users(
  p_role TEXT,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'borrow_status',
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (role, title, message, type, reference_type, reference_id)
  VALUES (p_role, btrim(p_title), btrim(p_message), p_type, p_reference_type, p_reference_id);
END;
$$;

GRANT EXECUTE ON FUNCTION notify_role_users(TEXT, TEXT, TEXT, TEXT, TEXT, UUID)
  TO authenticated;
REVOKE EXECUTE ON FUNCTION notify_role_users(TEXT, TEXT, TEXT, TEXT, TEXT, UUID)
  FROM PUBLIC, anon;

-- FUNCTION: notify_user(p_user_id, p_title, p_message, p_type, p_reference_type, p_reference_id)
-- Insert a notification targeted at a specific user (bypasses RLS).
CREATE OR REPLACE FUNCTION notify_user(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'borrow_status',
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
  VALUES (p_user_id, btrim(p_title), btrim(p_message), p_type, p_reference_type, p_reference_id);
END;
$$;

GRANT EXECUTE ON FUNCTION notify_user(UUID, TEXT, TEXT, TEXT, TEXT, UUID)
  TO authenticated;
REVOKE EXECUTE ON FUNCTION notify_user(UUID, TEXT, TEXT, TEXT, TEXT, UUID)
  FROM PUBLIC, anon;

-- FUNCTION: check_and_notify_overdue()
-- Scan for borrowed items past their return_date and send overdue notifications.
-- Safe to call via pg_cron or manually.
CREATE OR REPLACE FUNCTION check_and_notify_overdue()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_count INTEGER := 0;
  v_student_name TEXT;
  v_eq_summary TEXT;
  v_penalty_rate NUMERIC;
BEGIN
  -- Get penalty rate from system_settings (or default 50)
  SELECT COALESCE(
    (SELECT (settings->>'penalty_per_day')::NUMERIC FROM system_settings WHERE id = 1),
    50
  ) INTO v_penalty_rate;

  FOR v_row IN
    SELECT br.id, br.user_id, br.borrow_date, br.return_date, br.created_at
    FROM borrow_requests br
    WHERE br.status IN ('approved', 'borrowed')
      AND br.return_date IS NOT NULL
      AND br.return_date < CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.reference_id = br.id
          AND n.type = 'borrow_status'
          AND n.title LIKE '%overdue%'
          AND n.created_at > NOW() - INTERVAL '24 hours'
      )
  LOOP
    -- Get student name
    SELECT full_name INTO v_student_name FROM users WHERE id = v_row.user_id;
    v_student_name := COALESCE(v_student_name, 'Student');

    -- Get equipment summary
    SELECT string_agg(CONCAT(bi.quantity, 'x ', COALESCE(e.name, 'Unknown')), ', ')
    INTO v_eq_summary
    FROM borrow_items bi
    JOIN equipment e ON e.id = bi.equipment_id
    WHERE bi.borrow_request_id = v_row.id;

    v_eq_summary := COALESCE(v_eq_summary, 'equipment');

    -- Student notification
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (
      v_row.user_id,
      'Overdue Equipment',
      CONCAT('Your ', v_eq_summary, ' are overdue. Please return them as soon as possible.'),
      'borrow_status', 'borrow_request', v_row.id
    );

    -- Student penalty reminder
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (
      v_row.user_id,
      'Penalty Reminder',
      CONCAT('Reminder: For each day the return date is exceeded, you must pay a ₱', v_penalty_rate, ' penalty.'),
      'borrow_status', 'borrow_request', v_row.id
    );

    -- Admin notification
    INSERT INTO notifications (role, title, message, type, reference_type, reference_id)
    VALUES (
      'admin',
      'Overdue Equipment',
      CONCAT(v_student_name, '''s ', v_eq_summary, ' are overdue.'),
      'borrow_status', 'borrow_request', v_row.id
    );

    -- Admin penalty reminder
    INSERT INTO notifications (role, title, message, type, reference_type, reference_id)
    VALUES (
      'admin',
      'Penalty Reminder',
      CONCAT('Reminder: For each day the return date is exceeded, a ₱', v_penalty_rate, ' penalty must be paid.'),
      'borrow_status', 'borrow_request', v_row.id
    );

    -- Faculty notification (to the approving faculty if any)
    IF v_row.approved_by IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
      VALUES (
        v_row.approved_by,
        'Overdue Equipment',
        CONCAT(v_student_name, '''s ', v_eq_summary, ' are overdue.'),
        'borrow_status', 'borrow_request', v_row.id
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_notify_overdue() TO authenticated;
REVOKE EXECUTE ON FUNCTION check_and_notify_overdue() FROM PUBLIC, anon;

-- FUNCTION: check_and_notify_low_availability()
-- Check equipment with low available_quantity and notify admins.
CREATE OR REPLACE FUNCTION check_and_notify_low_availability()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_row IN
    SELECT e.id, e.name, e.available_quantity
    FROM equipment e
    WHERE e.available_quantity > 0
      AND e.available_quantity <= 2
      AND e.status = 'available'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.title LIKE 'Low Equipment Availability%'
          AND n.reference_id = e.id
          AND n.created_at > NOW() - INTERVAL '24 hours'
      )
  LOOP
    INSERT INTO notifications (role, title, message, type, reference_type, reference_id)
    VALUES (
      'admin',
      'Low Equipment Availability',
      CONCAT('Low Equipment Availability - Only ', v_row.available_quantity, ' ', v_row.name, ' is currently available.'),
      'system', 'borrow_request', v_row.id
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_notify_low_availability() TO authenticated;
REVOKE EXECUTE ON FUNCTION check_and_notify_low_availability() FROM PUBLIC, anon;

-- FUNCTION: check_and_notify_return_reminders()
-- Send return-due reminders to students (1 day before return date).
CREATE OR REPLACE FUNCTION check_and_notify_return_reminders()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_count INTEGER := 0;
  v_student_name TEXT;
  v_eq_summary TEXT;
  v_days_left INTEGER;
BEGIN
  FOR v_row IN
    SELECT br.id, br.user_id, br.return_date
    FROM borrow_requests br
    WHERE br.status IN ('approved', 'borrowed')
      AND br.return_date IS NOT NULL
      AND br.return_date >= CURRENT_DATE
      AND br.return_date <= CURRENT_DATE + INTERVAL '3 days'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.reference_id = br.id
          AND n.title LIKE '%due%'
          AND n.created_at > NOW() - INTERVAL '12 hours'
      )
  LOOP
    v_days_left := v_row.return_date - CURRENT_DATE;

    -- Get equipment summary
    SELECT string_agg(CONCAT(bi.quantity, 'x ', COALESCE(e.name, 'Unknown')), ', ')
    INTO v_eq_summary
    FROM borrow_items bi
    JOIN equipment e ON e.id = bi.equipment_id
    WHERE bi.borrow_request_id = v_row.id;

    v_eq_summary := COALESCE(v_eq_summary, 'equipment');

    IF v_days_left = 0 THEN
      -- Due today
      INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
      VALUES (
        v_row.user_id,
        'Return Due Today',
        CONCAT('Your ', v_eq_summary, ' are due for return today.'),
        'borrow_status', 'borrow_request', v_row.id
      );
    ELSE
      -- Due in X days
      INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
      VALUES (
        v_row.user_id,
        'Return Reminder',
        CONCAT('Your ', v_eq_summary, ' are due for return in ', v_days_left, ' day(s).'),
        'borrow_status', 'borrow_request', v_row.id
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_notify_return_reminders() TO authenticated;
REVOKE EXECUTE ON FUNCTION check_and_notify_return_reminders() FROM PUBLIC, anon;

-- ============================================================================
-- RLS: Allow faculty to insert notifications via RPC (bypass RLS via SECURITY DEFINER)
-- The existing RLS only allows admin/staff inserts, but faculty need to send
-- notifications via create_borrow_notification() and notify_user()/notify_role_users().
-- Since these are SECURITY DEFINER, they bypass RLS — no policy change needed.
-- ============================================================================
