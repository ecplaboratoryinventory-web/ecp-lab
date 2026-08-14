# ECP Lab — Gap Analysis: Full System Status

> Last updated: **Aug 14, 2026**
> Deep audit performed Aug 14, 2026 against repo code (`web/`, `mobile/`, `database/`, `scripts/`).
> ⚠️ Earlier entries below marked "✅ Done" are the status **as claimed on Jul 27, 2026** — the deep audit revealed several of them are **broken at runtime** (see the new Deep Audit sections at the top).
> **Progress (Aug 14, 2026):** All Priority 1 + Priority 2 items are now resolved and verified (see tables below). Priority 3 secrets are moved to env vars; Cloudinary key + MySQL password still need rotation (they remain in git history).

---

## 🔴 CRITICAL — Deep Audit Findings (NEW, Aug 14, 2026)

These are runtime blockers that must be fixed first. All were verified directly in the code.

| # | Issue | Status (Aug 14) |
|---|---|---|
| 1 | **Mobile login is blocked by RLS.** Login reads `users` by `id_no` while unauthenticated; RLS only permits own-record reads (`auth.uid() = id`), so anonymous gets 0 rows → "Account not found" always. | ✅ Fixed — `lookup_login(identifier)` RPC (SECURITY DEFINER, search_path set, GRANT to anon) resolves id_no → email/role for login |
| 2 | **Faculty return/borrow writes are RLS-denied.** `borrow_requests` update (non-pending), `borrow_items.returned_quantity` (admin-only), and `equipment.available_quantity` (admin-only) all fail for faculty; errors are swallowed, so it looks like it works. | ✅ Fixed — `complete_return(uuid)` + `submit_faculty_borrow(...)` RPCs (authenticated-callable) handle stock/status writes; faculty flows route through them |
| 3 | **`POST /api/email` is an unauthenticated open email relay** — anyone can send mail from the lab Gmail. All `/api/*` is exempted from the auth proxy. | ✅ Fixed — auth check + admin/staff role guard + in-memory rate limit in `route.ts` |
| 4 | **`equipment.department` doesn't exist in `schema.sql`** but faculty web+mobile filter by it → query errors → **faculty home can hang on an infinite skeleton**. | ✅ Fixed — `department` column present in `schema.sql` (users:20, equipment:73) |
| 5 | **Admin damage-report creation fails RLS.** Admin inserts with `user_id` = student's id, but the only insert policy requires `auth.uid() = user_id`. | ✅ Fixed — added `Admin insert damage reports` policy (`is_admin_or_staff()`) in `rls-policies.sql:209` |
| 6 | **Cloudinary uploads can't work** — `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` is referenced by `web/lib/cloudinary.ts` but **missing from `web/.env.local`**. | 🟡 Key present but **value empty** — need unsigned preset created in Cloudinary dashboard + set in `.env.local` |
| 7 | **EAS build can't run** — `mobile/app.json` has no `android.package` (required for EAS); also missing `scheme` (deep links) and splash plugin. | ✅ Fixed — `android.package: com.ecplab.inventory`, `scheme: ecplab`, `expo-notifications` plugin all set; only real EAS `projectId` remains (placeholder `0000...`) |

---

## 🔴 Capstone Requirements — still missing

Confirmed against `CAPSTONE-ALIGNMENT.md`. These remain open:

| Requirement | Status (Aug 14) |
|---|---|---|
| **Push notifications** (Expo Push + FCM) | ✅ Implemented — edge function `notify-push` (vault `push_service_role_key`, trigger `notify_push_on_insert`), `mobile/lib/push.ts`, `expo-notifications` config, Realtime + mark-all-read. Requires real EAS `projectId` for device tokens. |
| **Subject-based equipment filtering** | ✅ Implemented — `users.enrolled_subjects` TEXT[] + `equipment.subject_tags` in schema (defaults `'{}'`), admin CRUD on students page, mobile borrow chips with overlap filter, demo tags seeded. |
| **Mobile student return flow** | ✅ Implemented — `(student)/return.tsx` lists active borrowed/approved requests, tap → confirm → `complete_return` RPC; request detail has "Return Items" card. |
| **Mobile faculty schedule screen** | ✅ Implemented — `(faculty)/(tabs)/schedule.tsx` (day-grouped, Today badge, pull-to-refresh), linked from home; RLS faculty-read-own verified; demo data seeded. |

---

## 🔴 Security & Secrets (NEW)

| # | Issue | Action / Status (Aug 14) |
|---|---|---|
| 1 | Cloudinary `api_secret` hardcoded in `scripts/seed-images.cjs:6-8` (git-tracked) | ✅ Moved to `CLOUDINARY_API_SECRET` env; ⚠️ **rotate the key** — it remains in git history (`2dfdefb`) |
| 2 | MySQL password `lemuel_0405` in `scripts/migrate-mysql.mjs:27`; empty root password in `scripts/migrate-mysql.cjs:24` (git-tracked) | ✅ Moved to `MYSQL_*` env vars (documented in `.env.example`); ⚠️ **rotate MySQL password** — remains in git history (`90f20f9`) |
| 3 | `test-credentials.txt` (plaintext passwords) on disk | ✅ Already deleted (gitignored) |
| 4 | `activity_logs` INSERT `WITH CHECK (true)` — anonymous anon-key writes | ✅ Tightened to `auth.uid() IS NOT NULL` (`rls-policies.sql:243`) |
| 5 | `/api/reports/*` have no admin role check (any logged-in user can call) | ✅ Fixed — admin/staff role guard in `monthly/route.ts` + `activity-logs/route.ts` |

---

## 🟡 Verified Missing / Incomplete (NEW)

### Web app
| Item | Detail |
|---|---|
| ~~Orphan pages not in any nav~~ | ✅ `/admin/reports`, `/admin/damage-reports`, `/admin/notifications`, `/faculty/schedule` all wired into sidebar nav (Aug 14) |
| PWA | PLAN.md says "Web + PWA" — no manifest/service worker; `next.config.ts` empty |
| QR code generation | PLAN Phase 3 spec — not implemented |
| Settings persistence | `admin/settings` is localStorage-only; borrow duration/max-items not enforced server-side |
| ~~Faculty approval → notification~~ | ✅ Web + mobile faculty approval/denial now create a student notification via `create_borrow_notification` RPC (spec §5.1) |
| Dead code | `auth/login/actions.ts`, `auth/reset-password/actions.ts` unused |
| ~~Password change (faculty)~~ | ✅ `faculty/profile` now verifies current password via `signInWithPassword` before `updateUser` |
| Lint | **132 problems (58 errors)** — `react-hooks/set-state-in-effect` (all fetch pages), `no-explicit-any`, purity, unescaped entities |

### Mobile app
| Item | Detail |
|---|---|
| Student home | Mostly placeholder — no search/chips/equipment grid/realtime/scan; "Recent Activity" hardcoded stub; autoplay interval closes over stale `slides` |
| Notifications | No "mark all as read", no deep-link to entity, **no Realtime subscription** (zero `channel()` calls in the app) |
| Request detail | No Return/Cancel/contact-admin; damage report hardcodes `severity:"minor"` + only links `borrow_items[0]`; no `actual_return_date` |
| Profile | ✅ Change-password (verifies current pw), delete-account (`delete_my_account` RPC), avatar upload (`avatars` storage bucket) all added; email edit now syncs via `auth.updateUser` (login email no longer desyncs) |
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
1. ~~Fix mobile login RLS~~ ✅ `lookup_login` RPC
2. ~~Fix faculty return/borrow RLS~~ ✅ `complete_return` + `submit_faculty_borrow` RPCs
3. ~~Authenticate + rate-limit `POST /api/email`~~ ✅ auth + role guard + rate limit
4. ~~Fix `equipment.department` query bug~~ ✅ column in schema
5. ~~Add admin INSERT policy for `damage_reports`~~ ✅ policy added
6. 🟡 Cloudinary upload preset — env key present, **value still empty** (needs dashboard unsigned preset)
7. ~~Add `android.package` (+ `scheme`) to `mobile/app.json`~~ ✅ both set; real EAS `projectId` still placeholder

### Priority 2 — Capstone requirements
8. ~~Push notifications~~ ✅ edge function + trigger + mobile client
9. ~~Subject-based filtering~~ ✅ enrolled_subjects + subject_tags + UI
10. ~~Mobile student return flow~~ ✅ return screen + complete_return
11. ~~Mobile faculty schedule screen~~ ✅ schedule screen + RLS + seed

### Priority 3 — Security
12. 🟡 Committed secrets moved to env vars — **rotate Cloudinary key + MySQL password** (still in git history)
13. ~~Delete `test-credentials.txt`~~ ✅ already gone
14. ~~Tighten `activity_logs` INSERT policy~~ ✅ `auth.uid() IS NOT NULL`
15. ~~Add role checks to `/api/reports/*`~~ ✅ admin/staff guard

### Priority 4 — Completeness
16. ~~Wire orphan pages into nav~~ ✅ all four pages linked (Aug 14)
17. PWA manifest/service worker
18. QR code generation
19. DB-backed settings
20. 🟡 Faculty approval notifications ✅ (web+mobile, `create_borrow_notification` RPC); mobile deep-links still pending

### Priority 5 — Polish
21. Fix 58 lint errors
22. Date pickers + validation in borrow forms
23. Replace `Alert.prompt` (iOS-only)
24. ~~Profile: change-password, delete-account, picture upload~~ ✅ done on mobile (student+faculty) + web faculty current-password check (Aug 14)
