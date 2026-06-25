import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getServiceClient } from "@/lib/supabase";

export type Role = "admin" | "tenant";
export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: Role;
};

/** Emails that should be treated as the landlord/admin. Comma-separated env. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "dejan@haywilson.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

/** The logged-in auth user (or null), from the request cookies. */
export async function getSessionUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null; // not configured yet
  }
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns the user's profile, creating it on first login. The role is derived
 * from the admin email allowlist so the landlord is always 'admin'.
 */
export async function getProfile(): Promise<Profile | null> {
  const user = await getSessionUser();
  if (!user) return null;

  let svc;
  try {
    svc = getServiceClient();
  } catch {
    return null; // Supabase service key not configured yet
  }
  const role: Role = isAdminEmail(user.email) ? "admin" : "tenant";

  const { data: existing } = await svc
    .from("SB_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    const profile = {
      id: user.id,
      email: user.email ?? null,
      full_name: (user.user_metadata?.full_name as string) ?? null,
      phone: (user.user_metadata?.phone as string) ?? null,
      role,
    };
    await svc.from("SB_profiles").insert(profile);
    return profile as Profile;
  }

  // Keep role in sync with the allowlist (e.g. if you add an admin later).
  if (existing.role !== role) {
    await svc.from("SB_profiles").update({ role }).eq("id", user.id);
    existing.role = role;
  }
  return existing as Profile;
}

/** Returns the admin profile, or null if the caller is not the landlord. */
export async function requireAdmin(): Promise<Profile | null> {
  const profile = await getProfile();
  return profile && profile.role === "admin" ? profile : null;
}
