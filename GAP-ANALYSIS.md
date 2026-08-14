# ECP Lab — Gap Analysis: Full System Status

> Last updated: **Aug 14, 2026**
> Deep audit performed Aug 14, 2026 against repo code (`web/`, `mobile/`, `database/`, `scripts/`).
> ⚠️ Earlier entries below marked "✅ Done" are the status **as claimed on Jul 27, 2026** — the deep audit revealed several of them are **broken at runtime** (see the new Deep Audit sections at the top).

---

## 🔴 CRITICAL — Deep Audit Findings (NEW, Aug 14, 2026)

These are runtime blockers that must be fixed first. All were verified directly in the code.

| # | Issue | Location |
|---|---|---|
| 1 | **Mobile login is blocked by RLS.** Login reads `users` by `id_no` while unauthenticated; RLS only permits own-record reads (`auth.uid() = id`), so anonymous gets 0 rows → "Account not found" always. | `mobile/app/(auth)/login.tsx:21` vs `database/rls-policies.sql:50` |
| 2 | **Faculty return/borrow writes are RLS-denied.** `borrow_requests` update (non-pending), `borrow_items.returned_quantity` (admin-only), and `equipment.available_quantity` (admin-only) all fail for faculty; errors are swallowed, so it looks like it works. | `mobile/app/(faculty)/return.tsx:74-88`, `(faculty)/borrow.tsx:68-70` vs `rls-policies.sql:111,154,129-133` |
| 3 | **`POST /api/email` is an unauthenticated open email relay** — anyone can send mail from the lab Gmail. All `/api/*` is exempted from the auth proxy. | `web/app/api/email/route.ts`, `web/proxy.ts:9` |
| 4 | **`equipment.department` doesn't exist in `schema.sql`** but faculty web+mobile filter by it → query errors → **faculty home can hang on an infinite skeleton**. | `mobile/app/(faculty)/(tabs)/home.tsx:34`, `web/app/faculty/{dashboard,equipment,borrow,history}/page.tsx` |
| 5 | **Admin damage-report creation fails RLS.** Admin inserts with `user_id` = student's id, but the only insert policy requires `auth.uid() = user_id`. | `web/app/admin/borrow-requests/page.tsx:355,420` vs `rls-policies.sql:184` |
| 6 | **Cloudinary uploads can't work** — `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` is referenced by `web/lib/cloudinary.ts` but **missing from `web/.env.local`**. | `web/.env.local` |
| 7 | **EAS build can't run** — `mobile/app.json` has no `android.package` (required for EAS); also missing `scheme` (deep links) and splash plugin. | `mobile/app.json:12-20` |

---

## 🔴 Capstone Requirements — still missing

Confirmed against `CAPSTONE-ALIGNMENT.md`. These remain open:

| Requirement | Status |
|---|---|
| **Push notifications** (Expo Push + FCM) | ❌ Not implemented anywhere — no `expo-notifications`, no exp.host calls, no `/api/notifications/send`, no edge function. `users.push_token` is a dead column. |
| **Subject-based equipment filtering** | ❌ No `student_subjects` / `equipment_subjects` tables. `subject_tags` is written by the admin equipment form but **not in `schema.sql`** → fails on a pristine DB. |
| **Mobile student return flow** | ❌ `(student)/return.tsx` **MISSING**; request detail has no "Return Items" action. |
| **Mobile faculty schedule screen** | ❌ `(faculty)/schedule.tsx` **MISSING**; `class_schedules` never queried on mobile. |

---

## 🔴 Security & Secrets (NEW)

| # | Issue | Action |
|---|---|---|
| 1 | Cloudinary `api_secret` hardcoded in `scripts/seed-images.cjs:6-8` (git-tracked) | **Rotate key + move to env** |
| 2 | MySQL password `lemuel_0405` in `scripts/migrate-mysql.mjs:27`; empty root password in `scripts/migrate-mysql.cjs:24` (git-tracked) | Remove / use env vars |
| 3 | `test-credentials.txt` (plaintext passwords) on disk | Delete (gitignored but still on disk) |
| 4 | `activity_logs` INSERT `WITH CHECK (true)` — anonymous anon-key writes | Tighten to `auth.uid() IS NOT NULL` (`rls-policies.sql:214`) |
| 5 | `/api/reports/*` have no admin role check (any logged-in user can call) | Add role guard |

---

## 🟡 Verified Missing / Incomplete (NEW)

### Web app
| Item | Detail |
|---|---|
| Orphan pages not in any nav | `/admin/reports`, `/admin/damage-reports`, `/admin/notifications`, `/faculty/schedule` |
| PWA | PLAN.md says "Web + PWA" — no manifest/service worker; `next.config.ts` empty |
| QR code generation | PLAN Phase 3 spec — not implemented |
| Settings persistence | `admin/settings` is localStorage-only; borrow duration/max-items not enforced server-side |
| Faculty approval → notification | Faculty approving a student request creates no notification (spec §5.1) |
| Dead code | `auth/login/actions.ts`, `auth/reset-password/actions.ts` unused |
| Password change (faculty) | `faculty/profile` calls `updateUser` without verifying current password |
| Lint | **132 problems (58 errors)** — `react-hooks/set-state-in-effect` (all fetch pages), `no-explicit-any`, purity, unescaped entities |

### Mobile app
| Item | Detail |
|---|---|
| Student home | Mostly placeholder — no search/chips/equipment grid/realtime/scan; "Recent Activity" hardcoded stub; autoplay interval closes over stale `slides` |
| Notifications | No "mark all as read", no deep-link to entity, **no Realtime subscription** (zero `channel()` calls in the app) |
| Request detail | No Return/Cancel/contact-admin; damage report hardcodes `severity:"minor"` + only links `borrow_items[0]`; no `actual_return_date` |
| Profile | No change-password/delete-account/picture upload; edit saves email to `users` but **never `auth.updateUser`** → login email desyncs |
| Borrow form | Return date free-text (no picker, no `return >= borrow` validation), borrow_date hardcoded to today, `borrow_items` loop swallows errors, no admin notification |
| Faculty approvals | Deny uses `Alert.prompt` — **iOS-only, no-op on Android** (target platform) |
| Faculty borrow/return | No per-item condition (good/damaged/lost), no partial returns, no damage-report creation |
| Dependencies | `expo-notifications`, `react-native-paper`, `react-native-safe-area-context`, `react-native-screens` missing from package.json/node_modules |
| BFF bypass | `EXPO_PUBLIC_API_URL` set but never used — all writes hit Supabase directly (contradicts PLAN decision #2) |

---

## 🟡 Database / RLS / Migration (NEW)

- **Schema drift:** `equipment.subject_tags`, `equipment.department`, `users.reset_token`/`reset_token_expires`/`reset_code` are written by app/scripts but **not in `schema.sql`**.
- **`migrate-firebase.cjs --dry-run` actually WRITES data** (only the student loop honors the flag). Nested student-iteration bug. Class schedules insert with `faculty_id = NULL` against `NOT NULL` → fails.
- **RLS fixes needed:**
  - faculty/owner UPDATE on `borrow_items` (return sets `returned_quantity`/`condition_on_return`)
  - non-pending return UPDATE on `borrow_requests`
  - admin INSERT policy on `damage_reports`
  - constrain `borrow_requests` INSERT (`status`/`request_type`) — students can currently submit `request_type:'faculty'`, `status:'approved'`
- **Missing PLAN files:** `scripts/seed-demo.mjs`, `generate-types.mjs`, `database/seed-data.sql`; `docs/` is empty.

---

## Quick Stats (corrected, Aug 14, 2026)

| Area | ✅ Verified Working | 🟡 Partial / Broken | 🔴 Missing |
|---|---|---|---|
| Web App | Layouts, most admin CRUD pages, auth proxy guard, realtime on web, reports/PDF/email wiring | API auth (`/api/email`), damage-report RLS, Cloudinary upload, faculty `department` queries, settings persistence, 58 lint errors | PWA, QR codes, push, subject filtering |
| Mobile App | All 13 screens render, login/role redirect, borrow insert, request detail | Login (RLS), faculty return/borrow (RLS), student home, notifications, profile, borrow form, faculty schedule absent | Student return flow, faculty schedule, push + Realtime, change-password/delete-account |

---

## What's Already Complete (verified, Aug 14, 2026)

### Web (24 pages)
- Admin: dashboard, equipment CRUD, categories, borrow-requests (dual tab + damage + countdown), students, faculty, activity-logs, damage-reports, maintenance, announcements, notifications, settings, reports dashboard, class schedules
- Faculty: dashboard, borrow wizard, approvals, equipment catalog, history, profile, announcements, schedule (hidden)
- Public: landing page, login, password reset
- API: `/api/reports/monthly`, `/api/reports/activity-logs`, `/api/email` (⚠️ unauthenticated), reset endpoints
- Route protection via `web/proxy.ts` (Next 16 middleware replacement) + client-side layout guards

### Mobile (13 screens)
- Auth: login with role-based redirect (⚠️ blocked by RLS)
- Student: home, requests, borrow form, request detail, notifications, profile, damage reports
- Faculty: home dashboard, approvals, notifications, profile, borrow equipment, return equipment

### Utilities
- `web/lib/logger.ts` — activity logging
- `web/lib/notifications.ts` — notification creation (admin flows only)
- `web/lib/email.ts` — Gmail SMTP email sending
- `web/lib/pdf.ts` — professional PDF reports
- `web/lib/cloudinary.ts` — image upload (⚠️ missing upload preset env)
- `scripts/migrate-firebase.cjs`, `scripts/migrate-mysql.cjs/.mjs`

### Database
- 13 tables, full RLS policies, auto-update triggers
- MySQL data migration complete (4 users, 8 categories, 7 equipment, 4 borrows)
- Schema in `database/schema.sql`, RLS in `database/rls-policies.sql` (⚠️ drift vs app code)

---

## Remaining — Suggested Fix Order

### Priority 1 — Critical blockers
1. Fix mobile login RLS (allow anon lookup by `id_no`, or login by email)
2. Fix faculty return/borrow RLS (borrow_items + borrow_requests + equipment updates)
3. Authenticate + rate-limit `POST /api/email`
4. Fix `equipment.department` query bug (add column or remove filter)
5. Add admin INSERT policy for `damage_reports`
6. Add `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` to `.env.local`
7. Add `android.package` (+ `scheme`) to `mobile/app.json`

### Priority 2 — Capstone requirements
8. Push notifications (Expo Push API + token registration + `/api/notifications/send`)
9. Subject-based filtering (DB tables + admin tags + UI)
10. Mobile student return flow
11. Mobile faculty schedule screen

### Priority 3 — Security
12. Rotate committed secrets (seed-images.cjs, migrate-mysql.mjs)
13. Delete `test-credentials.txt`
14. Tighten `activity_logs` INSERT policy
15. Add role checks to `/api/reports/*`

### Priority 4 — Completeness
16. Wire orphan pages into nav
17. PWA manifest/service worker
18. QR code generation
19. DB-backed settings
20. Faculty approval notifications + mobile notification deep-links/Realtime

### Priority 5 — Polish
21. Fix 58 lint errors
22. Date pickers + validation in borrow forms
23. Replace `Alert.prompt` (iOS-only)
24. Profile: change-password, delete-account, picture upload
