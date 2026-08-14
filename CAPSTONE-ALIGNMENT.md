# ECP Capstone 2 — Full Alignment Check

> Source: `ECP_Capstone-2_DOCUMENTS.md` (77-page thesis)  
> Created: July 24, 2026 · **Updated: Aug 14, 2026 (deep audit)**

---

## Thesis Requirements vs Current System

### FUNCTIONAL REQUIREMENTS

| # | Requirement (from thesis) | Status | Notes |
|---|---|---|---|
| 1 | Equipment & Inventory Management | ✅ Done | CRUD, categories, status, department, CSV import/export |
| 2 | Borrowing & Returning Module | ✅ Done | Student requests + faculty/admin approval + return + condition |
| 3 | Equipment Condition & Damage Monitoring | ✅ Done | Good/Damaged/Lost at return, damage reports linked to transactions |
| 4 | User & Access Management | ✅ Done | 3 roles: Admin, Faculty, Student. CSV batch upload for students |
| 5 | Notification System | 🚧 Partial | In-app notifications exist (**admin/student flows only** — faculty approval creates none). **Push notifications still NOT implemented.** No Realtime on mobile |
| 6 | Faculty & Student Mobile App | 🟡 Partial | 13 real screens exist (login, student home/requests/borrow/detail/notifications/profile/damage, faculty home/approvals/notifications/profile/borrow/return). **Missing:** student return flow, faculty schedule screen. **Critical bugs:** login blocked by RLS, faculty return/borrow writes denied by RLS |
| 7 | Announcement Management | ✅ Done | CRUD, target role, priority, active/inactive |
| 8 | Admin Dashboard & Monitoring | ✅ Done | Stats, charts, recent activity, overdue tracking |
| 9 | Subject-Based Equipment Filtering | ❌ Missing | Students should only see equipment for their enrolled subjects. NOT in DB schema |

### THESIS-SPECIFIC GAPS

| Gap | Thesis Says | Current State |
|---|---|---|
| **Subject-based filtering** | "Students can only view equipment tied to their enrolled subjects" | No subject/equipment mapping exists. **Verified:** admin form writes `equipment.subject_tags` but the column is NOT in `schema.sql` → fails on a pristine DB. Students see all equipment |
| **Push notifications** | "Push and in-app notifications for approvals, rejections, return reminders" | Only in-app (and only from admin flows). **No push** (Expo Push + FCM), no `expo-notifications` dep, `users.push_token` never written |
| **Mobile app platform** | "Android Studio" per thesis | Expo (React Native) — still Android-compatible |
| **Equipment visibility rules** | Equipment tagged with subject/course; students filtered by enrollment | No subject tags on equipment, no enrollment field on students |
| **Batch upload with enrollment** | CSV import includes "enrolled subject or course" | CSV import exists but no course/subject mapping column |
| **Condition: "Needs Replacement"** | Three states: Good, Damaged, Needs Replacement | ✅ **Now done** — `equipment.status`/`condition` include `needs_replacement` (`schema.sql:70-71`) |

### DATABASE GAPS

| Missing Schema Element | Purpose | Status |
|---|---|---|
| `student_subjects` table | Maps students to their enrolled subjects/courses | ❌ Still missing |
| `equipment_subjects` or `equipment.course_tags` | Tags equipment with relevant subjects | ❌ Still missing (`subject_tags` written by app but not in schema) |
| `push_tokens` table | Stores device tokens for push notifications | 🟡 `users.push_token` column exists but is a **dead column** — never written |
| Add `condition` value `needs_replacement` | Third damage state from thesis | ✅ Done (`schema.sql:70-71`) |

> Plus (from deep audit): **schema drift** — `equipment.department`, `users.reset_token*` also missing from `schema.sql`; several **RLS policies block runtime flows** (borrow_items updates, damage_reports admin insert, login lookup).

### UI/UX GAPS

| Gap | Detail | Status |
|---|---|---|
| Toast notifications system-wide | No toast popups for CRUD success/error | 🟡 Dual toast systems wired (shared + base-ui) but not consistently used |
| Live auto-search on all tables | Search works but could be debounced | 🟡 Search exists; debouncing inconsistent |
| Equipment images | Cloudinary configured but not used in equipment CRUD UI | 🟡 Upload wired but **fails** — `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` missing from `.env.local` |

---

## Recommended Fix Order

### Priority 1 — Critical blockers (from Aug 14 audit)
1. Fix mobile login (RLS blocks anon `id_no` lookup)
2. Fix faculty return/borrow RLS (borrow_items + equipment + non-pending status updates)
3. Authenticate/rate-limit `POST /api/email` (open relay)
4. Add admin INSERT policy for `damage_reports`
5. Reconcile `equipment.department` / `subject_tags` schema drift
6. Add Cloudinary preset env + `android.package`/`scheme`

### Priority 2 — Thesis Requirements
7. Add subject-based equipment filtering (DB + UI)
8. Implement push notifications (Expo Push API)
9. Build mobile student return flow + faculty schedule screen

### Priority 3 — Completeness
10. Toast system consistency
11. Add "Needs Replacement" flowing through return condition UI (DB done)
12. Equipment image upload working end-to-end
13. Rotate committed secrets (`seed-images.cjs`, `migrate-mysql.mjs`)
