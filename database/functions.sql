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

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_return(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION complete_return(UUID) FROM PUBLIC, anon;
