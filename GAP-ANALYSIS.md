# ECP Lab — Gap Analysis: Original vs New System

> Auto-generated: July 24, 2026 (Last updated: July 24, 2026)  
> Compare: `C:\xampp\htdocs` (PHP + MySQL + Firebase) → Current Next.js + Supabase

---

## Completion Summary

| Status | Count |
|---|---|
| ✅ Done | 17 pages |
| 🚧 Partial | 0 pages |
| ❌ Missing | 4 pages |

**Overall: ~85% of original functionality migrated**

---

## ✅ Done (Feature-Complete)

| # | Original | New | Notes |
|---|---|---|---|
| 1 | `dashboard.php` | `admin/dashboard/page.tsx` | Stats, bar chart, pie chart, recent borrows table |
| 2 | `equipment.php` | `admin/equipment/page.tsx` | CRUD, CSV export, status/category filters, search, stats |
| 3 | `categories.php` | `admin/categories/page.tsx` | CRUD, bar chart, stats, equipment counts, delete protection |
| 4 | `students.php` | `admin/students/page.tsx` | CRUD, CSV import/export, search, stats, status filter |
| 5 | `manage_account.php` | `admin/faculty/page.tsx` | CRUD, batch CSV upload, activate/deactivate, pagination, role tabs |
| 6 | `logs.php` | `admin/activity-logs/page.tsx` | Table + 6 pie charts, date filter, action filter, pagination |
| 7 | `borrowings.php` | `admin/borrow-requests/page.tsx` | Dual tab, status filters, approve/reject, return modal, damage report, countdown timer, overdue banner |
| 8 | `notifications.php` | `admin/notifications/page.tsx` | List, mark read/unread, delete, type icons, relative timestamps |
| 9 | `profile.php` | `admin/settings/page.tsx` | Profile tab: edit name/email, change password, stats; System tab: config |
| 10 | `teacher/teacher_dashboard.php` | `faculty/dashboard/page.tsx` | Stats, charts, current borrows, notifications, schedule preview |
| 11 | `teacher/teacher_borrow_equipment.php` | `faculty/borrow/page.tsx` | 3-step wizard, auto-approved, category filter, qty stepper |
| 12 | `teacher/student_borrow.php` | `faculty/approvals/page.tsx` | Card list, approve/deny, expandable detail, status tabs |
| 13 | `teacher/profile_teacher.php` | `faculty/profile/page.tsx` | Avatar, edit profile, change password, stats, recent activity |
| 14 | `teacher/teacher_announcement.php` | `admin/announcements/page.tsx` | Card grid, CRUD, target role, priority, active/inactive toggle |
| 15 | `print_logs.php` | (via activity-logs export) | CSV export on activity-logs page |
| 16 | `damage_reports (new)` | `admin/damage-reports/page.tsx` | List, status filter, resolve/dismiss, detail view |
| 17 | `maintenance (new)` | `admin/maintenance/page.tsx` | Table/calendar view, CRUD, status tracking |
| 18 | `teacher/faculty_login.php` | `auth/login/page.tsx` | Unified login (Supabase Auth) |

---

## ❌ Missing (Priority Order)

### LOW PRIORITY — Remaining

| # | Original | What It Does | New Page Status |
|---|---|---|---|
| `users.php` | Registration verification: approve/reject, bulk actions | ❌ Not needed (admin-managed user creation) |
| `teacher/teacher_equipment.php` | Faculty equipment list (read-only) | ❌ Integrated into faculty borrow flow |
| `teacher/teacher_requests.php` | Track request comments | ❌ Lower priority |
| `teacher/teacher_return_equipment.php` | Faculty return equipment | ❌ Handled in admin borrow-requests |
| `print_reports.php` | Monthly PDF report (Dompdf) | ❌ Can add later as API route |

---

## Feature-Specific Gaps (Across All Pages)

### Missing on Equipment Page
- [ ] CSV Import (with template download)
- [ ] Class schedule management
- [ ] Activity logging on CRUD operations
- [ ] Staff/instructor search autocomplete
- [ ] Sort dropdown

### Missing on Borrowings Page
- [ ] Return modal (with stock preview, qty breakdown, 2-step flow)
- [ ] Damage report modal (2-step, qty stepper, damage type, visual bar)
- [ ] Replace modal (2-step, restore tentative units)
- [ ] 3-hour countdown timer (real-time JS)
- [ ] Automatic overdue detection + alert banner
- [ ] Partial return handling
- [ ] Notification system integration
- [ ] Faculty tab with full feature parity

### Missing System-Wide
- [ ] Activity logging (no log writes on any CRUD action)
- [ ] CSV import (equipment, students, faculty)
- [ ] PDF report generation (activity logs, monthly reports)
- [ ] Notification infrastructure (in-app + push)
- [ ] Profile pages (photo upload, password change, stats)
- [ ] Class schedule management
- [ ] Registration verification workflow

---

## Build Order (Recommended)

### Batch 1 — Admin Core
1. Students page (CRUD + CSV import/export)
2. Faculty management page (CRUD + batch upload)
3. Activity logs page (table + 6 charts)

### Batch 2 — Borrowings Enhancement
4. Return workflow (return modal + stock restore)
5. Damage/Replace modals
6. Countdown timer + overdue detection

### Batch 3 — Faculty Pages
7. Faculty dashboard
8. Faculty borrow form
9. Faculty approvals (student borrow management)
10. Faculty profile

### Batch 4 — Finishing
11. Notifications inbox
12. Admin profile
13. PDF reports (print_logs, print_reports)
14. Settings page
15. Announcements page

---

## Data Migration Status

| Table | Rows Migrated | Source |
|---|---|---|
| users | 4 (+ 1 admin created) | MySQL `users` |
| categories | 8 | MySQL `categories` |
| equipment | 7 | MySQL `equipment` |
| borrow_requests | 4 | MySQL `equipment_usage` |
| maintenance | 4 | MySQL `maintenance` |
| alerts | 4 | MySQL `alerts` |

**Firebase data NOT yet migrated** (export file needed).

---

## Tech Debt / Notes

- Next.js 16 uses `proxy.ts` instead of `middleware.ts` — auth guard needs migration to proxy
- shadcn/ui in this version uses `render` prop (base-ui) instead of `asChild`
- Expo mobile app is scaffolded but all screens are placeholders
- Cloudinary is configured but not yet used for actual uploads
- Google SMTP configured but not verified with test email
