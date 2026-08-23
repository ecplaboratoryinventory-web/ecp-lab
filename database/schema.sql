-- ECP Lab Inventory Management System
-- Database Schema for Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: users
-- Unified table for admin, staff, faculty, and student accounts.
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'faculty', 'student')),
  full_name TEXT,
  firstname TEXT,
  lastname TEXT,
  middlename TEXT,
  id_no TEXT UNIQUE,
  department TEXT,
  course TEXT,
  section TEXT,
  enrolled_subjects TEXT[] DEFAULT '{}',
  profile_picture_url TEXT,
  push_token TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  reset_code TEXT,
  notification_preferences JSONB DEFAULT '{"borrow_status": true, "announcements": true, "overdue_reminders": true}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE: categories
-- ============================================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE: subcategories
-- ============================================================================
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE: equipment
-- ============================================================================
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id),
  subcategory_id UUID REFERENCES subcategories(id),
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT UNIQUE,
  quantity INTEGER DEFAULT 0,
  available_quantity INTEGER DEFAULT 0,
  location TEXT,
  department TEXT,
  subject_tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'under_maintenance', 'needs_replacement')),
  condition TEXT DEFAULT 'good' CHECK (condition IN ('good', 'fair', 'poor', 'needs_replacement')),
  purchase_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE: borrow_requests
-- Unified: student borrows + faculty borrows.
-- ============================================================================
CREATE TABLE borrow_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  request_type TEXT NOT NULL CHECK (request_type IN ('student', 'faculty')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'borrowed', 'returned', 'rejected')),
  purpose TEXT,
  class_schedule_id UUID,
  borrow_date DATE,
  return_date DATE,
  actual_return_date TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  denied_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE: class_schedules
-- ============================================================================
CREATE TABLE class_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID NOT NULL REFERENCES users(id),
  subject TEXT,
  section TEXT,
  day_of_week TEXT CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  start_time TIME,
  end_time TIME,
  room TEXT,
  semester TEXT,
  school_year TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK for class_schedule_id after class_schedules table is created
ALTER TABLE borrow_requests ADD CONSTRAINT fk_borrow_requests_class_schedule
  FOREIGN KEY (class_schedule_id) REFERENCES class_schedules(id);

-- ============================================================================
-- TABLE: borrow_items
-- Normalized join table for multi-item borrows.
-- ============================================================================
CREATE TABLE borrow_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  borrow_request_id UUID NOT NULL REFERENCES borrow_requests(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id),
  quantity INTEGER DEFAULT 1,
  returned_quantity INTEGER DEFAULT 0,
  condition_on_return TEXT CHECK (condition_on_return IN ('good', 'damaged', 'lost')),
  notes TEXT
);

-- ============================================================================
-- TABLE: damage_reports
-- ============================================================================
CREATE TABLE damage_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  equipment_id UUID REFERENCES equipment(id),
  borrow_request_id UUID REFERENCES borrow_requests(id),
  description TEXT,
  severity TEXT DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  image_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE: notifications
-- ============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  role TEXT CHECK (role IN ('admin', 'faculty', 'student')),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT CHECK (type IN ('borrow_status', 'damage_report', 'system', 'announcement')),
  reference_type TEXT CHECK (reference_type IN ('borrow_request', 'damage_report', 'announcement')),
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE: activity_logs
-- ============================================================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE: announcements
-- ============================================================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  author_id UUID REFERENCES users(id),
  target_role TEXT DEFAULT 'all' CHECK (target_role IN ('all', 'student', 'faculty', 'admin')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  is_active BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE: alerts
-- ============================================================================
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'critical')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE: system_settings
-- Single-row settings (id = 1) replacing localStorage config.
-- ============================================================================
CREATE TABLE system_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  system_name TEXT NOT NULL DEFAULT 'ECP Inventory Lab',
  borrow_duration_limit INTEGER NOT NULL DEFAULT 7 CHECK (borrow_duration_limit BETWEEN 1 AND 365),
  max_items_per_borrow INTEGER NOT NULL DEFAULT 5 CHECK (max_items_per_borrow BETWEEN 1 AND 100),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

INSERT INTO system_settings (id, system_name, borrow_duration_limit, max_items_per_borrow)
VALUES (1, 'ECP Inventory Lab', 7, 5)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TABLE: maintenance
-- ============================================================================
CREATE TABLE maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id),
  description TEXT,
  scheduled_date DATE,
  completed_date DATE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql
SET search_path = public;

-- Trigger-only function: revoke direct RPC execution (runs as table owner via trigger)
REVOKE EXECUTE ON FUNCTION update_updated_at_column() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_borrow_requests_updated_at BEFORE UPDATE ON borrow_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_damage_reports_updated_at BEFORE UPDATE ON damage_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_category ON equipment(category_id);
CREATE INDEX idx_borrow_requests_user ON borrow_requests(user_id);
CREATE INDEX idx_borrow_requests_status ON borrow_requests(status);
CREATE INDEX idx_borrow_requests_type ON borrow_requests(request_type);
CREATE INDEX idx_borrow_items_request ON borrow_items(borrow_request_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_damage_reports_status ON damage_reports(status);
CREATE INDEX idx_maintenance_status ON maintenance(status);
CREATE INDEX idx_announcements_active ON announcements(is_active);
CREATE INDEX idx_class_schedules_faculty ON class_schedules(faculty_id);

-- ============================================================================
-- INDEXES for unindexed foreign keys (performance advisor)
-- ============================================================================
CREATE INDEX idx_alerts_created_by ON alerts(created_by);
CREATE INDEX idx_announcements_author_id ON announcements(author_id);
CREATE INDEX idx_borrow_items_equipment_id ON borrow_items(equipment_id);
CREATE INDEX idx_borrow_requests_approved_by ON borrow_requests(approved_by);
CREATE INDEX idx_borrow_requests_class_schedule ON borrow_requests(class_schedule_id);
CREATE INDEX idx_damage_reports_borrow_request_id ON damage_reports(borrow_request_id);
CREATE INDEX idx_damage_reports_equipment_id ON damage_reports(equipment_id);
CREATE INDEX idx_damage_reports_resolved_by ON damage_reports(resolved_by);
CREATE INDEX idx_damage_reports_user_id ON damage_reports(user_id);
CREATE INDEX idx_equipment_subcategory_id ON equipment(subcategory_id);
CREATE INDEX idx_maintenance_created_by ON maintenance(created_by);
CREATE INDEX idx_maintenance_equipment_id ON maintenance(equipment_id);
CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_users_approved_by ON users(approved_by);
