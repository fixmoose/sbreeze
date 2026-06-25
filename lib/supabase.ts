import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Per project convention, every Supabase table & bucket is prefixed "SB_".
export const SB_PHOTO_BUCKET = "SB_property_photos";
export const SB_RECEIPTS_BUCKET = "SB_receipts";
export const SB_APPLICATIONS_TABLE = "SB_applications";
export const SB_PROFILES_TABLE = "SB_profiles";
export const SB_LEASES_TABLE = "SB_leases";
export const SB_PAYMENTS_TABLE = "SB_payments";
export const SB_EXPENSES_TABLE = "SB_expenses";
export const SB_UTILITY_BILLS_TABLE = "SB_utility_bills";

/**
 * Server-side admin client (uses the service_role key).
 * Only import this from server code (API routes / server components) — never
 * ship the service_role key to the browser.
 */
export function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type PhotoItem = { name: string; url: string };

/**
 * Lists photos in the public SB_property_photos bucket and returns public URLs,
 * sorted by name (so 01-*.jpg, 02-*.jpg controls order).
 * Returns [] (never throws) so the listing page renders even before photos
 * are uploaded or if Supabase is not yet configured.
 */
export async function listPropertyPhotos(): Promise<PhotoItem[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return [];
    }
    const supabase = getServiceClient();
    const { data, error } = await supabase.storage.from(SB_PHOTO_BUCKET).list("", {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    });
    if (error || !data) return [];
    return data
      .filter((f) => f.name && !f.name.startsWith(".") && /\.(jpe?g|png|webp|avif|gif)$/i.test(f.name))
      .map((f) => {
        const { data: pub } = supabase.storage.from(SB_PHOTO_BUCKET).getPublicUrl(f.name);
        return { name: f.name, url: pub.publicUrl };
      });
  } catch {
    return [];
  }
}
