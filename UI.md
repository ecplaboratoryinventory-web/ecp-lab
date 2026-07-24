# ECP Lab — UI Mapping: Current System → New System

This document maps every user-facing screen from the **current system** (PHP web app + Android app) to its equivalent in the **new system** (Next.js web + Expo mobile app).

---

## Legend

| Icon | Meaning |
|---|---|
| **→ Web** | Mapped to Next.js web app |
| **→ Mobile** | Mapped to Expo mobile app |
| **→ Both** | Exists in both web and mobile |
| **→ Removed** | No longer needed (consolidated) |
| **→ New** | New feature (Capstone 2) |
| **→ Renamed** | Replaced with new name/approach |

---

## 1. Public / Landing Pages (No Login Required)

### Current: PHP Web App

| # | Current Page | Current Purpose | New System Mapping |
|---|---|---|---|
| 1 | `index.php` | Landing page — hero slider, stats bar, features, about, footer. Auto-redirects if logged in. | **→ Web** `web/app/page.tsx` — Public landing page with hero section, feature highlights, login/get-started CTA buttons. Simplified single-page layout. |
| 2 | `login.php` | Admin login — two-panel card, username/password, CSRF token, rate limiting (5 attempts/60s). Redirects admins to `dashboard.php`, faculty to `teacher/teacher_dashboard.php`. | **→ Web** `web/app/auth/login/page.tsx` — Unified login for admin + staff. Email + password. Role-based redirect after auth. |
| 3 | `register.php` | Registration form for students and faculty — fields for name, username, ID, email, role, password. Sends verification email. | **→ Removed** Registration is now admin-managed. New users are created by admins via `/admin/students` and `/admin/faculty` pages. Self-registration not needed. |
| 4 | `teacher/faculty_login.php` | Faculty login — separate page querying `account` table. Dark gradient background, username/email + password. | **→ Web** `web/app/auth/login/page.tsx` — Same unified login. Faculty enters email + password, middleware redirects to `/faculty/dashboard`. |
| 5 | `student/login.php` | Student login — authenticates against Firebase `students` node via `student_number` + password. Sets session from Firebase data. | **→ Mobile** `mobile/app/(auth)/login.tsx` — Unified login for students + faculty. Email + password via Supabase Auth. Role-based redirect to student or faculty tabs. |

---

## 2. Admin Pages (Role: Admin / Staff)

### Current: PHP Web App

| # | Current Page | Current Purpose | New System Mapping |
|---|---|---|---|
| 6 | `dashboard.php` | Admin dashboard — 4 stat cards (total, available, in-use, maintenance), donut chart (equipment by category), bar chart (equipment by status), recent equipment table, recent student borrowings table. Skeleton loading, count-up animations. | **→ Web** `web/app/(admin)/dashboard/page.tsx` — Admin dashboard with stat cards, equipment status charts (recharts), recent borrows table, pending approvals widget, real-time alerts. |
| 7 | `equipment.php` | Equipment management — full CRUD. Status filter chips, category tabs, search, table (code, name, category, qty, status, actions), add/edit/delete modals, CSV import with template download, CSV export, class schedule conflict validation. | **→ Web** `web/app/(admin)/equipment/page.tsx` — Equipment list with shadcn/ui data table. Server-side pagination + search. Create/edit/delete modals. Cloudinary image upload. CSV import/export. QR code generation. |
| 8 | `categories.php` | Category management — 3 stat cards, categories table (ID, name, description, equipment count, created), bar chart (distribution), add/edit modals, delete protection. | **→ Web** `web/app/(admin)/categories/page.tsx` — Categories + subcategories management. Two-panel layout (categories list / subcategories list). CRUD modals. Chart showing equipment per category. |
| 9 | `borrowings.php` | Borrowings management — dual-tab (Student / Faculty). Student tab: 6 stat cards, status filter, countdown timers, approve/reject/return/damage/replace modals, overdue banner. Faculty tab: 4 stat cards, live table, return action. | **→ Web** `web/app/(admin)/borrow-requests/page.tsx` — Unified borrow requests table with type filter (student/faculty). Status badges, approve/deny/borrowed/returned actions. Detail modal with items, timeline, damage report link. |
| 10 | `users.php` | User verification — manages registration requests from `register` table. 4 stat cards, filter bar, table with bulk approve/reject, individual actions, view detail modal. | **→ Removed** Self-registration no longer exists. User management is split into `students` (page 11) and `faculty` (page 12) pages. |
| 11 | `students.php` | Student management — CRUD against Firebase `students` node. 4 stats, search, table (student no, name, section, course, status, registered date), add/edit modals, CSV import/export. | **→ Web** `web/app/(admin)/students/page.tsx` — Student accounts table. Create student (with Supabase Auth signup), edit, approve/reject, reset password, delete. CSV import/export. |
| 12 | `manage_account.php` | Staff/Faculty account management — CRUD against MySQL `account` table. 4 stats, filter/search, table (ID, photo, name, email, role, status, created), add/edit modals with profile pic upload, CSV upload, auto-email credentials. | **→ Web** `web/app/(admin)/faculty/page.tsx` — Faculty accounts table. Same pattern as students: create (with Supabase Auth), edit, approve/reject, reset password, delete. Profile picture via Cloudinary. |
| 13 | `logs.php` | Activity logs — Firebase `activity_logs`. Date filter, search, paginated table (timestamp, user, action, type, description, IP, user agent), print PDF. | **→ Web** `web/app/(admin)/activity-logs/page.tsx` — Read-only activity log table with filters (user, action, date range, entity type). Print/export to PDF. |
| 14 | `notifications.php` | Notifications inbox — MySQL-driven. Mark-read, mark-all-read, delete. | **→ Web** `web/app/(admin)/notifications/page.tsx` — Notification list with mark-read, mark-all-read, delete. Realtime updates via Supabase Realtime. |
| 15 | `profile.php` | Admin profile — edit name/email, change password, profile picture upload. | **→ Web** `web/app/(admin)/settings/page.tsx` (profile section) — Edit profile, change avatar (Cloudinary), change password. |
| 16 | `print_logs.php` | Print activity logs PDF — Dompdf report with logo, date range, table, summary. | **→ Web** `web/app/api/reports/activity-logs/route.ts` — API route generating PDF via react-pdf or jsPDF. Called from the activity logs page. |
| 17 | `print_reports.php` | Monthly activity report PDF — Dompdf. Equipment stats, borrowing summaries, top borrowed. Params: month, year, output type. | **→ Web** `web/app/api/reports/monthly/route.ts` — API route generating monthly report PDF. Called from dashboard or dedicated reports page. |

### New Admin Pages (Not in Current System)

| # | New Page | Purpose | Platform |
|---|---|---|---|
| — | `web/app/(admin)/maintenance/page.tsx` | Schedule and track equipment maintenance. Calendar view + table. Mark as completed. Migrated from MySQL `maintenance` table. | **→ New** Web |
| — | `web/app/(admin)/announcements/page.tsx` | Create/edit/delete system announcements. Target by role (`all` / `student` / `faculty` / `admin`). Priority levels. Publish scheduling. Capstone 2 feature. | **→ New** Web |
| — | `web/app/(admin)/settings/page.tsx` | System settings: borrow duration limits, email notification toggles, maintenance mode, system name/logo. | **→ New** Web |

---

## 3. Faculty Pages (Role: Faculty)

### Current: PHP Web App

| # | Current Page | Current Purpose | New System Mapping |
|---|---|---|---|
| 18 | `teacher/teacher_dashboard.php` | Faculty dashboard — welcome banner with name/role. Stats: total equipment, available, active borrowings, pending requests. Charts: borrowing trends, equipment by status. Recent borrowings table. Quick action cards. | **→ Both** |
| | | | **→ Web** `web/app/(faculty)/dashboard/page.tsx` — Faculty web dashboard for desktop use. |
| | | | **→ Mobile** `mobile/app/(faculty)/(tabs)/home.tsx` — Faculty mobile dashboard with stat cards, today's schedule preview, quick actions, recent notifications. |
| 19 | `teacher/teacher_equipment.php` | Faculty equipment view — read-only equipment list from MySQL. Category filter, search, table (code, name, category, available qty, location, status). No CRUD. | **→ Both** |
| | | | **→ Web** `web/app/(faculty)/equipment/page.tsx` — Read-only equipment list. |
| | | | **→ Mobile** Integrated into `mobile/app/(faculty)/borrow.tsx` — equipment is browsed during the borrow flow, not as a standalone screen. |
| 20 | `teacher/teacher_borrow_equipment.php` | Faculty borrow — two-step wizard against Firebase `faculty_borrow`. Step 1: select equipment. Step 2: confirm with borrow code + subject/section. Checks availability, updates Firebase. | **→ Both** |
| | | | **→ Web** `web/app/(faculty)/borrow/page.tsx` — Multi-step borrow form. Auto-approved. Subject/section fields. |
| | | | **→ Mobile** `mobile/app/(faculty)/borrow.tsx` — Same multi-step borrow flow in mobile. Auto-approved. Optional class schedule link. |
| 21 | `teacher/teacher_return_equipment.php` | Faculty return — shows borrowed item details. Form with return remarks. Updates MySQL: status, return date, restores qty. | **→ Both** |
| | | | **→ Web** `web/app/(faculty)/borrow/page.tsx` (return section) or dedicated return page. |
| | | | **→ Mobile** `mobile/app/(faculty)/borrow.tsx` includes return flow for items with status `borrowed`. |
| 22 | `teacher/teacher_requests.php` | Faculty track requests — all faculty borrowings with status. Add/edit/delete comments per request. Search filter. | **→ Web** `web/app/(faculty)/history/page.tsx` — Past borrow requests table with detail view. |
| | | | **→ Mobile** `mobile/app/(faculty)/(tabs)/home.tsx` shows active borrows; history accessible from profile. |
| 23 | `teacher/student_borrow.php` | Faculty manages student borrowings — Firebase `borrow_requests`. Approve/reject/return/damage/replace modals (same as admin). Overdue banner, countdown timers, stats row. | **→ Both** |
| | | | **→ Web** `web/app/(faculty)/approvals/page.tsx` — Student borrow requests pending faculty approval. Approve/deny actions. |
| | | | **→ Mobile** `mobile/app/(faculty)/(tabs)/approvals.tsx` — Same approval flow on mobile. Swipe to approve, tap to deny with reason. |
| 24 | `teacher/teacher_announcement.php` | Faculty announcements — write new (title, content), view feed sorted by date, edit/delete own. | **→ Both** |
| | | | **→ Web** (Capstone 2) Faculty can view announcements in `web/app/(faculty)/announcements/page.tsx`. |
| | | | **→ Mobile** `mobile/app/(faculty)/(tabs)/notifications.tsx` — Announcements appear as notification type `announcement`. |
| 25 | `teacher/profile_teacher.php` | Faculty profile — edit name/email/contact, change password, upload profile picture, theme preference. | **→ Both** |
| | | | **→ Web** Profile section in faculty layout (dropdown). |
| | | | **→ Mobile** `mobile/app/(faculty)/(tabs)/profile.tsx` — Edit profile, change password, logout. |
| 26 | `teacher/firebase_debug.php` | Firebase debug borrow — duplicate of `teacher_borrow_equipment.php`. | **→ Removed** Debug page not needed in production system. |
| 27 | `teacher/skeleton_loading.php` | Skeleton loading templates — CSS + HTML for loading states. | **→ Removed** Skeleton loading is built into component-level loading states (React Suspense) instead of separate include files. |

### New Faculty Pages (Not in Current System)

| # | New Page | Purpose | Platform |
|---|---|---|---|
| — | `mobile/app/(faculty)/schedule.tsx` | Class schedule view. Weekly calendar. Tap class → borrow equipment for that session. Capstone 2. | **→ New** Mobile |
| — | `web/app/(faculty)/schedule/page.tsx` | Web version of class schedule view. | **→ New** Web |

---

## 4. Student Pages (Role: Student)

### Current: PHP Web App

| # | Current Page | Current Purpose | New System Mapping |
|---|---|---|---|
| 28 | `student/student_dashboard.php` | Student web dashboard — left sidebar with profile card. Equipment browsing with category filters. Borrow equipment form (select item, purpose, quantity). "My Borrowings" table with countdown timer. Real-time Firebase. | **→ Removed** (web) The student web portal is being replaced entirely by the mobile app. |
| | | | **→ Mobile** `mobile/app/(student)/(tabs)/home.tsx` — Home screen with category carousel, equipment grid, search. |
| | | | **→ Mobile** `mobile/app/(student)/borrow.tsx` — Multi-step borrow form. |
| | | | **→ Mobile** `mobile/app/(student)/(tabs)/requests.tsx` — My borrowings list with status badges. |
| 29 | `student/logout.php` | Student logout — destroys session. | **→ Mobile** `mobile/app/(student)/(tabs)/profile.tsx` — Logout button in profile screen. |

### Current: Android App (Student-Only)

| # | Current Screen | Current Purpose | New System Mapping |
|---|---|---|---|
| 30 | `SplashActivity` | Splash — logo, app name, simulated progress bar with loading messages. Auto-navigates to login. | **→ Mobile** `mobile/app/_layout.tsx` — Root layout handles initial auth check. No splash screen needed (Expo Router navigates immediately). Animated splash can be added as an optional enhancement. |
| 31 | `LoginActivity` | Student login — `student_number` + `password` against Firebase `students` node. Saves session to SharedPreferences. Persistent login check. | **→ Mobile** `mobile/app/(auth)/login.tsx` — Unified login with email + password via Supabase Auth. Session persisted via `expo-secure-store`. |
| 32 | `MainActivity` | Main shell — `CoordinatorLayout` with `FrameLayout` (fragment container), custom bottom nav (Home, Requests, Notification, Profile), FAB (Borrow). Manages fragment switching. | **→ Mobile** `mobile/app/(student)/_layout.tsx` — Tab navigator with 4 tabs (Home, Requests, Notifications, Profile) and a Borrow button (header action or center tab). |
| 33 | `HomeFragment` | Student home — greeting with name, auto-rotating ViewPager2 carousel (3 items), "Recent Activity" placeholder. | **→ Mobile** `mobile/app/(student)/(tabs)/home.tsx` — Greeting, equipment category carousel, search bar, featured equipment, recent activity feed. |
| 34 | `BorrowFragment` | Equipment browsing + borrowing — category filter chips, search bar, 2-column GridView of equipment with availability indicators. Single-tap → `BorrowFormActivity`. Multi-select → "Borrow Selected". Skeleton loading. | **→ Mobile** `mobile/app/(student)/borrow.tsx` — Multi-step borrow flow: Step 1 (equipment selection with search + filter), Step 2 (purpose + dates), Step 3 (review + submit). Integrated into single screen flow instead of fragment → activity. |
| 35 | `BorrowFormActivity` | Borrow form — pre-filled item name (disabled), quantity stepper, purpose field, Clear/Submit. Writes to Firebase `borrow_requests` with status `pending`. Multi-borrow via comma-separated IDs. | **→ Mobile** Part of `mobile/app/(student)/borrow.tsx` (Steps 2-3). Quantity stepper, purpose field, date pickers, submit. |
| 36 | `RequestsFragment` | My borrow requests — `RecyclerView` with `SwipeRefreshLayout`. Real-time Firebase listener. Filters by student number. Sorted newest-first. Empty state. Tap → `TrackingBottomSheetFragment`. | **→ Mobile** `mobile/app/(student)/(tabs)/requests.tsx` — Requests list with pull-to-refresh, real-time updates, status badges. Tap → `mobile/app/(student)/request/[id].tsx`. |
| 37 | `TrackingBottomSheetFragment` | Request tracking — 3-step progress indicator (Pending → Borrowed → Returned). Request details. "Report Equipment Damage" card (visible when Borrowed). Submits to `damage_reports` node. | **→ Mobile** `mobile/app/(student)/request/[id].tsx` — Full-screen request detail with status timeline (visual stepper), item list, action buttons (return, cancel, report damage). |
| 38 | `NotificationFragment` | Notifications — `RecyclerView` from Firebase `notifications`. Real-time listener. Sorted by date. Tap marks as read. Read items at 60% alpha. | **→ Mobile** `mobile/app/(student)/(tabs)/notifications.tsx` — Notification list with real-time updates, unread indicators, tap to navigate to related entity. |
| 39 | `ProfileFragment` | Student profile — avatar, name, email, student ID, course, status, borrow stats (total, active, returned). Edit dialog (firstname, lastname, email, course). Logout. Skeleton loading. | **→ Mobile** `mobile/app/(student)/(tabs)/profile.tsx` — Profile display, edit profile (Cloudinary avatar upload), change password, borrow stats, logout. |

---

## 5. Logout Pages

| # | Current Page | New System Mapping |
|---|---|---|
| 40 | `logout.php` — Admin logout, destroys session, redirects to `login.php`. | **→ Web** Logout button in admin header dropdown. Calls `supabase.auth.signOut()`, redirects to `/auth/login`. |
| 41 | `logout2.php` — Incomplete stub, no destruction. | **→ Removed** Not used. |
| 42 | `teacher/logout.php` — Faculty logout, clears session vars + cookie, redirects to `login.php`. | **→ Web** Logout button in faculty header. |
| | | **→ Mobile** Logout button in faculty profile screen (`mobile/app/(faculty)/(tabs)/profile.tsx`). |

---

## 6. UI Structure / Layout Components (Includes → React Components)

| # | Current File | Current Purpose | New System Mapping |
|---|---|---|---|
| 43 | `includes/header.php` | Admin header — HTML `<head>`, top navbar with branding, notification bell dropdown, profile dropdown, responsive mobile bottom nav. Bootstrap, Font Awesome, DataTables, Chart.js. | **→ Web** `web/app/(admin)/layout.tsx` — Admin shell with shadcn/ui sidebar, top header, user menu, notification badge. Tailwind CSS replaces Bootstrap. recharts replaces Chart.js. |
| 44 | `includes/sidebar.php` | Sidebar placeholder — empty file. | **→ Web** `web/components/admin/sidebar.tsx` — shadcn/ui sidebar component with collapsible sections. Links to all admin pages. |
| 45 | `includes/footer.php` | Admin footer — closes `.content-wrapper`. Bottom sheet dialog (Categories, Logs & Reports, Staff/Faculty, Profile, Logout). Mobile bottom nav (5 items). Bootstrap JS, etc. | **→ Web** Not needed. shadcn/ui sidebar + header replace footer navigation. Mobile responsive behavior handled by Tailwind breakpoints. |
| 46 | `teacher/teacher_header.php` | Faculty header — profile fetch from `account`. Top navbar with nav links, profile dropdown. Responsive sidebar. | **→ Web** `web/app/(faculty)/layout.tsx` — Faculty web shell with top nav and responsive sidebar. |

---

## 7. Full Navigation Flow — New System

### Web App (Next.js)

```
Public
└── /                          Landing page
└── /auth/login                Unified login (admin, staff, faculty)

Admin (after login → /admin/dashboard)
├── /admin/dashboard           Stat cards, charts, recent activity
├── /admin/equipment           Equipment CRUD, CSV import/export, QR codes
├── /admin/categories          Categories + subcategories
├── /admin/borrow-requests     All borrows, approve/deny/return
├── /admin/students            Student account management
├── /admin/faculty             Faculty account management
├── /admin/damage-reports      Damage report management
├── /admin/activity-logs       Read-only audit log
├── /admin/maintenance         Maintenance scheduling
├── /admin/announcements       Create/manage announcements
└── /admin/settings            System settings, profile

Faculty (after login → /faculty/dashboard)
├── /faculty/dashboard         Stats, quick actions, schedule preview
├── /faculty/borrow            Borrow equipment (auto-approved)
├── /faculty/approvals         Approve/deny student requests
├── /faculty/schedule          View class schedule
└── /faculty/history           Past borrows
```

### Mobile App (Expo)

```
Auth
└── (auth)/login               Unified login (student, faculty)

Student (after login)
└── (student)
    ├── (tabs)/
    │   ├── home.tsx            Equipment carousel, search, browse
    │   ├── requests.tsx        My borrow requests list
    │   ├── notifications.tsx   Notification list
    │   └── profile.tsx         Profile, edit, logout
    ├── borrow.tsx              Multi-step borrow (FAB target)
    ├── return.tsx              Return borrowed items
    └── request/[id].tsx       Request detail, status timeline, damage report

Faculty (after login)
└── (faculty)
    ├── (tabs)/
    │   ├── home.tsx            Dashboard, stats, quick actions
    │   ├── approvals.tsx       Approve/deny student requests
    │   ├── notifications.tsx   Notification list
    │   └── profile.tsx         Profile, edit, logout
    ├── borrow.tsx              Borrow equipment (auto-approved)
    └── schedule.tsx            Class schedule view
```

---

## 8. Summary: Count of Screens

| Role | Current (PHP + Android) | New (Web + Mobile) | Change |
|---|---|---|---|
| Public/Landing | 5 pages | 2 pages | Consolidated |
| Admin | 12 pages | 12 pages | +3 new (maintenance, announcements, settings), -3 removed (register, users, firebase_debug, skeleton) |
| Faculty | 10 pages | 8 screens web + 6 screens mobile | Split across platforms |
| Student (Web) | 2 pages | 0 pages | Fully moved to mobile |
| Student (Android) | 10 screens | 7 screens mobile | Consolidated flows |
| Logout | 3 pages | 2 buttons (web) + 1 button (mobile) | Simplified |
| UI Components | 4 includes | 3 layout files + component library | Modernized |
| **Total** | **~46 screens** | **~28 screens** | **Consolidated — no feature loss** |

---

## 9. Feature Equivalence Table

| Feature | Current System | New Web | New Mobile |
|---|---|---|---|
| Landing page | `index.php` | `/` | — |
| Admin login | `login.php` | `/auth/login` | — |
| Faculty login | `teacher/faculty_login.php` | `/auth/login` | `(auth)/login` |
| Student login | `student/login.php` | — | `(auth)/login` |
| Admin dashboard | `dashboard.php` | `/admin/dashboard` | — |
| Equipment CRUD | `equipment.php` | `/admin/equipment` | — |
| Categories + subcategories | `categories.php` | `/admin/categories` | — |
| Borrow management (admin) | `borrowings.php` | `/admin/borrow-requests` | — |
| Student management | `students.php` | `/admin/students` | — |
| Faculty management | `manage_account.php` | `/admin/faculty` | — |
| Activity logs | `logs.php` | `/admin/activity-logs` | — |
| Notifications inbox | `notifications.php` | `/admin/notifications` | `(student|faculty)/(tabs)/notifications` |
| Profile | `profile.php` | `/admin/settings` (section) | `(student|faculty)/(tabs)/profile` |
| Print reports | `print_logs.php`, `print_reports.php` | API routes | — |
| Faculty dashboard | `teacher/teacher_dashboard.php` | `/faculty/dashboard` | `(faculty)/(tabs)/home` |
| Faculty equipment list | `teacher/teacher_equipment.php` | `/faculty/equipment` | (in borrow flow) |
| Faculty borrow | `teacher/teacher_borrow_equipment.php` | `/faculty/borrow` | `(faculty)/borrow` |
| Faculty return | `teacher/teacher_return_equipment.php` | (in borrow page) | `(faculty)/borrow` (return section) |
| Faculty track requests | `teacher/teacher_requests.php` | `/faculty/history` | (in profile/home) |
| Faculty manage student borrows | `teacher/student_borrow.php` | `/faculty/approvals` | `(faculty)/(tabs)/approvals` |
| Faculty announcements | `teacher/teacher_announcement.php` | `/faculty/announcements` | (in notifications) |
| Faculty profile | `teacher/profile_teacher.php` | (in header dropdown) | `(faculty)/(tabs)/profile` |
| Student web portal | `student/student_dashboard.php` | — | `(student)/(tabs)/home` + `(student)/borrow` + `(student)/(tabs)/requests` |
| Student borrow form | `BorrowFormActivity` (Android) | — | `(student)/borrow` |
| Student request tracking | `TrackingBottomSheetFragment` (Android) | — | `(student)/request/[id]` |
| Student return | (in request detail) | — | `(student)/return` |
| Damage reporting | (in tracking sheet) | `/admin/damage-reports` | `(student)/request/[id]` (damage card) |
| Maintenance | (missing — link in footer) | `/admin/maintenance` | — |
| Announcements (Capstone 2) | `teacher/teacher_announcement.php` | `/admin/announcements` | `(student|faculty)/(tabs)/notifications` (type: announcement) |
| Class schedules (Capstone 2) | `ClassSchedule.java` (model only, unused) | `/faculty/schedule` | `(faculty)/schedule` |
| Equipment carousel | `HomeFragment` (Android) | — | `(student)/(tabs)/home` |
| Borrow stats in profile | `ProfileFragment` (Android) | — | `(student|faculty)/(tabs)/profile` |
| QR scanning | (not implemented) | (on equipment detail) | (planned enhancement) |
| Push notifications | (not implemented) | — | Expo Push Notifications |
| Settings | (not implemented) | `/admin/settings` | — |

---

## 10. Screen Mockup Reference (Route → Layout Description)

### Web: Admin Routes

| Route | Layout Description |
|---|---|
| `/admin/dashboard` | 4 stat cards (row), 2 charts side-by-side (donut + bar), recent borrows table, recent activity feed (sidebar widget) |
| `/admin/equipment` | Top bar: search + category filter + "Add Equipment" button. Below: data table (image thumbnail, name, serial#, category, qty, available, status badge, actions dropdown) |
| `/admin/categories` | Left panel: categories list with drag handle. Right panel: selected category's subcategories list. Modal for add/edit. |
| `/admin/borrow-requests` | Filter chips (All, Pending, Approved, Borrowed, Returned, Denied). Type toggle (All, Student, Faculty). Data table with status badges. Click row → detail sidebar/modal with items list and action buttons. |
| `/admin/students` | Search bar + "Add Student" button. Data table (student #, name, course, section, email, status toggle, actions). Add/edit modal with all fields. |
| `/admin/faculty` | Same layout as students but with department column. |
| `/admin/damage-reports` | Data table (reporter, equipment, severity badge, status, date). Click → detail modal with description, images, resolve/dismiss buttons. |
| `/admin/activity-logs` | Date range picker + action type filter. Read-only table (timestamp, user avatar+name, action, entity, details expandable). Export button. |
| `/admin/maintenance` | Toggle: Calendar view / Table view. Table: equipment, description, scheduled date, status, actions. Calendar: month grid with maintenance event dots. |
| `/admin/announcements` | List view with publish status indicator. Create button → form (title, rich text content, target role dropdown, priority, publish now/schedule). |
| `/admin/settings` | Tabbed layout: General (system name, logo), Borrow Rules (max days, max items), Notifications (toggle per event), Profile (avatar, name, email, password change). |

### Web: Faculty Routes

| Route | Layout Description |
|---|---|
| `/faculty/dashboard` | Welcome banner. 3 stat cards (active borrows, pending approvals, today's classes). Quick action buttons (Borrow, Approve). Recent notifications feed. Current borrows compact table. |
| `/faculty/borrow` | Multi-step wizard: Step 1 = equipment search + select (grid with availability), Step 2 = quantity + purpose + dates, Step 3 = review + submit. Stepper indicator at top. |
| `/faculty/approvals` | Card list (not table — more mobile-friendly). Each card: student name, items, date, purpose, Approve/Deny buttons. Deny opens reason input. |
| `/faculty/schedule` | Weekly calendar grid (Mon–Fri). Each day shows class blocks as colored cards (subject, time, room). Tap card → detail popover with "Borrow for this class" link. |
| `/faculty/history` | Filtered table of past borrows. Filters: status, date range. Table: request ID, items, date borrowed, date returned, status badge. Click → detail modal. |

### Mobile: Student Routes

| Route | Layout Description |
|---|---|
| `(auth)/login` | Centered card with app logo, email input, password input, "Login" button. "Forgot password?" link. Loading spinner overlay. |
| `(student)/(tabs)/home` | Top: greeting + name. Horizontal category carousel (icon + label). Search bar with debounce. Equipment grid (2 columns, cards with image, name, availability dot). Pull-to-refresh. |
| `(student)/borrow` | Step 1: equipment selection — search + category chips, grid with checkmark selection, selected count bar at bottom. Step 2: quantity stepper per item + purpose textarea + date pickers (borrow date, return date) + notes. Step 3: review summary + "Submit Request" button. |
| `(student)/(tabs)/requests` | List with pull-to-refresh. Each row: equipment name summary, borrow date, status badge (colored). Empty state illustration + message. Tap → detail. |
| `(student)/request/[id]` | Status timeline at top (vertical stepper with animated checkmarks). Request info: items list with quantities, dates, purpose. Action buttons: "Return Items" (if borrowed), "Cancel Request" (if pending), "Report Damage" (if borrowed). Damage card expands with description + photo upload. |
| `(student)/return.tsx` | List of active borrows available for return. Each item: checkbox, condition selector (Good/Damaged/Lost), notes field. If damaged: damage description + optional camera/gallery photo. "Submit Return" button. |
| `(student)/(tabs)/notifications` | List grouped by date (Today, Yesterday, This Week, Older). Each item: type icon, title, message preview, timestamp. Unread: blue dot + bold text. Swipe to mark read. Tap → navigate to related entity. |
| `(student)/(tabs)/profile` | Avatar (with change camera icon overlay), name, student number, course, section, email. Stats cards row: total borrowed, active, returned. Menu items: Edit Profile, Change Password, Notification Preferences, About, Logout. |

### Mobile: Faculty Routes

| Route | Layout Description |
|---|---|
| `(auth)/login` | Same login screen as student — role-based redirect after auth. |
| `(faculty)/(tabs)/home` | Cards row: active borrows count, pending approvals count, today's classes count. Quick action buttons (Borrow Equipment, Approve Requests). Today's schedule preview (next class, time, room). Recent notifications. |
| `(faculty)/borrow` | Same multi-step flow as student. Additional: class schedule selector (optional). Auto-approved on submit. |
| `(faculty)/(tabs)/approvals` | Card list of pending student requests. Each card: student photo (placeholder), name, items, date, purpose. Swipe right → approve. Swipe left → deny (opens reason dialog). Pull-to-refresh. |
| `(faculty)/schedule.tsx` | Weekly calendar view (scrollable horizontally by week). Each day column shows class blocks. Tap block → detail popup. "Quick Borrow" button in popup pre-fills borrow form with class info. |
| `(faculty)/(tabs)/notifications` | Same as student notifications. Additional types: new approval request, schedule reminders. |
| `(faculty)/(tabs)/profile` | Same layout as student profile. Fields: department, employee ID. Same menu items. |

---

## 11. Key UI Changes Summary

| Aspect | Current System | New System |
|---|---|---|
| **Framework** | PHP + Bootstrap 5 + jQuery | Next.js 14 + Tailwind CSS + shadcn/ui |
| **Charts** | Chart.js (client-side rendered) | recharts (server-compatible React charts) |
| **Tables** | DataTables (jQuery plugin) | shadcn/ui data table (TanStack Table) |
| **Forms** | HTML + jQuery validation | React Hook Form + Zod |
| **Modals** | Bootstrap modals | shadcn/ui Dialog + Sheet |
| **Icons** | Font Awesome | lucide-react |
| **Mobile nav** | Custom bottom nav bar (footer.php) | shadcn/ui sidebar (web) / Expo Router tabs (mobile) |
| **Loading states** | Skeleton HTML includes | React Suspense + shadcn/ui Skeleton |
| **Animations** | CountUp.js, AOS | Framer Motion (optional) |
| **PDF** | Dompdf (PHP) | jsPDF or @react-pdf/renderer |
| **Images** | Local uploads | Cloudinary (transformations, CDN) |
| **Real-time** | Firebase listeners | Supabase Realtime |
| **Notifications** | MySQL-driven inbox | Supabase Realtime + Expo Push Notifications |
| **Dark mode** | Not supported | shadcn/ui built-in theme toggle |
| **Responsive** | Bootstrap breakpoints | Tailwind responsive utilities |
| **Student access** | PHP web + Android app | Expo mobile only |
| **Faculty access** | PHP web only | Expo mobile + Next.js web |
| **Admin access** | PHP web only | Next.js web only |

---

## 12. Migration Status Per Screen

| Screen | Status | Notes |
|---|---|---|
| Landing page | ✅ Plan | Simplified, single hero + CTA |
| Unified login | ✅ Plan | One login for all roles |
| Admin dashboard | ✅ Plan | Charts + stats + recent activity |
| Equipment CRUD | ✅ Plan | CSV import/export, Cloudinary images |
| Categories + Subcategories | ✅ Plan | Two-panel layout |
| Borrow management (admin) | ✅ Plan | Unified student + faculty |
| Student management | ✅ Plan | Supabase Auth integration |
| Faculty management | ✅ Plan | Same as student but with department |
| Activity logs | ✅ Plan | Filter + export |
| Maintenance | ✅ Plan | Calendar view + table |
| Announcements (admin) | 🆕 New | Capstone 2 |
| Admin settings | 🆕 New | System config |
| Faculty dashboard (web) | ✅ Plan | Stats + quick actions |
| Faculty borrow (web) | ✅ Plan | Multi-step, auto-approved |
| Faculty approvals (web) | ✅ Plan | Approve/deny student requests |
| Faculty schedule (web) | 🆕 New | Capstone 2 |
| Faculty history (web) | ✅ Plan | Past borrows |
| Faculty announcements (web) | ✅ Plan | View only |
| Student home (mobile) | ✅ Plan | Carousel + equipment grid |
| Student borrow (mobile) | ✅ Plan | Multi-step, unified flow |
| Student requests (mobile) | ✅ Plan | Real-time list + timeline |
| Student return (mobile) | ✅ Plan | Damage reporting inline |
| Student notifications (mobile) | ✅ Plan | Realtime + push |
| Student profile (mobile) | ✅ Plan | Avatar upload, stats |
| Faculty home (mobile) | 🆕 New | Capstone 2 — first time on mobile |
| Faculty approvals (mobile) | 🆕 New | Capstone 2 — first time on mobile |
| Faculty borrow (mobile) | 🆕 New | Capstone 2 — first time on mobile |
| Faculty schedule (mobile) | 🆕 New | Capstone 2 — first time on mobile |
| Faculty notifications (mobile) | 🆕 New | Capstone 2 — first time on mobile |
| Faculty profile (mobile) | 🆕 New | Capstone 2 — first time on mobile |
| Push notifications | 🆕 New | Not in current system |
| QR codes | 🆕 New | Not in current system |
| Student web portal | ❌ Removed | Replaced by mobile app |
| Registration page | ❌ Removed | Admin-managed user creation |
| Firebase debug page | ❌ Removed | Not needed |
| Skeleton includes | ❌ Removed | Built into components |
