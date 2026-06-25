import { PhotoItem } from "@/lib/supabase";

// Logical display order (exterior / curb-appeal first), derived from filenames
// so we don't have to re-upload to reorder. First keyword match wins.
const DISPLAY_ORDER = [
  "exterior", "duplex", "front-door", "driveway", "ev-charger",
  "backyard", "living-room", "kitchen", "pantry", "hood",
  "half-bath", "stairs", "uphall", "upstairs",
  "masterbdr", "masterbath", "bdr-north", "bdr-south", "upbath",
  "laundry", "garage", "solar", "inv-with-batteries", "furnace",
  "thermostat", "undersink",
];

function rankOf(name: string): number {
  const s = name.toLowerCase();
  const i = DISPLAY_ORDER.findIndex((k) => s.includes(k));
  return i === -1 ? DISPLAY_ORDER.length : i;
}

/** All photos, sorted exterior-first. */
export function sortForDisplay(photos: PhotoItem[]): PhotoItem[] {
  return [...photos].sort((a, b) => rankOf(a.name) - rankOf(b.name) || a.name.localeCompare(b.name));
}

// A curated, varied set for the home-page carousel — outside shot first.
const FEATURED = [
  "exterior-east", "duplex-view", "living-room", "kitchen",
  "masterbdr", "masterbath-tub", "backyard", "ev-charger",
];

/** A handful of representative photos for the carousel (outside first). */
export function pickFeatured(photos: PhotoItem[], max = 8): PhotoItem[] {
  const out: PhotoItem[] = [];
  const used = new Set<string>();
  for (const kw of FEATURED) {
    const p = photos.find((x) => x.name.toLowerCase().includes(kw) && !used.has(x.name));
    if (p) {
      out.push(p);
      used.add(p.name);
    }
  }
  // Fallback if filenames don't match (e.g. you re-named them): just take the
  // first few of the display order.
  if (out.length < 4) return sortForDisplay(photos).slice(0, max);
  return out.slice(0, max);
}

/** The map image (if present in the bucket), kept out of the photo gallery. */
export function findMap(photos: PhotoItem[]): PhotoItem | null {
  return photos.find((p) => p.name.toLowerCase().includes("map")) ?? null;
}

/** All photos except the map. */
export function excludeMap(photos: PhotoItem[]): PhotoItem[] {
  return photos.filter((p) => !p.name.toLowerCase().includes("map"));
}

/** "01-living-room.jpg" -> "living room" for a friendly caption. */
export function photoLabel(name: string): string {
  return name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^\d+[-_]?/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}
