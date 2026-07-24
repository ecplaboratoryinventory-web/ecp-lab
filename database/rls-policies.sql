-- ECP Lab Inventory Management System
-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper function: check if current user has a specific role
-- ============================================================================
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_faculty()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'faculty');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_faculty_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff', 'faculty'));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- USERS
-- ============================================================================
CREATE POLICY "Users can read their own record" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (is_admin());

CREATE POLICY "Faculty can read student records" ON users
  FOR SELECT USING (is_faculty() AND role = 'student');

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (is_admin());

CREATE POLICY "Users can update their own record" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (is_admin());

-- ============================================================================
-- CATEGORIES
-- ============================================================================
CREATE POLICY "Public read categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admin write categories" ON categories
  FOR INSERT WITH CHECK (is_admin_or_staff());

CREATE POLICY "Admin update categories" ON categories
  FOR UPDATE USING (is_admin_or_staff());

CREATE POLICY "Admin delete categories" ON categories
  FOR DELETE USING (is_admin_or_staff());

-- ============================================================================
-- SUBCATEGORIES
-- ============================================================================
CREATE POLICY "Public read subcategories" ON subcategories
  FOR SELECT USING (true);

CREATE POLICY "Admin write subcategories" ON subcategories
  FOR INSERT WITH CHECK (is_admin_or_staff());

CREATE POLICY "Admin update subcategories" ON subcategories
  FOR UPDATE USING (is_admin_or_staff());

CREATE POLICY "Admin delete subcategories" ON subcategories
  FOR DELETE USING (is_admin_or_staff());

-- ============================================================================
-- EQUIPMENT
-- ============================================================================
CREATE POLICY "Public read equipment" ON equipment
  FOR SELECT USING (true);

CREATE POLICY "Admin write equipment" ON equipment
  FOR INSERT WITH CHECK (is_admin_or_staff());

CREATE POLICY "Admin update equipment" ON equipment
  FOR UPDATE USING (is_admin_or_staff());

CREATE POLICY "Admin delete equipment" ON equipment
  FOR DELETE USING (is_admin_or_staff());

-- ============================================================================
-- BORROW REQUESTS
-- ============================================================================
CREATE POLICY "Users read own borrow requests" ON borrow_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Faculty and admin read all borrow requests" ON borrow_requests
  FOR SELECT USING (is_faculty_or_admin());

CREATE POLICY "Users create borrow requests" ON borrow_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin update borrow requests" ON borrow_requests
  FOR UPDATE USING (is_admin_or_staff());

CREATE POLICY "Faculty update borrow requests for approval" ON borrow_requests
  FOR UPDATE USING (is_faculty() AND status = 'pending');

CREATE POLICY "Users update own pending requests" ON borrow_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- ============================================================================
-- BORROW ITEMS
-- ============================================================================
CREATE POLICY "Users read own borrow items" ON borrow_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM borrow_requests WHERE id = borrow_items.borrow_request_id AND user_id = auth.uid())
  );

CREATE POLICY "Faculty and admin read all borrow items" ON borrow_items
  FOR SELECT USING (is_faculty_or_admin());

CREATE POLICY "Users insert borrow items" ON borrow_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM borrow_requests WHERE id = borrow_items.borrow_request_id AND user_id = auth.uid())
  );

CREATE POLICY "Admin update borrow items" ON borrow_items
  FOR UPDATE USING (is_admin_or_staff());

-- ============================================================================
-- CLASS SCHEDULES
-- ============================================================================
CREATE POLICY "Faculty read own schedule" ON class_schedules
  FOR SELECT USING (auth.uid() = faculty_id);

CREATE POLICY "Admin read all schedules" ON class_schedules
  FOR SELECT USING (is_admin_or_staff());

CREATE POLICY "Admin write schedules" ON class_schedules
  FOR INSERT WITH CHECK (is_admin_or_staff());

CREATE POLICY "Admin update schedules" ON class_schedules
  FOR UPDATE USING (is_admin_or_staff());

CREATE POLICY "Admin delete schedules" ON class_schedules
  FOR DELETE USING (is_admin_or_staff());

-- ============================================================================
-- DAMAGE REPORTS
-- ============================================================================
CREATE POLICY "Users read own damage reports" ON damage_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin read all damage reports" ON damage_reports
  FOR SELECT USING (is_admin_or_staff());

CREATE POLICY "Users create damage reports" ON damage_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin update damage reports" ON damage_reports
  FOR UPDATE USING (is_admin_or_staff());

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Role-wide notifications" ON notifications
  FOR SELECT USING (
    role IS NOT NULL
    AND role = (SELECT role FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admin insert notifications" ON notifications
  FOR INSERT WITH CHECK (is_admin_or_staff());

CREATE POLICY "Users update own notifications (mark read)" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- ACTIVITY LOGS
-- ============================================================================
CREATE POLICY "Admin read activity logs" ON activity_logs
  FOR SELECT USING (is_admin_or_staff());

CREATE POLICY "System insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- ANNOUNCEMENTS
-- ============================================================================
CREATE POLICY "Public read active announcements" ON announcements
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin write announcements" ON announcements
  FOR INSERT WITH CHECK (is_admin_or_staff());

CREATE POLICY "Admin update announcements" ON announcements
  FOR UPDATE USING (is_admin_or_staff());

CREATE POLICY "Admin delete announcements" ON announcements
  FOR DELETE USING (is_admin_or_staff());

-- ============================================================================
-- ALERTS
-- ============================================================================
CREATE POLICY "Admin read alerts" ON alerts
  FOR SELECT USING (is_admin_or_staff());

CREATE POLICY "Admin write alerts" ON alerts
  FOR INSERT WITH CHECK (is_admin_or_staff());

CREATE POLICY "Admin update alerts" ON alerts
  FOR UPDATE USING (is_admin_or_staff());

CREATE POLICY "Admin delete alerts" ON alerts
  FOR DELETE USING (is_admin_or_staff());

-- ============================================================================
-- MAINTENANCE
-- ============================================================================
CREATE POLICY "Admin read maintenance" ON maintenance
  FOR SELECT USING (is_admin_or_staff());

CREATE POLICY "Admin write maintenance" ON maintenance
  FOR INSERT WITH CHECK (is_admin_or_staff());

CREATE POLICY "Admin update maintenance" ON maintenance
  FOR UPDATE USING (is_admin_or_staff());

CREATE POLICY "Admin delete maintenance" ON maintenance
  FOR DELETE USING (is_admin_or_staff());
