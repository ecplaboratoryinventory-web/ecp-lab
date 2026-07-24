# ECP Lab — Capstone 2 Alignment Check

> Against: `reference/revisions.txt` (Panel Revision Notes)  
> Date: July 24, 2026

---

## Revision Requirements vs Current System

| # | Revision Requirement | Status | Notes |
|---|---|---|---|
| 1 | **Equipment tab list format according to category** | ✅ Done | Category filter pills on admin equipment page |
| 2 | **Reports — Generate (Total Item / Damages)** | ✅ Done | Dashboard stats + damage reports page + monthly report API |
| 3 | **Notification — Pop up notify** | 🚧 Partial | In-app notification page exists. Toast/popup system NOT implemented |
| 4 | **Mobile App: Equipment — Have samples, Date borrowed, Date returned, Multiple request** | ❌ Missing | Mobile app scaffolded but screens are placeholders |
| 5 | **Faculty — Damage Report, QTY of damage item** | ✅ Done | Damage reports page with severity + resolve/dismiss + qty tracking in borrow return |
| 6 | **Change terminology: BORROW EQUIP → EQUIPMENT** | ✅ Done | Faculty sidebar says "Equipment" |
| 7 | **Change terminology: STUDENT BORROW → BORROW ITEM** | ✅ Done | Faculty sidebar says "Borrow Item" |
| 8 | **Don't hide unavailable** | 🚧 Partial | Equipment with 0 quantity still shown; need to verify faculty borrow doesn't filter them out |
| 9 | **Auto searching of equipment** | 🚧 Partial | Search exists on equipment page but requires Enter/button; no live debounced search |

---

## Database Alignment

| Capstone Requirement | DB Table | Column | Status |
|---|---|---|---|
| Equipment inventory | `equipment` | All fields | ✅ Complete |
| Equipment by category | `categories` | name, description | ✅ Complete |
| Equipment by department | `equipment` | department | ✅ Added (Engineering/Science) |
| Borrow requests (student + faculty) | `borrow_requests` | All fields | ✅ Complete |
| Multi-item borrows | `borrow_items` | quantity, returned_quantity, condition | ✅ Complete |
| Damage reports | `damage_reports` | severity, status, images | ✅ Complete |
| Notifications | `notifications` | type, reference_id, is_read | ✅ Complete |
| Activity logs | `activity_logs` | action, entity_type, details | ✅ Complete |
| Announcements | `announcements` | priority, target_role, is_active | ✅ Complete |
| Maintenance | `maintenance` | scheduled_date, status | ✅ Complete |
| Class schedules | `class_schedules` | subject, day_of_week, time | ✅ Complete |
| Alerts | `alerts` | type, is_active | ✅ Complete |

---

## What's Missing / Needs Work

### HIGH — Must Fix
1. **Toast/Popup Notifications** — System-wide toast notifications for CRUD actions (equipment added, borrow approved, etc.)
2. **Live Auto-Search** — Debounced search on equipment, students, and faculty pages (search as you type)

### MEDIUM — Should Fix
3. **Show Unavailable Equipment** — Faculty borrow page should show ALL equipment including unavailable (just mark as unavailable)
4. **Mobile App** — Expo screens are placeholders; need student borrow flow, equipment browsing, request tracking
5. **Faculty Damage Report Flow** — Faculty should be able to report damage directly from their dashboard/history

### LOW — Nice to Have
6. **CSV Import Validation** — Better validation messages on CSV import (duplicate detection, invalid rows)
7. **PDF Reports** — Actual PDF generation (currently JSON via API)

---

## Lab Equipment Lists (from reference/)

Could not extract text from .docx files. The files are:
- `Chemistry_Lab_Management_List.docx` — Equipment for Chemistry lab
- `Electronics_Lab_Management_List.docx` — Equipment for Electronics lab  
- `Physics_Lab_Management_List.docx` — Equipment for Physics lab

These should be seeded as sample data categorized by department (Science/Engineering).

---

## Recommended Next Actions

1. Add toast notification system
2. Implement live auto-search on all pages
3. Seed equipment data from the lab management lists
4. Build mobile app screens
5. Faculty damage report flow from dashboard
