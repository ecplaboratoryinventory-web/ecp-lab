# ECP Lab — Cloud Migration Plan

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         VERCEL                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              Next.js App (Web + PWA)                   │     │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │     │
│  │  │  Admin Pages │  │ Faculty Pages│  │  API Routes  │  │     │
│  │  │  (Web only)  │  │  (Web/Mobile)│  │  (Backend)   │  │     │
│  │  └─────────────┘  └──────────────┘  └──────┬───────┘  │     │
│  └──────────────────────────────────────────────┼──────────┘     │
│                                                  │               │
└──────────────────────────────────────────────────┼───────────────┘
                                                   │
┌──────────────────────────────────────────────────┼───────────────┐
│                    EXPO APP                       │              │
│  ┌─────────────────────────────────────────┐    │              │
│  │   React Native (Expo)                   │    │              │
│  │  ┌───────────┐ ┌──────────┐ ┌────────┐ │    │              │
│  │  │ Student   │ │ Faculty  │ │ Shared │ │    │              │
│  │  │ Screens   │ │ Screens  │ │ Auth   │ │    │              │
│  │  └───────────┘ └──────────┘ └────────┘ │    │              │
│  └─────────────────────────────────────────┘    │              │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
                                                   ▼
┌──────────────────────────────────────────────────────────────┐
│                        SUPABASE                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │PostgreSQL│  │   Auth   │  │ Storage  │  │ Realtime     │ │
│  │  (All    │  │ (Unified │  │(Images,  │  │ (Live borrow │ │
│  │  data)   │  │  login)  │  │  uploads)│  │  updates)    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                        CLOUDINARY                             │
│                  (Profile pics, equipment images)              │
└──────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Tech |
|---|---|
| **Web Hosting** | Vercel (Hobby — free) |
| **Web Framework** | Next.js 14+ (App Router) |
| **Mobile App** | Expo (React Native) — compiled to Android APK |
| **Database** | Supabase PostgreSQL (free tier: 500 MB) |
| **Auth** | Supabase Auth (email/password) + Google SMTP |
| **File Storage** | Cloudinary (free tier: 25 GB) |
| **UI (Web)** | Tailwind CSS + shadcn/ui |
| **UI (Mobile)** | React Native Paper or NativeWind |
| **Forms** | React Hook Form + Zod |
| **API Layer** | Next.js API Routes + Supabase SDK (shared by web + mobile) |
| **Notifications** | Supabase Realtime + Expo Push Notifications (Android) |
| **PDF/Reports** | jsPDF or react-pdf |

## Domain

- Free `ecp-lab.vercel.app` domain (no custom domain)

## Email Service

- Google SMTP via Gmail App Password from `ecplaboratoryinventory@gmail.com`
- Used for: password resets, invite emails, notification emails

## Mobile Platform

- Android only (no macOS for iOS builds)
- APK compiled via EAS Build
- Side-loadable APK shared with students

## Capstone 2 Features (Included)

- Announcements module (admin creates, all users read)
- Faculty mobile app (same Expo codebase, separate routing)
- Push notifications for borrow status changes

## Data Sources to Migrate

| Source | Contents |
|---|---|
| Firebase RTDB `ecp-laboratory-63112` | `students/`, `equipment/`, `categories/`, `subcategories/`, `borrow_requests/`, `faculty_borrow/`, `damage_reports/`, `activity_logs/`, `notifications/`, `notificationAdmin/`, `notificationFaculty/` |
| MySQL `lab_inventory_db` | `users`, `account`, `alerts`, `categories`, `equipment`, `equipment_usage`, `maintenance` |

## Database Schema (Supabase PostgreSQL)

### Table: `users`

Unified table for admin, staff, faculty, and student accounts.

| Column | Type | Source | Notes |
|---|---|---|---|
| `id` | UUID PK | Supabase Auth | Auto-generated on signup |
| `email` | TEXT UNIQUE | Firebase `students.email` / MySQL `users.email` | Used for login |
| `role` | TEXT | Computed on import | `admin` / `staff` / `faculty` / `student` |
| `full_name` | TEXT | MySQL `users.full_name` / Firebase `firstname` + `lastname` | |
| `firstname` | TEXT | Firebase `students.firstname` / MySQL `account.firstname` | |
| `lastname` | TEXT | Firebase `students.lastname` / MySQL `account.lastname` | |
| `middlename` | TEXT | Firebase `students.middlename` / MySQL `account.middlename` | |
| `id_no` | TEXT UNIQUE | Firebase `students.student_number` / MySQL `account.id_no` | Student number or employee/ID number |
| `department` | TEXT | MySQL `account.department` / null for students | `Engineering` / `Science` / etc. |
| `course` | TEXT | Firebase `students.course` | Student only |
| `section` | TEXT | Firebase `students.section` | Student only |
| `profile_picture_url` | TEXT | Cloudinary | Uploaded later |
| `status` | TEXT | MySQL `account.status` / Firebase (always active) | `active` / `inactive` |
| `approved` | BOOLEAN | MySQL `account.status` | `true` = approved |
| `approved_at` | TIMESTAMPTZ | MySQL `account.approved_at` | |
| `approved_by` | UUID | MySQL `account.approved_by` | FK to `users.id` |
| `created_at` | TIMESTAMPTZ | Auto | |
| `updated_at` | TIMESTAMPTZ | Auto | |

RLS: Users can read their own record. Admins can read all.

### Table: `categories`

| Column | Type | Source | Notes |
|---|---|---|---|
| `id` | UUID PK | Auto | |
| `name` | TEXT NOT NULL | Firebase `categories` + MySQL `categories` | |
| `description` | TEXT | MySQL | |
| `created_at` | TIMESTAMPTZ | Auto | |

RLS: Public read. Admin write.

### Table: `subcategories`

| Column | Type | Source | Notes |
|---|---|---|---|
| `id` | UUID PK | Auto | |
| `category_id` | UUID FK | Firebase `subcategories.{id}.category` | References `categories.id` |
| `name` | TEXT NOT NULL | Firebase `subcategories.{id}.name` | |
| `created_at` | TIMESTAMPTZ | Auto | |

RLS: Public read. Admin write.

### Table: `equipment`

| Column | Type | Source | Notes |
|---|---|---|---|
| `id` | UUID PK | Auto | |
| `category_id` | UUID FK | Firebase `equipment.{id}.category` / MySQL `equipment.category` | |
| `subcategory_id` | UUID FK | Firebase | Nullable |
| `name` | TEXT NOT NULL | Firebase / MySQL | |
| `description` | TEXT | Firebase / MySQL | |
| `brand` | TEXT | Firebase `equipment.{id}.brand` / MySQL | |
| `model` | TEXT | Firebase `equipment.{id}.model` / MySQL | |
| `serial_number` | TEXT UNIQUE | Firebase / MySQL | |
| `quantity` | INTEGER | Firebase `equipment.{id}.quantity` / MySQL | |
| `available_quantity` | INTEGER | Computed | Current available stock |
| `location` | TEXT | MySQL | Physical location in lab |
| `image_url` | TEXT | Firebase `equipment.{id}.image` | Cloudinary URL after migration |
| `status` | TEXT | MySQL `equipment.status` / computed | `available` / `borrowed` / `under_maintenance` |
| `condition` | TEXT | MySQL | `good` / `fair` / `poor` |
| `purchase_date` | DATE | MySQL | |
| `created_at` | TIMESTAMPTZ | Auto | |
| `updated_at` | TIMESTAMPTZ | Auto | |

RLS: Public read. Admin write.

### Table: `borrow_requests`

Unified: student borrows + faculty borrows.

| Column | Type | Source | Notes |
|---|---|---|---|
| `id` | UUID PK | Auto | |
| `user_id` | UUID FK | Firebase `borrow_requests.{id}.userId` / `faculty_borrow.{id}.facultyId` | References `users.id` |
| `request_type` | TEXT | Computed | `student` or `faculty` |
| `status` | TEXT | Firebase | `pending` / `approved` / `denied` / `borrowed` / `returned` / `rejected` |
| `purpose` | TEXT | Firebase `borrow_requests.{id}.purpose` / `faculty_borrow.{id}.purpose` | |
| `class_schedule_id` | UUID FK | Firebase `faculty_borrow.{id}.classScheduleId` | Nullable, faculty only |
| `borrow_date` | DATE | Firebase | |
| `return_date` | DATE | Firebase | Expected return date |
| `actual_return_date` | TIMESTAMPTZ | MySQL `equipment_usage` | When actually returned |
| `approved_by` | UUID FK | Computed | Faculty (for student) or admin (for faculty) |
| `approved_at` | TIMESTAMPTZ | Computed | |
| `denied_reason` | TEXT | Firebase `borrow_requests.{id}.deniedReason` | |
| `notes` | TEXT | Firebase | |
| `created_at` | TIMESTAMPTZ | Auto | |
| `updated_at` | TIMESTAMPTZ | Auto | |

RLS: Users read own. Faculty + admin read all.

### Table: `borrow_items`

Normalized join table for multi-item borrows.

| Column | Type | Source | Notes |
|---|---|---|---|
| `id` | UUID PK | Auto | |
| `borrow_request_id` | UUID FK | | References `borrow_requests.id` |
| `equipment_id` | UUID FK | Firebase `borrow_requests.{id}.items` / `faculty_borrow.{id}.items` | |
| `quantity` | INTEGER | Firebase | Number of units borrowed |
| `returned_quantity` | INTEGER | Default 0 | Track partial returns |
| `condition_on_return` | TEXT | MySQL `equipment_usage` | `good` / `damaged` / `lost` |
| `notes` | TEXT | | |

RLS: Same as parent borrow request.

### Table: `damage_reports`

| Column | Type | Source | Notes |
|---|---|---|---|
| `id` | UUID PK | Auto | |
| `user_id` | UUID FK | Firebase `damage_reports.{id}.userId` / `whoReported` | |
| `equipment_id` | UUID FK | Firebase `damage_reports.{id}.equipmentId` | |
| `borrow_request_id` | UUID FK | Firebase | Nullable, linked if reported during return |
| `description` | TEXT | Firebase `damage_reports.{id}.description` | |
| `severity` | TEXT | Firebase | `minor` / `major` / `critical` |
| `status` | TEXT | Firebase | `pending` / `resolved` / `dismissed` |
| `resolved_by` | UUID FK | | Admin who resolved |
| `resolution_notes` | TEXT | | |
| `image_urls` | TEXT[] | Firebase | Array of image URLs |
| `created_at` | TIMESTAMPTZ | Auto | |
| `updated_at` | TIMESTAMPTZ | Auto | |

RLS: Users create own. Admin read all.

### Table: `notifications`

Unified: from `notifications/`, `notificationAdmin/`, `notificationFaculty/` in Firebase.

| Column | Type | Source | Notes |
|---|---|---|---|
| `id` | UUID PK | Auto | |
| `user_id` | UUID FK | Computed | Target recipient (nullable for role-wide) |
| `role` | TEXT | Computed | `admin` / `faculty` / `student` — for role-wide notifications |
| `title` | TEXT | Firebase | |
| `message` | TEXT | Firebase | |
| `type` | TEXT | Firebase | `borrow_status` / `damage_report` / `system` / `announcement` |
| `reference_type` | TEXT | | `borrow_request` / `damage_report` / `announcement` |
| `reference_id` | UUID | | Link to relevant entity |
| `is_read` | BOOLEAN | Default false | |
| `created_at` | TIMESTAMPTZ | Auto | |

RLS: Users read own.

### Table: `activity_logs`

| Column | Type | Source | Notes |
|---|---|---|---|
| `id` | UUID PK | Auto | |
| `user_id` | UUID FK | Firebase / MySQL | Who performed the action |
| `action` | TEXT | Firebase / MySQL | `login` / `borrow` / `return` / `approve` / `deny` / `create_equipment` / etc. |
| `entity_type` | TEXT | | `equipment` / `borrow_request` / `user` / `category` |
| `entity_id` | UUID | | FK to affected entity |
| `details` | JSONB | Firebase / MySQL | Extra context |
| `ip_address` | TEXT | | |
| `created_at` | TIMESTAMPTZ | Auto | |

RLS: Admin only.

### Table: `class_schedules`

From Firebase `faculty_borrow` context and Capstone 2 requirement.

| Column | Type | Source | Notes |
|---|---|---|---|
| `id` | UUID PK | Auto | |
| `faculty_id` | UUID FK | | References `users.id` with role=faculty |
| `subject` | TEXT | | |
| `section` | TEXT | | |
| `day_of_week` | TEXT | | `Monday` / `Tuesday` / etc. |
| `start_time` | TIME | | |
| `end_time` | TIME | | |
| `room` | TEXT | | |
| `semester` | TEXT | | |
| `school_year` | TEXT | | |
| `created_at` | TIMESTAMPTZ | Auto | |

RLS: Faculty read own. Admin read all.

### Table: `announcements`

Capstone 2 new feature.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto |
| `title` | TEXT | |
| `content` | TEXT | Rich text or markdown |
| `author_id` | UUID FK | References `users.id` (admin) |
| `target_role` | TEXT | `all` / `student` / `faculty` / `admin` |
| `priority` | TEXT | `normal` / `high` / `urgent` |
| `is_active` | BOOLEAN | Default true |
| `published_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto |

RLS: Public read. Admin write.

### Table: `alerts`

Migrated from MySQL `lab_inventory_db.alerts`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto |
| `title` | TEXT | |
| `message` | TEXT | |
| `type` | TEXT | `info` / `warning` / `critical` |
| `is_active` | BOOLEAN | |
| `created_by` | UUID FK | |
| `created_at` | TIMESTAMPTZ | Auto |

RLS: Admin only.

### Table: `maintenance`

Migrated from MySQL `lab_inventory_db.maintenance`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto |
| `equipment_id` | UUID FK | |
| `description` | TEXT | |
| `scheduled_date` | DATE | |
| `completed_date` | DATE | Nullable |
| `status` | TEXT | `scheduled` / `in_progress` / `completed` |
| `notes` | TEXT | |
| `created_by` | UUID FK | |
| `created_at` | TIMESTAMPTZ | Auto |

RLS: Admin only.

---

## Phase 1 — Foundations

### 1.1 Supabase Project Set Up

- Create a Supabase project on the free tier
- Enable Auth provider: Email/Password only
- Configure custom SMTP using Gmail App Password from `ecplaboratoryinventory@gmail.com`
- Go to Gmail account security settings → Generate App Password
- Enter App Password into Supabase Auth SMTP settings
- Enable Storage bucket called `temp-uploads` (public, temporary uploads before Cloudinary)
- Enable Realtime on the `notifications` and `borrow_requests` tables

### 1.2 GitHub Repository

- User creates a GitHub repository named `ecp-lab` (or similar)
- User invites the AI/assistant to collaborate (or grants access)
- Repository initialized with `README.md` and `.gitignore`

### 1.3 Vercel Project

- Connect Vercel (Hobby Plan — free) to the GitHub repository
- Domain configured as `ecp-lab.vercel.app`
- Environment variables set up in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

### 1.4 Project Scaffolding (Monorepo)

```
ecp-lab/
├── web/                          # Next.js 14 (App Router)
│   ├── app/
│   │   ├── (admin)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── equipment/
│   │   │   ├── categories/
│   │   │   ├── borrow-requests/
│   │   │   ├── students/
│   │   │   ├── faculty/
│   │   │   ├── damage-reports/
│   │   │   ├── activity-logs/
│   │   │   ├── maintenance/
│   │   │   ├── announcements/
│   │   │   └── settings/
│   │   ├── (faculty)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── borrow/
│   │   │   ├── approvals/
│   │   │   ├── schedule/
│   │   │   └── history/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── callback/
│   │   │   └── reset-password/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── borrows/
│   │   │   ├── equipment/
│   │   │   ├── notifications/
│   │   │   ├── cloudinary/
│   │   │   ├── announcements/
│   │   │   └── reports/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── shared/
│   │   └── ...
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── admin.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   ├── middleware.ts
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── mobile/                        # Expo (React Native)
│   ├── app/                       # Expo Router (file-based navigation)
│   │   ├── (auth)/
│   │   │   ├── login.tsx
│   │   │   └── _layout.tsx
│   │   ├── (student)/
│   │   │   ├── (tabs)/
│   │   │   │   ├── home.tsx
│   │   │   │   ├── requests.tsx
│   │   │   │   ├── notifications.tsx
│   │   │   │   └── profile.tsx
│   │   │   ├── borrow.tsx
│   │   │   ├── return.tsx
│   │   │   ├── request/[id].tsx
│   │   │   └── _layout.tsx
│   │   ├── (faculty)/
│   │   │   ├── (tabs)/
│   │   │   │   ├── home.tsx
│   │   │   │   ├── approvals.tsx
│   │   │   │   ├── notifications.tsx
│   │   │   │   └── profile.tsx
│   │   │   ├── borrow.tsx
│   │   │   ├── schedule.tsx
│   │   │   └── _layout.tsx
│   │   └── _layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   └── shared/
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── notifications.ts
│   │   └── api.ts
│   ├── app.json
│   ├── eas.json
│   ├── tsconfig.json
│   └── package.json
├── scripts/
│   ├── migrate-data.mjs           # Main migration script
│   ├── generate-types.mjs         # Generate Supabase types
│   └── seed-demo.mjs              # Seed demo data after migration
├── database/
│   ├── schema.sql                 # Full DDL for all tables
│   ├── rls-policies.sql           # All RLS policies
│   └── seed-data.sql              # Initial seed data
├── docs/
│   ├── architecture.md
│   └── api.md
├── .gitignore
├── .env.example
├── package.json                   # Workspace root
├── turbo.json                     # Turborepo config (optional)
└── README.md
```

---

## Phase 2 — Database Schema & Migration

### 2.1 Apply Schema to Supabase

- Run `database/schema.sql` against Supabase PostgreSQL (all CREATE TABLE statements)
- Run `database/rls-policies.sql` to enable Row Level Security on every table

### 2.2 Migration Script: `scripts/migrate-data.mjs`

A Node.js script that performs the following steps in order:

**Step 1: Read Firebase JSON Export**
- Parse `ecp-laboratory-63112-default-rtdb-export.json`
- Extract all 11 top-level nodes:
  - `students` — student account records
  - `equipment` — equipment inventory
  - `categories` — equipment categories
  - `subcategories` — subcategories linked to categories
  - `borrow_requests` — student borrow requests
  - `faculty_borrow` — faculty borrow requests
  - `damage_reports` — damage incident reports
  - `activity_logs` — system action logs
  - `notifications` — student notifications
  - `notificationAdmin` — admin notifications
  - `notificationFaculty` — faculty notifications

**Step 2: Connect to MySQL**
- Connect to local MySQL `lab_inventory_db` via `mysql2`
- Extract all data from tables:
  - `users` — admin/staff accounts
  - `account` — faculty accounts with approval status
  - `alerts` — system alerts
  - `categories` — categories (may overlap with Firebase)
  - `equipment` — equipment records (may overlap with Firebase)
  - `equipment_usage` — usage/return records
  - `maintenance` — maintenance schedule records

**Step 3: Connect to Supabase**
- Use `@supabase/supabase-js` with service role key for admin access
- Batch insert with proper ordering

**Step 4: Create Users (with Supabase Auth)**

For each student from Firebase `students`:
- Generate a placeholder email if no email exists: `student_<student_number>@ecp-lab.edu`
- Call `supabase.auth.admin.createUser()` with email + password
- If password is stored in Firebase (`students.{id}.password`), use that; otherwise generate a random default
- Insert into `users` table with `role = 'student'`
- Map all fields: `firstname`, `lastname`, `middlename`, `course`, `section`
- Set `id_no` = Firebase `student_number`

For each user from MySQL `users`:
- Call `supabase.auth.admin.createUser()` with email + password
- Insert into `users` table with existing `role` value
- Map `full_name`, `email`, `role`, `status`

For each account from MySQL `account`:
- Call `supabase.auth.admin.createUser()` with email + password
- Insert into `users` table with `role = 'faculty'`
- Map all fields: `firstname`, `lastname`, `middlename`, `id_no`, `department`
- Map `status` and approval fields

**Step 5: Migrate Categories**
- Deduplicate categories from Firebase + MySQL by name
- Insert unique categories into `categories` table
- Build a mapping from old Firebase category IDs / MySQL category names → new Supabase UUIDs

**Step 6: Migrate Subcategories**
- For each subcategory in Firebase `subcategories/`:
  - Map `category` field to new Supabase category UUID
  - Insert into `subcategories` table
  - Build mapping for equipment references

**Step 7: Migrate Equipment**
- Deduplicate equipment by `serial_number` from Firebase + MySQL
- For each equipment record:
  - Map `category` to new Supabase category UUID
  - Map `subcategory` to new Supabase subcategory UUID (if applicable)
  - Determine status: if `quantity` > 0 and no active borrow, set `available`; else `borrowed`
  - Insert into `equipment` table
  - Build mapping from old Firebase equipment IDs / MySQL equipment IDs → new Supabase UUIDs

**Step 8: Migrate Borrow Requests (Student)**
- For each borrow request in Firebase `borrow_requests/`:
  - Map `userId` to new Supabase user UUID
  - Map `status` and all fields
  - Insert into `borrow_requests` with `request_type = 'student'`
  - For each item in `items` array:
    - Map `equipmentId` to new Supabase equipment UUID
    - Insert into `borrow_items` with quantity
  - Map any linked notifications

**Step 9: Migrate Borrow Requests (Faculty)**
- For each borrow request in Firebase `faculty_borrow/`:
  - Map `facultyId` to new Supabase user UUID
  - Insert into `borrow_requests` with `request_type = 'faculty'`
  - For each item, insert into `borrow_items`
  - Create class schedule entries if not already existing

**Step 10: Migrate Damage Reports**
- For each damage report in Firebase `damage_reports/`:
  - Map `userId` or `whoReported` to Supabase user UUID
  - Map `equipmentId` to Supabase equipment UUID
  - Map `borrowRequestId` if present
  - Insert into `damage_reports` table

**Step 11: Migrate Notifications**
- For each notification in Firebase `notifications/`:
  - Map user reference
  - Insert into `notifications` table with appropriate type
- For each notification in `notificationAdmin/`:
  - Insert with `role = 'admin'`
- For each notification in `notificationFaculty/`:
  - Insert with `role = 'faculty'`

**Step 12: Migrate Activity Logs**
- From Firebase `activity_logs/`:
  - Map `user_id` to new UUIDs
  - Insert into `activity_logs` with all fields
- From MySQL `equipment_usage`:
  - Create activity log entries for each return

**Step 13: Migrate Alerts and Maintenance**
- From MySQL `alerts` + `maintenance`:
  - Insert directly with UUID generation
  - Map any equipment references to new UUIDs

**Step 14: Verify**
- Run validation queries:
  - Count rows per table vs source
  - Check for orphaned foreign keys
  - Verify auth users match `users` table count

---

## Phase 3 — Next.js Web App (Admin + Faculty)

### 3.1 Setup Commands

```bash
npx create-next-app@latest web --typescript --tailwind --app --src-dir
cd web
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card table dialog form input select badge sidebar
npm install @supabase/ssr @supabase/supabase-js react-hook-form zod @hookform/resolvers lucide-react recharts
npm install cloudinary @cloudinary/url-gen @cloudinary/react (or upload widget)
```

### 3.2 Auth Implementation

**`web/lib/supabase/client.ts`** — Browser client
- Create Supabase client with `createBrowserClient` from `@supabase/ssr`
- Export for use in client components

**`web/lib/supabase/server.ts`** — Server client
- Create Supabase client with `createServerClient` from `@supabase/ssr`
- Read cookies from request

**`web/lib/supabase/admin.ts`** — Admin client
- Create Supabase client with service role key
- Only used in server-side API routes (never exposed to client)

**`web/middleware.ts`** — Auth middleware
- Check session on every request
- Redirect unauthenticated users to `/auth/login`
- Redirect authenticated users based on role:
  - `admin` → `/admin/dashboard`
  - `staff` → `/admin/dashboard` (with limited sidebar)
  - `faculty` → `/faculty/dashboard`
  - `student` → redirect to download APK page
- Public routes: `/auth/login`, `/auth/callback`, `/auth/reset-password`, `/`

**`web/app/auth/login/page.tsx`** — Login page
- Server component with form action
- Email + password form with Zod validation
- Error display for invalid credentials
- Link to password reset
- After login, redirect based on role

**`web/app/auth/callback/route.ts`** — Auth callback
- Handle OAuth/email confirmation redirects
- Exchange code for session
- Redirect to role-based dashboard

**`web/app/auth/reset-password/page.tsx`** — Password reset
- Email input form
- Calls Supabase Auth reset password with redirect URL
- Success message with instructions to check email

### 3.3 Admin Layout

**`web/app/(admin)/layout.tsx`** — Admin shell
- Sidebar navigation with shadcn/ui sidebar component
- Header with user avatar, name, role badge, logout button
- Responsive: sidebar collapses on mobile
- Navigation items:
  - Dashboard
  - Equipment
  - Categories
  - Borrow Requests
  - Students
  - Faculty
  - Damage Reports
  - Activity Logs
  - Maintenance
  - Announcements (Capstone 2)
  - Settings

### 3.4 Admin Pages

#### `/admin/dashboard`
- Stat cards (4 columns): total equipment count, active borrows, pending approvals count, active alerts count
- Recent activity feed (last 10 activity logs)
- Borrow requests chart (last 30 days — bar chart using recharts)
- Equipment status pie chart (available vs borrowed vs under maintenance)
- Recent notifications widget

#### `/admin/equipment`
- Data table with server-side pagination and search
- Columns: image, name, serial number, category, quantity, available, status, location, actions
- Filters: category dropdown, status dropdown, search by name/serial
- Create equipment: modal form with fields (name, description, brand, model, serial_number, quantity, category, subcategory, location, image upload via Cloudinary widget, condition, purchase_date)
- Edit equipment: same form pre-filled
- Delete equipment: confirmation dialog (only if no active borrows)
- QR code generation: download QR label for each equipment

#### `/admin/categories`
- Two-panel layout: categories list on left, subcategories on right
- Create/edit/delete categories
- Create/edit/delete subcategories (linked to parent category)
- Drag-and-drop reordering (optional)

#### `/admin/borrow-requests`
- Data table with all borrow requests (student + faculty)
- Filters: status dropdown, type (student/faculty), date range, search by requester name
- Columns: requester, type, items, date, status, actions
- Approve: opens confirm dialog (sets approved_by, approved_at, changes status to `approved`)
- Deny: opens dialog requiring reason (changes status to `denied`, sets denied_reason)
- Mark as borrowed: after physical pickup (status → `borrowed`)
- Mark as returned: opens return dialog with condition check per item (status → `returned`)
- Detail view: modal with full request info, items list, status timeline, notes

#### `/admin/students`
- Data table of all student users
- Columns: student number, full name, course, section, email, status, actions
- Create student: form to add new student (name, student number, course, section, email, password)
- Edit student: update info
- Approve/reject: toggle status
- Reset password: generate reset link
- Delete: remove student (with confirmation)

#### `/admin/faculty`
- Same layout and functionality as students but for faculty accounts
- Additional columns: department, id_no
- Additional fields in form: department, employee ID

#### `/admin/damage-reports`
- Data table of all damage reports
- Columns: reporter, equipment, severity, status, date, actions
- Filters: severity, status, date range
- View detail: modal with full description and images
- Resolve: mark as resolved with resolution notes
- Dismiss: mark as dismissed with reason

#### `/admin/activity-logs`
- Read-only data table
- Columns: timestamp, user, action, entity type, details
- Filters: user, action type, date range, entity type
- No edit/delete — append-only audit trail

#### `/admin/maintenance`
- Data table of maintenance records
- Columns: equipment, description, scheduled date, status, actions
- Create: equipment selector, description, scheduled date, notes
- Edit: update details
- Mark completed: set completed_date and status
- Calendar view: optional month view of scheduled maintenance

#### `/admin/announcements` (Capstone 2)
- List of announcements with publish status
- Create: title, content (rich text), target role, priority, publish now or schedule
- Edit: modify existing
- Toggle active/inactive
- Archive: soft delete

#### `/admin/settings`
- System name, logo upload
- Borrow duration limits (default days allowed)
- Email notification toggle per event type
- Maintenance mode toggle

### 3.5 Faculty Layout

**`web/app/(faculty)/layout.tsx`** — Faculty web shell
- Top navigation bar (not sidebar — faculty web is simpler)
- Links: Dashboard, Borrow, Approvals, Schedule, History
- User info + logout in header

### 3.6 Faculty Pages

#### `/faculty/dashboard`
- Cards: my active borrows count, pending approval requests count, upcoming classes today
- Quick actions: Borrow Equipment, Approve Requests
- Recent notifications feed
- My current borrows list (compact table)

#### `/faculty/borrow`
- Multi-step borrow form:
  - Step 1: Select equipment (search + category filter, show available quantity)
  - Step 2: Set quantity per item
  - Step 3: Select purpose, borrow date, expected return date
  - Step 4: Confirm and submit
- Auto-approved (status = `approved` immediately for faculty)
- Notification sent to admin

#### `/faculty/approvals`
- Data table of student borrow requests pending faculty approval
- Columns: student name, items, date, purpose, actions
- Approve: single click (sets approved_by = current faculty, status → `approved`)
- Deny: opens reason dialog
- View student info: tooltip or expandable row

#### `/faculty/schedule` (Capstone 2)
- View class schedule (read-only for now, admin manages)
- Weekly calendar view or list view
- Shows: subject, section, time, room
- Print schedule option

#### `/faculty/history`
- Data table of past borrow requests
- Filter by status, date range
- Columns: request ID, items, date borrowed, date returned, status
- Detail view: modal with full info

---

## Phase 4 — Expo Mobile App (Student + Faculty)

### 4.1 Setup Commands

```bash
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
npx expo install expo-router expo-secure-store expo-notifications expo-constants
npx expo install @supabase/supabase-js @react-navigation/native react-native-paper
npx expo install react-native-safe-area-context react-native-screens
npx expo install expo-linking expo-status-bar
```

**`mobile/eas.json`** — EAS Build config
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

### 4.2 Auth Implementation

**`mobile/lib/supabase.ts`** — Supabase client
- Initialize with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Use `@supabase/supabase-js` directly (no SSR needed in standalone app)
- Session persistence via `expo-secure-store`

**`mobile/app/(auth)/login.tsx`** — Login screen
- Email + password input fields
- Login button (calls `supabase.auth.signInWithPassword()`)
- Loading state during authentication
- Error display for invalid credentials
- "Forgot password?" link (opens browser to web reset page)
- After successful login, redirect based on user role:
  - `student` → `/(student)/(tabs)/home`
  - `faculty` → `/(faculty)/(tabs)/home`

**`mobile/app/(auth)/_layout.tsx`** — Auth layout
- Stack navigator with login screen
- Redirect to role-based tabs if already authenticated

### 4.3 Shared Components

**`mobile/components/shared/AuthGuard.tsx`** — Route protection
- Check if session exists on mount
- Redirect to login if not authenticated

**`mobile/components/shared/EquipmentCard.tsx`** — Equipment display card
- Image, name, category, availability indicator
- Used in home screen and search results

**`mobile/components/shared/StatusBadge.tsx`** — Status badge component
- Color-coded: pending (yellow), approved (green), denied (red), borrowed (blue), returned (gray)

**`mobile/components/shared/LoadingScreen.tsx`** — Full-screen loading spinner

**`mobile/lib/api.ts`** — Shared API helpers
- Functions to call Next.js API routes
- Include Supabase session token in Authorization header

**`mobile/lib/notifications.ts`** — Notification helpers
- Register for push notifications
- Subscribe to Supabase Realtime channel
- Handle incoming notification display

### 4.4 Student Screens

#### `/(student)/(tabs)/home.tsx` — Student Home
- Horizontal scrollable carousel of equipment categories at top (with icons)
- Search bar with debounced filter
- Equipment grid/list: cards showing image, name, availability status
- Category filter chips
- Pull-to-refresh
- Floating scan button (QR scanner — future enhancement)
- Realtime updates: equipment availability updates live via Supabase Realtime

#### `/(student)/borrow.tsx` — Borrow Equipment (FAB target)
- Multi-step form:
  - Step 1: Equipment selection
    - Search + category filter
    - Tap equipment card → shows quantity stepper (up to available stock)
    - Selected items appear as chips at bottom
  - Step 2: Purpose & dates
    - Purpose text input (required)
    - Borrow date picker (default today)
    - Expected return date picker
    - Notes (optional)
  - Step 3: Review & submit
    - Summary of items, dates, purpose
    - Submit button → creates `borrow_request` via Supabase insert
    - On success: navigate to requests tab with success toast
- Validation: at least 1 item, purpose required, return date >= borrow date

#### `/(student)/(tabs)/requests.tsx` — My Requests
- List of user's borrow requests
- Each item shows: request date, items summary, status badge
- Tap → navigates to `/(student)/request/[id]`
- Pull-to-refresh
- Realtime updates: status changes appear live

#### `/(student)/request/[id].tsx` — Request Detail
- Full request info: items list with quantities, dates, purpose
- Status timeline (visual stepper): Pending → Approved → Borrowed → Returned
- Action buttons based on status:
  - `approved`: "Return Items" button → navigate to return flow
  - `denied`: show denied reason
  - `borrowed`: "Return Items" button
  - `returned`: show actual return date
  - `pending`: show estimated approval time
- Cancel button (only if status = `pending`)
- Contact admin button (opens email or in-app chat)

#### `/(student)/return.tsx` — Return Equipment
- Select from active borrowed items (status = `borrowed` or `approved`)
- For each item:
  - Checkbox: return condition (`good` / `damaged` / `lost`)
  - If `damaged`: damage description + optional photo (via camera or gallery)
  - Quantity being returned (support partial returns)
- Submit return:
  - Update `borrow_items.returned_quantity` and `condition_on_return`
  - If all items returned, set `borrow_request.status` = `returned`, `actual_return_date` = now
  - If damage reported, create `damage_report` record
  - Trigger notification to admin

#### `/(student)/(tabs)/notifications.tsx` — Notifications
- List of notifications sorted by date (newest first)
- Each item: icon (based on type), title, message preview, timestamp
- Unread items have a dot indicator
- Tap → navigate to related entity if applicable (e.g., borrow request detail)
- "Mark all as read" button
- Pull-to-refresh
- Realtime subscription: new notifications appear live

#### `/(student)/(tabs)/profile.tsx` — Profile
- Profile picture (with change option — upload to Cloudinary)
- User info: name, student number, course, section, email
- Edit profile: change name/email (with verification)
- Change password (calls Supabase Auth update)
- App version
- Logout button (clears session, redirects to login)
- Delete account option (with confirmation)

### 4.5 Faculty Screens

#### `/(faculty)/(tabs)/home.tsx` — Faculty Dashboard
- Cards: active borrows count today, pending approvals count, upcoming class count today
- Quick action buttons: Borrow Equipment, Approve Requests
- Today's schedule preview (if any classes today — from `class_schedules`)
- Recent notifications
- Realtime updates

#### `/(faculty)/borrow.tsx` — Faculty Borrow
- Same multi-step flow as student borrow but:
  - Auto-approved on submit
  - Additional field: link to class schedule (optional)
  - Different purpose label: "Instruction / Demonstration"
- Submit → creates `borrow_request` with `request_type = 'faculty'` and `status = 'approved'`
- Notification sent to admin

#### `/(faculty)/(tabs)/approvals.tsx` — Approve Student Requests
- List of pending student borrow requests (limit: faculty's department?)
- Each item: student name and photo (if available), items, date, purpose
- Approve: swipe right or tap approve button
- Deny: tap deny → reason dialog
- View detail: expanded card with full request info
- Pull-to-refresh
- Realtime updates: new pending requests appear live

#### `/(faculty)/schedule.tsx` — Class Schedule (Capstone 2)
- Weekly calendar view (Monday–Friday)
- Each day shows class blocks: subject, time, room, section
- Tap a class → see details + "Borrow equipment for this class" quick action
- No edit capability (admin manages schedules)
- Swipe to change weeks

#### `/(faculty)/(tabs)/notifications.tsx` — Faculty Notifications
- Same as student notifications screen
- Notification types: borrow status, damage report, new approval request, announcement

#### `/(faculty)/(tabs)/profile.tsx` — Faculty Profile
- Same as student profile but with department, employee ID
- Edit schedule visibility preferences (optional)

### 4.6 Root Layout

**`mobile/app/_layout.tsx`** — Root layout
- Initial route check: if authenticated → redirect by role, else → login
- Wrap with Supabase session provider
- Configure push notification handler
- Set up status bar

---

## Phase 5 — Notifications (Capstone 2)

### 5.1 In-App Notifications

**Trigger events:**
- Borrow request submitted → notification to faculty + admin (`type: new_request`)
- Borrow request approved → notification to student (`type: borrow_status`)
- Borrow request denied → notification to student (`type: borrow_status`, includes reason)
- Items borrowed (picked up) → notification to student (`type: borrow_status`)
- Items returned → notification to admin (`type: return_complete`)
- Damage reported → notification to admin (`type: damage_report`)
- Damage resolved → notification to student/faculty (`type: damage_resolved`)
- Announcement published → notification to target role (`type: announcement`)

**Implementation:**
- Next.js API route `/api/notifications/send`:
  - Called after every state change (borrow approve/deny/return, etc.)
  - Inserts record into `notifications` table
  - Broadcasts via Supabase Realtime
- Mobile app subscribes to Realtime channel:
  - `supabase.channel('notifications').on('postgres_changes', ...)`
  - Filter by `user_id` or `role`
  - On receive: show in-app banner, update notification list, update badge count

### 5.2 Push Notifications

**Flow:**
1. Mobile app registers for push on first launch:
   - `expo-notifications` → gets Expo Push Token
   - Sends token to Supabase or Next.js API to store against user
2. A Supabase Edge Function or Next.js API route sends push:
   - When a notification is created for a mobile user
   - Calls Expo Push API: `https://exp.host/--/api/v2/push/send`
   - Includes title, body, data (reference_type + reference_id for deep linking)
3. Mobile app handles incoming push:
   - If app is foregrounded: show in-app notification
   - If app is backgrounded: OS notification banner
   - On tap: deep link to the relevant screen (borrow request detail, etc.)

**Implementation details:**
- Store push tokens in `users.push_token` column (add to schema)
- Expo Push API is free, no rate limit concerns at this scale
- Fallback: if push fails (token expired), silently ignore — in-app notification still shows on next app open

### 5.3 Notification Preferences (Settings)

- Each user can toggle push notification types:
  - Borrow status changes (default: on)
  - Announcements (default: on)
  - Reminders for overdue returns (default: on)
- Stored in `users.notification_preferences` JSONB column

---

## Phase 6 — Deployment

### 6.1 Web Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from web directory
cd web
vercel --prod
```

**Environment variables to set in Vercel dashboard:**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (secret — server only) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (server only) |
| `EXPO_PUSH_API_URL` | `https://exp.host/--/api/v2/push/send` |
| `NEXT_PUBLIC_APP_URL` | `https://ecp-lab.vercel.app` |

**Domain:** `https://ecp-lab.vercel.app`

### 6.2 Mobile Deployment (EAS Build)

**EAS setup:**
```bash
cd mobile
npx eas init
npx eas build:configure
```

**Build Android APK:**
```bash
# Preview APK (debug, side-loadable)
npx eas build --platform android --profile preview

# Production AAB (for Google Play Store — optional)
npx eas build --platform android --profile production
```

**Output:**
- Preview build: downloadable `.apk` file (link provided by EAS)
- Students can install directly on their Android phones
- No Play Store listing required for initial rollout

**EAS Update (over-the-air JS updates):**
```bash
npx eas update --branch preview --message "Bug fix: borrow form validation"
```
- Updates JS bundle without rebuilding native app
- Students get update on next app open (no reinstall needed)

### 6.3 Supabase Configuration

**SMTP setup:**
- Provider: Google Gmail
- Email: `ecplaboratoryinventory@gmail.com`
- SMTP Host: `smtp.gmail.com`
- SMTP Port: `587`
- Username: `ecplaboratoryinventory@gmail.com`
- Password: Gmail App Password (generate in Google Account → Security → App Passwords)

**RLS policies applied:** All tables have Row Level Security enabled
**Realtime enabled:** On `notifications`, `borrow_requests`, `equipment` tables
**Storage bucket:** `temp-uploads` — public bucket for temporary uploads (auto-cleanup via Supabase Edge Function or Vercel cron)

### 6.4 Cloudinary Setup

- Create free Cloudinary account
- Configure upload widget in Next.js admin pages:
  - Equipment images
  - Profile pictures
  - Damage report photos
- Store returned Cloudinary URL in database
- Transformations: resize to thumbnail (200x200), medium (800x600) on upload

---

## Timeline Estimate

| Phase | Tasks | Estimated Days |
|---|---|---|
| **1. Foundations** | Supabase project, GitHub repo, Vercel, scaffolding | 1 |
| **2. Database + Migration** | Schema DDL, RLS policies, migration script development, test migration, production migration | 3 |
| **3. Next.js Web** | Auth system, admin: dashboard, equipment CRUD, categories, borrow requests, students, faculty, damage reports, activity logs, maintenance, announcements, settings; Faculty web: dashboard, borrow, approvals, schedule, history | 6 |
| **4. Expo Mobile** | Auth, student: home/borrow/requests/notifications/profile/return; Faculty: home/borrow/approvals/schedule/notifications/profile | 8 |
| **5. Notifications** | In-app notifications, Realtime subscriptions, push notification integration, notification preferences | 2 |
| **6. Polish + Test** | Cross-browser testing, mobile device testing, edge case handling, UI polish, performance optimization | 3 |
| **7. Deploy** | Vercel production deploy, EAS Android APK build, Supabase go-live, migration execution, verification | 1 |
| **Total** | | **~24 days** |

---

## Data Flow Summary

```
Firebase RTDB Export (.json)
        │
        ▼
MySQL Export (lab_inventory_db)
        │
        ▼
scripts/migrate-data.mjs
        │
        ├── Creates Supabase Auth accounts (for all users)
        ├── Transforms + normalizes data
        ├── Deduplicates overlapping records (equipment, categories)
        └── Inserts into Supabase PostgreSQL
              │
              ▼
        Supabase PostgreSQL (single source of truth)
              │
              ├── Next.js Web App (server-side reads/writes via Supabase client)
              └── Expo Mobile App (reads/writes via Next.js API routes or direct Supabase anon key)
```

---

## Environment Variables Reference

### Web (`web/.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
NEXT_PUBLIC_APP_URL=https://ecp-lab.vercel.app
```

### Mobile (`mobile/.env`)

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_API_URL=https://ecp-lab.vercel.app/api
```

---

## Key Design Decisions

1. **Monorepo** — Shared types between web and mobile via workspace package. Turborepo for build caching.

2. **Next.js API Routes as BFF** — Mobile app calls Next.js API routes (not Supabase directly) for write operations. Read operations can use Supabase anon key directly with RLS. This provides:
   - Validation layer before writes
   - Server-side logic for complex operations
   - Webhook triggers for notifications
   - Rate limiting and abuse prevention

3. **Supabase Auth as single source of truth** — All authentication goes through Supabase Auth. No custom password tables. Student passwords from Firebase are imported via `auth.admin.createUser()`.

4. **Cloudinary for images** — Not Supabase Storage. Cloudinary provides:
   - Automatic image optimization and resizing
   - Built-in CDN
   - 25 GB free tier (more generous than Supabase Storage)
   - Upload widget with direct upload from browser

5. **Expo Router (file-based)** — Chosen over React Navigation for simpler structure, deep linking support, and web-like DX.

6. **Faculty borrows auto-approved** — Faculty requests skip the approval queue (same as current system behavior from documentation analysis).

7. **Realtime for notifications only** — Not for live editing. Notifications pushed via Realtime, borrow status updates are polled on screen focus.

8. **No WebSockets for mobile** — Supabase Realtime uses WebSocket under the hood but Expo handles it natively. No additional Socket.io/Pusher dependencies.

---

## Current System State (Before Migration)

### Local Services Running
- Apache/2.4.58 on port 80
- PHP/8.2.12
- MariaDB 10.4.32 on port 3306

### Database: `lab_inventory_db` (MySQL)
- Tables: `users`, `account`, `alerts`, `categories`, `equipment`, `equipment_usage`, `maintenance`
- User: `lemuel` with password `lemuel_0405`, role `admin`

### Existing Mobile App (Android)
- Location: `C:\Users\00lem\Downloads\FINAL CAPSTONE 1-20260602T041836Z-3-001\FINAL CAPSTONE 1\ECP Lab`
- Language: Java
- Framework: Firebase Android SDK
- Target: Students only
- Auth: Firebase Realtime Database (student_number + password)
- Screens: Home, Borrow, Requests, Notifications, Profile
- Connected to same Firebase RTDB project as web app

### Firebase RTDB `ecp-laboratory-63112`
- Data export at: `C:\Users\00lem\Downloads\ecp-laboratory-63112-default-rtdb-export.json`
- 11 data nodes: students, equipment, categories, subcategories, borrow_requests, faculty_borrow, damage_reports, activity_logs, notifications, notificationAdmin, notificationFaculty
- Also serves: PHP web app's student-facing features (login, equipment browsing)

### Web App (PHP — Legacy, To Be Replaced)
- Login types: `login.php` (admin/staff via `users` table), `faculty_login.php` (faculty via `account` table), student login via Firebase
- Admin pages in `admin/` directory: dashboard, equipment CRUD, manage accounts, categories, reports
- Faculty pages: `faculty_dashboard.php`, `faculty_borrow.php`, etc.
- Fixed path: `includes/footer.php:288` changed from `js/custom.js` to `assets/js/custom.js`

---
