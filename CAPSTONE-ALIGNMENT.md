# ECP Capstone 2 — Full Alignment Check

> Source: `ECP_Capstone-2_DOCUMENTS.md` (77-page thesis)  
> Date: July 24, 2026

---

## Thesis Requirements vs Current System

### FUNCTIONAL REQUIREMENTS

| # | Requirement (from thesis) | Status | Notes |
|---|---|---|---|
| 1 | Equipment & Inventory Management | ✅ Done | CRUD, categories, status, department, CSV import/export |
| 2 | Borrowing & Returning Module | ✅ Done | Student requests + faculty/admin approval + return + condition |
| 3 | Equipment Condition & Damage Monitoring | ✅ Done | Good/Damaged/Lost at return, damage reports linked to transactions |
| 4 | User & Access Management | ✅ Done | 3 roles: Admin, Faculty, Student. CSV batch upload for students |
| 5 | Notification System | 🚧 Partial | In-app notifications exist. Push notifications NOT implemented |
| 6 | Faculty & Student Mobile App | ❌ Missing | Expo scaffolded but all screens are placeholders |
| 7 | Announcement Management | ✅ Done | CRUD, target role, priority, active/inactive |
| 8 | Admin Dashboard & Monitoring | ✅ Done | Stats, charts, recent activity, overdue tracking |
| 9 | Subject-Based Equipment Filtering | ❌ Missing | Students should only see equipment for their enrolled subjects. NOT in DB schema |

### THESIS-SPECIFIC GAPS

| Gap | Thesis Says | Current State |
|---|---|---|
| **Subject-based filtering** | "Students can only view equipment tied to their enrolled subjects" | No subject/equipment mapping exists. Students see all equipment |
| **Push notifications** | "Push and in-app notifications for approvals, rejections, return reminders" | Only in-app. No push (Expo Push + FCM) |
| **Mobile app platform** | "Android Studio" per thesis | Expo (React Native) — still Android-compatible |
| **Equipment visibility rules** | Equipment tagged with subject/course; students filtered by enrollment | No subject tags on equipment, no enrollment field on students |
| **Batch upload with enrollment** | CSV import includes "enrolled subject or course" | CSV import exists but no course/subject mapping column |
| **Condition: "Needs Replacement"** | Three states: Good, Damaged, Needs Replacement | Our system has: Good, Damaged, Lost. Missing "Needs Replacement" |

### DATABASE GAPS

| Missing Schema Element | Purpose |
|---|---|
| `student_subjects` table | Maps students to their enrolled subjects/courses |
| `equipment_subjects` or `equipment.course_tags` | Tags equipment with relevant subjects |
| `push_tokens` table | Stores device tokens for push notifications |
| Add `condition` value `needs_replacement` | Third damage state from thesis |

### UI/UX GAPS

| Gap | Detail |
|---|---|
| Toast notifications system-wide | No toast popups for CRUD success/error |
| Live auto-search on all tables | Search works but could be debounced |
| Equipment images | Cloudinary configured but not used in equipment CRUD UI |

---

## Recommended Fix Order

### Priority 1 — Thesis Requirements
1. Add subject-based equipment filtering (DB + UI)
2. Implement push notifications (Expo Push API)
3. Build student mobile app screens

### Priority 2 — Completeness
4. Toast notification system
5. Add "Needs Replacement" condition
6. Equipment image upload in admin CRUD

### Priority 3 — Polish
7. Live debounced search
8. Better CSV import validation
