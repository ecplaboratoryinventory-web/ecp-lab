-- ECP Lab Inventory Management System
-- RPC Functions
-- SECURITY DEFINER functions that run as the function owner (bypass RLS).
-- Callable by anon/authenticated via explicit GRANTs only.
--
-- Apply order: database/schema.sql -> database/rls-policies.sql -> database/functions.sql
-- (functions depend on the auth helper fns is_faculty()/is_admin_or_staff()
--  defined in rls-policies.sql)

-- ============================================================================
-- FUNCTION: lookup_login(identifier)
-- Lookup the email + role for a student/faculty ID number at login time.
-- Runs as owner so it can read users without an anonymous RLS read on PII.
-- Returns only email + role (never the full user row).
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

-- ============================================================================
-- FUNCTION: submit_faculty_borrow(...)
-- Creates a faculty borrow request (auto-approved) with its items and
-- decrements equipment stock, all in one transaction. Also notifies admins.
-- ============================================================================
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
    v_eq_id := (v_item->>'equipment_id')::UUID;
    v_qty := COALESCE((v_item->>'quantity')::INTEGER, 1);
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
      (v_request_id, v_eq_id, v_qty, 0, v_item->>'notes');

    UPDATE equipment
    SET available_quantity = available_quantity - v_qty,
        status = CASE WHEN available_quantity - v_qty <= 0 THEN 'borrowed' ELSE status END
    WHERE id = v_eq_id;
  END LOOP;

  INSERT INTO notifications (role, title, message, type, reference_type, reference_id)
  VALUES ('admin', 'New Faculty Borrow Request',
          'A faculty member has submitted a borrow request (auto-approved).',
          'system', 'borrow_request', v_request_id);

  -- Also notify faculty role
  INSERT INTO notifications (role, title, message, type, reference_type, reference_id)
  VALUES ('faculty', 'New Faculty Borrow Request',
          'A faculty member has submitted a borrow request (auto-approved).',
          'system', 'borrow_request', v_request_id);

  RETURN v_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_faculty_borrow(JSONB, TEXT, DATE, DATE, TEXT, UUID)
  TO authenticated;
REVOKE EXECUTE ON FUNCTION submit_faculty_borrow(JSONB, TEXT, DATE, DATE, TEXT, UUID)
  FROM PUBLIC, anon;

-- ============================================================================
-- FUNCTION: complete_return(p_borrow_request_id)
-- Marks a borrow request as returned, sets returned_quantity on all items,
-- and restores equipment stock, in one transaction. Notifies admins.
-- Owner of the request or admin/staff may call it.
-- ============================================================================
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

  -- Also notify the borrower
  INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
  VALUES (v_user_id, 'Equipment Returned',
          'Your equipment has been successfully returned.',
          'borrow_status', 'borrow_request', p_borrow_request_id);

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_return(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION complete_return(UUID) FROM PUBLIC, anon;

-- ============================================================================
-- FUNCTION: create_borrow_notification(p_user_id, p_title, p_message, p_reference_id)
-- Creates a borrow_status notification for a user (e.g. student) on behalf of
-- faculty/admin/staff. Runs as owner so it bypasses the admin-only INSERT RLS;
-- callers are restricted to faculty/admin/staff via is_faculty_or_admin().
-- ============================================================================
CREATE OR REPLACE FUNCTION create_borrow_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_faculty_or_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User required';
  END IF;

  INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
  VALUES (p_user_id, btrim(p_title), btrim(p_message), 'borrow_status', 'borrow_request', p_reference_id);
END;
$$;

GRANT EXECUTE ON FUNCTION create_borrow_notification(UUID, TEXT, TEXT, UUID)
  TO authenticated;
REVOKE EXECUTE ON FUNCTION create_borrow_notification(UUID, TEXT, TEXT, UUID)
  FROM PUBLIC, anon;

-- ============================================================================
-- FUNCTION: delete_my_account()
-- Self-service account deletion for authenticated users. Deletes dependent
-- rows (FKs are NOT NULL without CASCADE), the users row, and the auth
-- identity in one transaction. Runs as owner (postgres).
-- ============================================================================
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM borrow_items
  WHERE borrow_request_id IN (SELECT id FROM borrow_requests WHERE user_id = v_uid);

  DELETE FROM damage_reports WHERE user_id = v_uid;
  DELETE FROM notifications WHERE user_id = v_uid;
  DELETE FROM activity_logs WHERE user_id = v_uid;
  DELETE FROM borrow_requests WHERE user_id = v_uid;
  DELETE FROM class_schedules WHERE faculty_id = v_uid;

  DELETE FROM users WHERE id = v_uid;

  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_my_account() TO authenticated;
REVOKE EXECUTE ON FUNCTION delete_my_account() FROM PUBLIC, anon;

-- ============================================================================
-- FUNCTION: submit_student_borrow(p_items, p_purpose, p_return_date)
-- Creates a student borrow request with items in one transaction, enforcing
-- server-side settings (max items + max borrow duration) and stock limits.
-- ============================================================================
CREATE OR REPLACE FUNCTION submit_student_borrow(
  p_items JSONB,
  p_purpose TEXT,
  p_return_date DATE
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
  v_borrow_date DATE := current_date;
  v_max_items INTEGER;
  v_max_duration INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT max_items_per_borrow, borrow_duration_limit
  INTO v_max_items, v_max_duration
  FROM system_settings WHERE id = 1;

  v_max_items := COALESCE(v_max_items, 5);
  v_max_duration := COALESCE(v_max_duration, 7);

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Select at least one item';
  END IF;

  IF jsonb_array_length(p_items) > v_max_items THEN
    RAISE EXCEPTION 'You can borrow at most % items per request', v_max_items;
  END IF;

  IF p_purpose IS NULL OR btrim(p_purpose) = '' THEN
    RAISE EXCEPTION 'Purpose is required';
  END IF;

  IF p_return_date IS NULL THEN
    RAISE EXCEPTION 'Return date is required';
  END IF;

  IF p_return_date < v_borrow_date THEN
    RAISE EXCEPTION 'Return date cannot be before the borrow date';
  END IF;

  IF (p_return_date - v_borrow_date) > v_max_duration THEN
    RAISE EXCEPTION 'Return date cannot exceed % days from the borrow date', v_max_duration;
  END IF;

  INSERT INTO borrow_requests
    (user_id, request_type, status, purpose, borrow_date, return_date)
  VALUES
    (auth.uid(), 'student', 'pending', btrim(p_purpose), v_borrow_date, p_return_date)
  RETURNING id INTO v_request_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_eq_id := (v_item->>'equipment_id')::UUID;
    v_qty := COALESCE((v_item->>'quantity')::INTEGER, 1);
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
      (v_request_id, v_eq_id, v_qty, 0, v_item->>'notes');
  END LOOP;

  -- Notify student (confirmation)
  INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
  VALUES (auth.uid(), 'Borrow Request Submitted',
          'Your borrow request has been submitted successfully and is pending faculty review.',
          'borrow_status', 'borrow_request', v_request_id);

  RETURN v_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_student_borrow(JSONB, TEXT, DATE) TO authenticated;
REVOKE EXECUTE ON FUNCTION submit_student_borrow(JSONB, TEXT, DATE) FROM PUBLIC, anon;
