const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");
require("dotenv").config({ path: "web/.env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

if (DRY_RUN) {
  console.log("=== DRY RUN MODE — No data will be written ===\n");
}

function dry(msg) {
  if (DRY_RUN) console.log(`  [DRY RUN] ${msg}`);
}

const FIREBASE_EXPORT = "C:\\Users\\00lem\\Downloads\\ecp-laboratory-63112-default-rtdb-export.json";

const studentMap = new Map();
const equipmentMap = new Map();

async function safeInsert(table, data, label) {
  if (DRY_RUN) {
    dry(`INSERT ${table}: ${label}`);
    return { error: null };
  }
  return supabase.from(table).insert(data);
}

function loadFirebaseData() {
  if (!fs.existsSync(FIREBASE_EXPORT)) {
    console.error(`Firebase export not found: ${FIREBASE_EXPORT}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(FIREBASE_EXPORT, "utf8"));
}

async function migrateStudents(data) {
  console.log("\n=== Migrating Firebase Students → Supabase Users ===");
  const students = data.students;
  if (!students) { console.log("  No students node."); return; }

  let count = 0;
  for (const [key, batch] of Object.entries(students)) {
    for (const [, student] of Object.entries(batch || {})) {
      if (!student.email) {
        const name = `${student.firstname || ""}${student.lastname || ""}`.toLowerCase().replace(/\s+/g, "");
        student.email = `${name}@ecp.edu.ph`;
      }
      if (!student.email.includes("@")) continue;

      const { data: existing } = await supabase
        .from("users").select("id").eq("email", student.email).maybeSingle();
      if (existing) {
        studentMap.set(student.student_id || student.student_number, existing.id);
        console.log(`  SKIP ${student.email} (exists)`);
        continue;
      }

      const fullName = `${student.firstname || ""} ${student.middlename ? student.middlename + " " : ""}${student.lastname || ""}`.trim();

      if (DRY_RUN) {
        console.log(`  [DRY] Would create ${student.email}`);
        studentMap.set(student.student_id || student.student_number, "dry-run-id");
        count++;
        continue;
      }

      const { data: authUser, error } = await supabase.auth.admin.createUser({
        email: student.email,
        password: student.password || `${student.lastname || "student"}123`,
        email_confirm: true,
      });

      if (error) {
        console.error(`  FAIL ${student.email}: ${error.message}`);
        continue;
      }

      const { error: insertErr } = await supabase.from("users").insert({
        id: authUser.user.id,
        email: student.email,
        role: "student",
        full_name: fullName,
        firstname: student.firstname || null,
        lastname: student.lastname || null,
        middlename: student.middlename || null,
        id_no: student.student_id || student.student_number || null,
        course: student.course || null,
        status: student.status || "active",
        approved: true,
      });

      if (insertErr) {
        console.error(`  FAIL insert ${student.email}: ${insertErr.message}`);
        continue;
      }

      studentMap.set(student.student_id || student.student_number, authUser.user.id);
      count++;
      console.log(`  OK ${student.email} (${fullName})`);
    }
  }
  console.log(`  Migrated ${count} students`);
}

async function migrateEquipment(data) {
  console.log("\n=== Migrating Firebase Equipment → Supabase Equipment ===");
  const eqData = data.equipment;
  if (!eqData) { console.log("  No equipment node."); return; }

  let count = 0;
  const { data: categories } = await supabase.from("categories").select("id, name");
  const categoryMap = new Map();
  if (categories) categories.forEach((c) => categoryMap.set(c.name.toLowerCase(), c.id));

  for (const [, eq] of Object.entries(eqData)) {
    const name = eq.name || eq.equipment_name;
    if (!name) continue;

    const { data: existing } = await supabase
      .from("equipment").select("id").eq("name", name).maybeSingle();
    if (existing) {
      equipmentMap.set(eq.id || eq.code, existing.id);
      console.log(`  SKIP ${name} (exists)`);
      continue;
    }

    const categoryName = (eq.category_name || eq.category || "").toLowerCase();
    const categoryId = categoryMap.get(categoryName) || null;

    const newId = randomUUID();
    const { error } = await supabase.from("equipment").insert({
      id: newId,
      category_id: categoryId,
      name,
      description: eq.description || null,
      serial_number: eq.code || eq.equipment_code || null,
      quantity: parseInt(eq.quantity) || 1,
      available_quantity: parseInt(eq.available) || parseInt(eq.quantity) || 1,
      status: eq.status || "available",
      condition: "good",
      image_url: eq.imageUrl || null,
    });

    if (error) {
      console.error(`  FAIL ${name}: ${error.message}`);
      continue;
    }

    equipmentMap.set(eq.id || eq.code, newId);
    count++;
    console.log(`  OK ${name}`);
  }
  console.log(`  Migrated ${count} equipment`);
}

async function migrateBorrowRequests(data) {
  console.log("\n=== Migrating Firebase Borrow Requests → Supabase ===");
  const studentBorrows = data.borrow_requests;
  const facultyBorrows = data.faculty_borrow || data.faculty_borrowings;

  let count = 0;

  const allBorrows = [];
  if (studentBorrows) {
    for (const [, req] of Object.entries(studentBorrows)) {
      allBorrows.push({ ...req, _type: "student" });
    }
  }
  if (facultyBorrows) {
    for (const [, req] of Object.entries(facultyBorrows)) {
      allBorrows.push({ ...req, _type: "faculty" });
    }
  }

  for (const req of allBorrows) {
    const studentId = req.studentNumber || req.student_number || req.student_id;
    const userId = studentMap.get(studentId);
    if (!userId && req._type === "student") {
      console.log(`  SKIP borrow: unknown student ${studentId}`);
      continue;
    }

    const eqId = equipmentMap.get(req.equipmentId || req.equipment_id);
    const newId = randomUUID();
    const status = req.status || "pending";

    const { error } = await supabase.from("borrow_requests").insert({
      id: newId,
      user_id: userId || null,
      request_type: req._type,
      status,
      purpose: req.purpose || null,
      notes: req.notes || null,
      borrow_date: req.borrowDate || req.borrowed_date || null,
      return_date: req.returnDate || req.expected_return_date || null,
      created_at: req.createdAt || req.created_at || new Date().toISOString(),
    });

    if (error) {
      console.error(`  FAIL borrow: ${error.message}`);
      continue;
    }

    if (eqId) {
      await supabase.from("borrow_items").insert({
        borrow_request_id: newId,
        equipment_id: eqId,
        quantity: parseInt(req.quantity) || 1,
        returned_quantity: status === "returned" ? (parseInt(req.quantity) || 1) : 0,
      });
    }

    count++;
  }
  console.log(`  Migrated ${count} borrow requests`);
}

async function migrateNotifications(data) {
  console.log("\n=== Migrating Firebase Notifications → Supabase ===");
  const notifs = data.notifications;
  if (!notifs) { console.log("  No notifications node."); return; }

  let count = 0;
  for (const [, n] of Object.entries(notifs)) {
    const { error } = await supabase.from("notifications").insert({
      title: n.type || "Notification",
      message: n.message || "",
      type: n.type === "approved" || n.type === "rejected" || n.type === "returned" ? "borrow_status" :
            n.type === "damage" ? "damage_report" : "system",
      is_read: n.isRead || false,
      created_at: n.createdAt || new Date().toISOString(),
    });

    if (error) {
      console.error(`  FAIL notification: ${error.message}`);
      continue;
    }
    count++;
  }
  console.log(`  Migrated ${count} notifications`);
}

async function migrateActivityLogs(data) {
  console.log("\n=== Migrating Firebase Activity Logs → Supabase ===");
  const logs = data.activity_logs;
  if (!logs) { console.log("  No activity_logs node."); return; }

  let count = 0;
  for (const [, log] of Object.entries(logs)) {
    const { error } = await supabase.from("activity_logs").insert({
      action: log.action || log.action_type || "view",
      entity_type: log.affected_table || log.module || null,
      details: log.description ? { description: log.description } : null,
      created_at: log.created_at || log.timestamp || new Date().toISOString(),
    });

    if (error) {
      console.error(`  FAIL activity_log: ${error.message}`);
      continue;
    }
    count++;
  }
  console.log(`  Migrated ${count} activity logs`);
}

async function migrateAnnouncements(data) {
  console.log("\n=== Migrating Firebase Announcements → Supabase ===");
  const anns = data.announcements;
  if (!anns) { console.log("  No announcements node."); return; }

  let count = 0;
  for (const [, a] of Object.entries(anns)) {
    const { error } = await supabase.from("announcements").insert({
      title: a.title || "Announcement",
      content: a.content || a.message || "",
      target_role: a.target_role || a.targetRole || "all",
      priority: a.priority || "normal",
      is_active: a.is_active !== undefined ? a.is_active : true,
      created_at: a.createdAt || a.created_at || new Date().toISOString(),
    });

    if (error) {
      console.error(`  FAIL announcement: ${error.message}`);
      continue;
    }
    count++;
  }
  console.log(`  Migrated ${count} announcements`);
}

async function migrateDamageReports(data) {
  console.log("\n=== Migrating Firebase Damage Reports → Supabase ===");
  const reports = data.damage_reports;
  if (!reports) { console.log("  No damage_reports node."); return; }

  let count = 0;
  for (const [, r] of Object.entries(reports)) {
    const eqId = equipmentMap.get(r.equipmentId || r.equipment_id);

    const { error } = await supabase.from("damage_reports").insert({
      equipment_id: eqId || null,
      description: r.damageDescription || r.description || "",
      status: r.status === "report damage" ? "pending" : r.status || "pending",
      created_at: r.reportedAt || r.created_at || new Date().toISOString(),
    });

    if (error) {
      console.error(`  FAIL damage report: ${error.message}`);
      continue;
    }
    count++;
  }
  console.log(`  Migrated ${count} damage reports`);
}

async function migrateClassSchedules(data) {
  console.log("\n=== Migrating Firebase Class Schedules → Supabase ===");
  const schedules = data.class_schedules;
  if (!schedules) { console.log("  No class_schedules node."); return; }

  let count = 0;
  for (const [, s] of Object.entries(schedules)) {
    const { error } = await supabase.from("class_schedules").insert({
      subject: s.subject || s.title || null,
      section: s.section || null,
      day_of_week: s.day_of_week || s.day || null,
      start_time: s.start_time || s.startTime || null,
      end_time: s.end_time || s.endTime || null,
      room: s.room || null,
      semester: s.semester || null,
      school_year: s.school_year || s.schoolYear || null,
      created_at: s.created_at || s.createdAt || new Date().toISOString(),
    });

    if (error) {
      console.error(`  FAIL schedule: ${error.message}`);
      continue;
    }
    count++;
  }
  console.log(`  Migrated ${count} class schedules`);
}

async function main() {
  console.log("=== ECP Lab — Firebase RTDB → Supabase Migration ===\n");
  console.log(`Export file: ${FIREBASE_EXPORT}`);

  const data = loadFirebaseData();
  console.log(`Top-level nodes: ${Object.keys(data).join(", ")}`);

  await migrateStudents(data);
  await migrateEquipment(data);
  await migrateBorrowRequests(data);
  await migrateNotifications(data);
  await migrateActivityLogs(data);
  await migrateAnnouncements(data);
  await migrateDamageReports(data);
  await migrateClassSchedules(data);

  console.log("\n=== Migration Complete ===");
  console.log(`  Students:      ${studentMap.size}`);
  console.log(`  Equipment:     ${equipmentMap.size}`);
}

main().catch(console.error);
