# ECP Lab — Gap Analysis: Original vs New System

> Auto-generated: July 24, 2026  
> Compare: `C:\xampp\htdocs` (PHP + MySQL + Firebase) → Current Next.js + Supabase

---

## Completion Summary

| Status | Count |
|---|---|
| ✅ Done | 4 pages |
| 🚧 Partial | 1 page |
| ❌ Missing | 16 pages |

**Overall: ~22% of original functionality migrated**

---

## ✅ Done (Feature-Complete)

| # | Original | New | Notes |
|---|---|---|---|
| 1 | `dashboard.php` | `admin/dashboard/page.tsx` | Stats, bar chart, pie chart, recent borrows table |
| 2 | `equipment.php` | `admin/equipment/page.tsx` | CRUD, CSV export, status/category filters, search, stats |
| 3 | `categories.php` | `admin/categories/page.tsx` | CRUD, bar chart, stats, equipment counts, delete protection |
| 21 | `teacher/faculty_login.php` | `auth/login/page.tsx` | Unified login (Supabase Auth) |

---

## 🚧 Partial

| # | Original | New | Missing Features |
|---|---|---|---|
| 4 | `borrowings.php` | `admin/borrow-requests/page.tsx` | Return modal, damage/replace modals, 3-hour countdown timer, overdue detection, partial return, notifications, sort dropdown, advanced stat cards |

---

## ❌ Missing (Priority Order)

### HIGH PRIORITY — Core Admin Pages

| # | Original | What It Does | New Page Status |
|---|---|---|---|
| 5 | `students.php` | Student CRUD, CSV import/export, search, stats | `admin/students/page.tsx` — placeholder |
| 6 | `manage_account.php` | Faculty account CRUD, batch CSV upload, activate/deactivate, pagination | `admin/faculty/page.tsx` — placeholder |
| 7 | `logs.php` | Activity log table + 6 charts (Chart.js), date filter, print/export | `admin/activity-logs/page.tsx` — placeholder |
| 10 | `users.php` | Registration verification: approve/reject, bulk actions, stats | No page exists |

### MEDIUM PRIORITY — Admin Features

| # | Original | What It Does | New Page Status |
|---|---|---|---|
| 11 | `print_logs.php` | Activity log PDF via Dompdf | No page exists |
| 12 | `print_reports.php` | Monthly report PDF via Dompdf | No page exists |
| 8 | `notifications.php` | Notification inbox: read/unread, delete | No page exists |
| 9 | `profile.php` | Admin profile: photo upload, password change, stats | Partially in settings page |

### MEDIUM PRIORITY — Faculty Pages

| # | Original | What It Does | New Page Status |
|---|---|---|---|
| 13 | `teacher/teacher_dashboard.php` | Faculty dashboard: stats, charts, recent borrows | `faculty/dashboard/page.tsx` — placeholder |
| 15 | `teacher/teacher_borrow_equipment.php` | Faculty borrow equipment form | `faculty/borrow/page.tsx` — placeholder |
| 14 | `teacher/teacher_equipment.php` | Faculty equipment list (read-only) | No page (in borrow flow) |
| 16 | `teacher/teacher_return_equipment.php` | Return equipment: stock restore | No page exists |
| 17 | `teacher/teacher_requests.php` | Track request comments | `faculty/approvals/page.tsx` — placeholder |
| 18 | `teacher/student_borrow.php` | Faculty manages student borrowings (approve/reject/return) | No page exists |
| 19 | `teacher/teacher_announcement.php` | Faculty announcement view | `admin/announcements/page.tsx` — placeholder |
| 20 | `teacher/profile_teacher.php` | Faculty profile: photo, password change | No page exists |

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
