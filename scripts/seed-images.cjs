const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: "web/.env.local" });
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "bytar2oq",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function uploadFromUrl(url, publicId, folder) {
  try {
    const result = await cloudinary.uploader.upload(url, {
      public_id: publicId,
      folder: `ecp-lab/${folder}`,
      overwrite: true,
    });
    return result.secure_url;
  } catch (e) {
    console.log(`  FAIL ${publicId}: ${e.message}`);
    return null;
  }
}

async function seed() {
  const { data: equipment } = await supabase.from("equipment").select("id, name, department, categories(name)");

  if (!equipment) return;

  console.log(`Seeding images for ${equipment.length} items...\n`);

  for (const eq of equipment) {
    const cat = eq.categories?.name?.toLowerCase().replace(/[^a-z]/g, "-") || "lab";
    const name = eq.name.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 40);
    const dept = (eq.department || "general").toLowerCase();

    // Use Picsum with unique seed per equipment
    const seed = eq.id.split("-")[0];
    const picsumUrl = `https://picsum.photos/seed/${seed}/400/400`;

    const cldUrl = await uploadFromUrl(picsumUrl, name, dept);

    if (cldUrl) {
      await supabase.from("equipment").update({ image_url: cldUrl }).eq("id", eq.id);
      console.log(`  OK ${eq.name} → ${cldUrl.substring(0, 60)}...`);
    }
  }

  console.log("\nDone.");
}

seed().catch(console.error);
