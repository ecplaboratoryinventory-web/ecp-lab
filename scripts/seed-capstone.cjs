const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: "web/.env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function getCategoryId(name) {
  const { data } = await supabase.from("categories").select("id").ilike("name", `%${name}%`).single();
  return data?.id || null;
}

const equipment = [
  // Chemistry Lab (Science)
  { name: "Beaker 250ml", category: "Glassware", quantity: 20, department: "Science" },
  { name: "Test Tube", category: "Glassware", quantity: 50, department: "Science" },
  { name: "Erlenmeyer Flask 500ml", category: "Glassware", quantity: 15, department: "Science" },
  { name: "Volumetric Flask 100ml", category: "Glassware", quantity: 10, department: "Science" },
  { name: "Graduated Cylinder", category: "Glassware", quantity: 12, department: "Science" },
  { name: "Pipette", category: "Glassware", quantity: 30, department: "Science" },
  { name: "Burette", category: "Glassware", quantity: 8, department: "Science" },
  { name: "Funnel", category: "Glassware", quantity: 15, department: "Science" },
  { name: "Analytical Balance", category: "Measuring Instruments", quantity: 3, department: "Science" },
  { name: "Digital Balance", category: "Measuring Instruments", quantity: 5, department: "Science" },
  { name: "Thermometer", category: "Measuring Instruments", quantity: 20, department: "Science" },
  { name: "pH Meter", category: "Measuring Instruments", quantity: 4, department: "Science" },
  { name: "Hot Plate", category: "Measuring Instruments", quantity: 6, department: "Science" },
  { name: "Magnetic Stirrer", category: "Measuring Instruments", quantity: 4, department: "Science" },
  { name: "Water Bath", category: "Measuring Instruments", quantity: 3, department: "Science" },
  { name: "Centrifuge", category: "Measuring Instruments", quantity: 2, department: "Science" },
  { name: "Fume Hood", category: "Safety Equipment", quantity: 2, department: "Science" },
  { name: "Hydrochloric Acid (HCl)", category: "Chemicals and Reagents", quantity: 10, department: "Science" },
  { name: "Sulfuric Acid (H2SO4)", category: "Chemicals and Reagents", quantity: 8, department: "Science" },
  { name: "Sodium Hydroxide (NaOH)", category: "Chemicals and Reagents", quantity: 12, department: "Science" },
  { name: "Ethanol", category: "Chemicals and Reagents", quantity: 15, department: "Science" },
  { name: "Distilled Water", category: "Chemicals and Reagents", quantity: 25, department: "Science" },
  { name: "Safety Goggles", category: "Safety Equipment", quantity: 25, department: "Science" },
  { name: "Lab Coat", category: "Safety Equipment", quantity: 20, department: "Science" },
  { name: "Chemical Gloves", category: "Safety Equipment", quantity: 30, department: "Science" },
  { name: "Fire Extinguisher", category: "Safety Equipment", quantity: 4, department: "Science" },
  { name: "Eye Wash Station", category: "Safety Equipment", quantity: 2, department: "Science" },
  { name: "Filter Paper", category: "Consumables", quantity: 100, department: "Science" },
  { name: "Litmus Paper", category: "Consumables", quantity: 80, department: "Science" },
  { name: "Weighing Paper", category: "Consumables", quantity: 60, department: "Science" },
  { name: "Test Tube Brush", category: "Consumables", quantity: 25, department: "Science" },

  // Electronics Lab (Engineering)
  { name: "Arduino Uno R3", category: "Microcontrollers", quantity: 15, department: "Engineering" },
  { name: "Arduino Mega", category: "Microcontrollers", quantity: 8, department: "Engineering" },
  { name: "Arduino Leonardo", category: "Microcontrollers", quantity: 6, department: "Engineering" },
  { name: "Arduino Pro Mini", category: "Microcontrollers", quantity: 10, department: "Engineering" },
  { name: "Raspberry Pi 4", category: "Single Board PCs", quantity: 5, department: "Engineering" },
  { name: "Orange Pi", category: "Single Board PCs", quantity: 3, department: "Engineering" },
  { name: "BeagleBone Black", category: "Single Board PCs", quantity: 2, department: "Engineering" },
  { name: "Dell OptiPlex", category: "Desktop PCs", quantity: 20, department: "Engineering" },
  { name: "HP Pavilion", category: "Desktop PCs", quantity: 15, department: "Engineering" },
  { name: "Lenovo ThinkCentre", category: "Desktop PCs", quantity: 10, department: "Engineering" },
  { name: "Resistor Kit", category: "Components", quantity: 50, department: "Engineering" },
  { name: "Capacitor Kit", category: "Components", quantity: 40, department: "Engineering" },
  { name: "Diode Kit", category: "Components", quantity: 30, department: "Engineering" },
  { name: "LED Kit", category: "Components", quantity: 60, department: "Engineering" },
  { name: "Transistor Kit", category: "Components", quantity: 25, department: "Engineering" },
  { name: "IC Kit", category: "Components", quantity: 20, department: "Engineering" },

  // Physics Lab (Science)
  { name: "Vernier Caliper", category: "Measuring Instruments", quantity: 12, department: "Science" },
  { name: "Micrometer Screw Gauge", category: "Measuring Instruments", quantity: 10, department: "Science" },
  { name: "Meter Stick", category: "Measuring Instruments", quantity: 20, department: "Science" },
  { name: "Measuring Tape", category: "Measuring Instruments", quantity: 15, department: "Science" },
  { name: "Stopwatch", category: "Measuring Instruments", quantity: 25, department: "Science" },
  { name: "Spring Balance", category: "Measuring Instruments", quantity: 8, department: "Science" },
  { name: "Multimeter", category: "Electrical Equipment", quantity: 10, department: "Science" },
  { name: "Ammeter", category: "Electrical Equipment", quantity: 8, department: "Science" },
  { name: "Voltmeter", category: "Electrical Equipment", quantity: 8, department: "Science" },
  { name: "Power Supply", category: "Electrical Equipment", quantity: 6, department: "Science" },
  { name: "Rheostat", category: "Electrical Equipment", quantity: 5, department: "Science" },
  { name: "Convex Lens", category: "Optical Equipment", quantity: 15, department: "Science" },
  { name: "Concave Lens", category: "Optical Equipment", quantity: 15, department: "Science" },
  { name: "Prism", category: "Optical Equipment", quantity: 10, department: "Science" },
  { name: "Optical Bench", category: "Optical Equipment", quantity: 5, department: "Science" },
  { name: "Plane Mirror", category: "Optical Equipment", quantity: 10, department: "Science" },
  { name: "Pulley Set", category: "Mechanics Equipment", quantity: 12, department: "Science" },
  { name: "Inclined Plane", category: "Mechanics Equipment", quantity: 6, department: "Science" },
  { name: "Mass Hanger", category: "Mechanics Equipment", quantity: 15, department: "Science" },
  { name: "Weights Set", category: "Mechanics Equipment", quantity: 10, department: "Science" },
  { name: "Spring Set", category: "Mechanics Equipment", quantity: 20, department: "Science" },
  { name: "Oscilloscope", category: "Electrical Equipment", quantity: 4, department: "Science" },
  { name: "Function Generator", category: "Electrical Equipment", quantity: 3, department: "Science" },
  { name: "Breadboard", category: "Components", quantity: 30, department: "Science" },
  { name: "Connecting Wires", category: "Electrical Equipment", quantity: 50, department: "Science" },
];

async function seed() {
  console.log("Seeding equipment from capstone lab lists...\n");

  for (const eq of equipment) {
    const catId = await getCategoryId(eq.category);
    if (!catId) {
      console.log(`  SKIP ${eq.name}: category "${eq.category}" not found`);
      continue;
    }

    const { error } = await supabase.from("equipment").insert({
      name: eq.name,
      category_id: catId,
      quantity: eq.quantity,
      available_quantity: eq.quantity,
      department: eq.department,
      status: "available",
      condition: "good",
    });

    if (error) {
      console.log(`  FAIL ${eq.name}: ${error.message}`);
    } else {
      console.log(`  OK ${eq.name} (qty: ${eq.quantity})`);
    }
  }

  console.log(`\nSeeded ${equipment.length} items`);
}

seed().catch(console.error);
