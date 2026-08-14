import mysql from "mysql2/promise";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { config } from "dotenv";

config({ path: "web/.env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", SUPABASE_URL?.slice(0, 30) + "...");
console.log("KEY:", SERVICE_ROLE_KEY ? "found" : "missing");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "lemuel",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "lab_inventory_db",
};

const userMap = new Map();
const categoryMap = new Map();
const equipmentMap = new Map();
const maintenanceMap = new Map();

async function migrateUsers(mysqlConn) {
  console.log("\n=== Migrating Users ===");
  const [users] = await mysqlConn.query("SELECT * FROM users");

  for (const user of users) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .single();

    let authId;

    if (existing) {
      authId = existing.id;
      console.log(`  ${user.email} already exists`);
    } else {
      const { data: authUser, error } =
        await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        });

      if (error) {
        console.error(`  Failed to create auth user for ${user.email}:`, error.message);
        continue;
      }

      authId = authUser.user.id;

      const mysqlRole = user.role === "teacher" ? "faculty" : user.role;
      const { error: insertErr } = await supabase.from("users").insert({
        id: authId,
        email: user.email,
        role: mysqlRole,
        full_name: user.full_name,
        status: user.status || "active",
        approved: true,
      });

      if (insertErr) {
        console.error(`  Failed to insert user record for ${user.email}:`, insertErr.message);
        continue;
      }

      console.log(`  Created: ${user.email} (${mysqlRole})`);
    }

    userMap.set(user.user_id, authId);
  }
}

async function migrateCategories(mysqlConn) {
  console.log("\n=== Migrating Categories ===");
  const [categories] = await mysqlConn.query("SELECT * FROM categories");

  for (const cat of categories) {
    const newId = randomUUID();
    const { error } = await supabase.from("categories").insert({
      id: newId,
      name: cat.category_name,
      description: cat.description,
      created_at: cat.created_at,
    });

    if (error) {
      console.error(`  Failed to insert category ${cat.category_name}:`, error.message);
      continue;
    }

    categoryMap.set(cat.category_id, newId);
    console.log(`  ${cat.category_name}`);
  }
}

async function migrateEquipment(mysqlConn) {
  console.log("\n=== Migrating Equipment ===");
  const [equipment] = await mysqlConn.query("SELECT * FROM equipment");

  for (const eq of equipment) {
    const newId = randomUUID();
    const { error } = await supabase.from("equipment").insert({
      id: newId,
      category_id: categoryMap.get(eq.category_id) || null,
      name: eq.equipment_name,
      description: eq.description,
      brand: eq.manufacturer,
      model: eq.model,
      serial_number: eq.serial_number || eq.equipment_code,
      quantity: eq.current_quantity || 1,
      available_quantity: eq.current_quantity || 1,
      location: eq.location,
      status: eq.status || "available",
      condition: "good",
      purchase_date: eq.purchase_date,
    });

    if (error) {
      console.error(`  Failed: ${eq.equipment_name}:`, error.message);
      continue;
    }

    equipmentMap.set(eq.equipment_id, newId);
    console.log(`  ${eq.equipment_name} (qty: ${eq.current_quantity})`);
  }
}

async function migrateEquipmentUsage(mysqlConn) {
  console.log("\n=== Migrating Equipment Usage (Borrow Requests) ===");
  const [usage] = await mysqlConn.query("SELECT * FROM equipment_usage");

  for (const u of usage) {
    const newId = randomUUID();
    const supabaseUserId = userMap.get(u.user_id);
    const supabaseEquipmentId = equipmentMap.get(u.equipment_id);

    if (!supabaseUserId) {
      console.log(`  Skipping usage ${u.usage_id}: unknown user ${u.user_id}`);
      continue;
    }

    const { error } = await supabase.from("borrow_requests").insert({
      id: newId,
      user_id: supabaseUserId,
      request_type: "faculty",
      status: u.status === "returned" ? "returned" : "borrowed",
      purpose: u.purpose,
      borrow_date: u.expected_return_date,
      actual_return_date: u.date_returned || null,
      created_at: u.date_borrowed,
    });

    if (error) {
      console.error(`  Failed usage ${u.usage_id}:`, error.message);
      continue;
    }

    if (supabaseEquipmentId) {
      await supabase.from("borrow_items").insert({
        borrow_request_id: newId,
        equipment_id: supabaseEquipmentId,
        quantity: u.quantity_used || 1,
        returned_quantity: u.status === "returned" ? (u.quantity_used || 1) : 0,
      });
    }

    console.log(`  Usage #${u.usage_id} → borrow_request (${u.status})`);
  }
}

async function migrateMaintenance(mysqlConn) {
  console.log("\n=== Migrating Maintenance ===");
  const [records] = await mysqlConn.query("SELECT * FROM maintenance");

  for (const m of records) {
    const { error } = await supabase.from("maintenance").insert({
      equipment_id: equipmentMap.get(m.equipment_id) || null,
      description: m.description || m.maintenance_type,
      scheduled_date: m.maintenance_date,
      completed_date: m.status === "completed" ? m.next_maintenance_date : null,
      status: m.status,
      notes: m.notes,
      created_at: m.created_at,
    });

    if (error) {
      console.error(`  Failed maintenance ${m.maintenance_id}:`, error.message);
      continue;
    }

    maintenanceMap.set(m.maintenance_id, true);
    console.log(`  Maintenance #${m.maintenance_id} (${m.status})`);
  }
}

async function migrateAlerts(mysqlConn) {
  console.log("\n=== Migrating Alerts ===");
  const [alerts] = await mysqlConn.query("SELECT * FROM alerts");

  for (const a of alerts) {
    const { error } = await supabase.from("alerts").insert({
      title: a.alert_type || "Alert",
      message: a.message,
      type: a.alert_type === "Low Stock" ? "warning" : "info",
      is_active: a.status === "active",
      created_at: a.created_at,
    });

    if (error) {
      console.error(`  Failed alert ${a.alert_id}:`, error.message);
      continue;
    }

    console.log(`  Alert #${a.alert_id}: ${a.alert_type}`);
  }
}

async function main() {
  console.log("=== ECP Lab — MySQL → Supabase Migration ===\n");

  const mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
  console.log("Connected to MySQL");

  await migrateUsers(mysqlConn);
  await migrateCategories(mysqlConn);
  await migrateEquipment(mysqlConn);
  await migrateEquipmentUsage(mysqlConn);
  await migrateMaintenance(mysqlConn);
  await migrateAlerts(mysqlConn);

  await mysqlConn.end();

  console.log("\n=== Migration Complete ===");
  console.log(`  Users: ${userMap.size} migrated`);
  console.log(`  Categories: ${categoryMap.size} migrated`);
  console.log(`  Equipment: ${equipmentMap.size} migrated`);
}

main().catch(console.error);
