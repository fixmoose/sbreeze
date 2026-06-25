// Compresses ./photos/* and uploads to the Supabase "SB_property_photos" bucket.
// - Creates the (public) bucket if it doesn't exist.
// - Resizes to max 1600px and re-encodes as optimized JPEG (~10-20x smaller),
//   so the listing loads fast on phones.
// - Renames to NN-slug.jpg (display order is also handled in the app).
// - Safe to re-run (upsert overwrites). Run:  node scripts/upload-photos.mjs
//
// Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (read from .env.local).

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, extname, basename } from "node:path";

const BUCKET = "SB_property_photos";
const PHOTOS_DIR = "photos";
const MAX_DIM = 2048; // longest edge, px
const QUALITY = 90; // JPEG quality

function loadEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("\n❌ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local\n");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const ORDER = [
  "Living Room", "Kitchen", "Pantry", "Hood",
  "Half Bath", "Half bath",
  "Front Door", "Stairs", "UpHall", "Upstairs hall",
  "MasterBdr", "MasterBath",
  "Bdr North", "Bdr South",
  "UpBath",
  "LaundryRoom",
  "Garage", "EV Charger",
  "Driveway", "Exterior", "Duplex View",
  "Backyard",
  "Solar", "Inv with Batteries", "Furnace", "Thermostat", "UnderSink",
];
const rank = (name) => {
  for (let i = 0; i < ORDER.length; i++) if (name.includes(ORDER[i])) return i;
  return ORDER.length;
};
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const mb = (bytes) => (bytes / 1048576).toFixed(2);

async function main() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw error;
    console.log(`✓ Created public bucket "${BUCKET}"`);
  } else {
    console.log(`✓ Bucket "${BUCKET}" already exists`);
  }

  const files = readdirSync(PHOTOS_DIR)
    .filter((f) => /\.(jpe?g|png|webp|heic)$/i.test(f))
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));

  console.log(`Compressing + uploading ${files.length} photos (max ${MAX_DIM}px, q${QUALITY})…\n`);
  let n = 0, origTotal = 0, newTotal = 0;
  for (const f of files) {
    n++;
    const input = readFileSync(join(PHOTOS_DIR, f));
    const out = await sharp(input)
      .rotate() // honor EXIF orientation (phone photos)
      .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toBuffer();
    origTotal += input.length;
    newTotal += out.length;

    const target = `${String(n).padStart(2, "0")}-${slug(basename(f, extname(f)))}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(target, out, { contentType: "image/jpeg", upsert: true });
    console.log(
      error
        ? `  ✗ ${target}  (${error.message})`
        : `  ✓ ${target}  ${mb(input.length)}MB → ${mb(out.length)}MB`
    );
  }
  console.log(`\nDone. Total ${mb(origTotal)}MB → ${mb(newTotal)}MB (${Math.round((1 - newTotal / origTotal) * 100)}% smaller).`);
}

main().catch((e) => {
  console.error("\n❌ Upload failed:", e.message || e);
  process.exit(1);
});
