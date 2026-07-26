const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");
require("dotenv").config({ path: "web/.env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SUBCATEGORIES_MAP = {
  "microscopes": ["Compound Microscope", "Stereo Microscope", "Digital Microscope"],
  "glassware": ["Beakers", "Flasks", "Test Tubes", "Pipettes"],
  "chemicals": ["Acids", "Bases", "Solvents", "Indicators"],
  "measurement": ["Calipers", "Multimeters", "Oscilloscopes", "Thermometers"],
  "safety equipment": ["Goggles", "Gloves", "Lab Coats", "Fire Extinguishers"],
  "electronics": ["Arduino", "Raspberry Pi", "Sensors", "Breadboards"],
  "dissection": ["Dissection Kits", "Scalpels", "Forceps", "Trays"],
  "centrifuges": ["Microcentrifuge", "Ultracentrifuge", "Benchtop Centrifuge"],
};

async function main() {
  console.log("=== Seeding Subcategories ===\n");

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name");

  if (error) {
    console.error("Failed to fetch categories:", error.message);
    process.exit(1);
  }

  console.log(`Found ${categories.length} categories\n`);

  let inserted = 0;
  let skipped = 0;

  for (const category of categories) {
    const categoryKey = category.name.toLowerCase();
    const subcategoryNames = SUBCATEGORIES_MAP[categoryKey];

    if (!subcategoryNames) {
      console.log(`  SKIP "${category.name}" — no subcategories defined`);
      continue;
    }

    const { data: existing } = await supabase
      .from("subcategories")
      .select("id")
      .eq("category_id", category.id);

    if (existing && existing.length > 0) {
      console.log(`  SKIP "${category.name}" — already has ${existing.length} subcategories`);
      skipped += existing.length;
      continue;
    }

    for (const name of subcategoryNames) {
      const { error: insertErr } = await supabase
        .from("subcategories")
        .insert({
          id: randomUUID(),
          category_id: category.id,
          name,
        });

      if (insertErr) {
        console.error(`  FAIL "${category.name}" → "${name}": ${insertErr.message}`);
      } else {
        console.log(`  OK   "${category.name}" → "${name}"`);
        inserted++;
      }
    }
  }

  console.log(`\n=== Done: ${inserted} inserted, ${skipped} already existed ===`);
}

main().catch(console.error);
