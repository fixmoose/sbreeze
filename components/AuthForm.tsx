"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const supabase = createSupabaseBrowserClient();

    try {
      if (mode === "signup") {
        const full_name = String(fd.get("full_name") || "").trim();
        const phone = String(fd.get("phone") || "").trim();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name, phone } },
        });
        if (error) throw error;
        // If email confirmation is required, there's no session yet.
        if (!data.session) {
          setInfo("Check your email to confirm your account, then log in.");
          setBusy(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} style={{ maxWidth: 460, margin: "0 auto" }}>
      {error && <div className="error">{error}</div>}
      {info && <div className="callout law">{info}</div>}

      {mode === "signup" && (
        <>
          <div className="field">
            <label htmlFor="full_name">Full name</label>
            <input id="full_name" name="full_name" type="text" required />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" type="tel" />
          </div>
        </>
      )}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={8} />
        {mode === "signup" && <span className="hint">At least 8 characters.</span>}
      </div>

      <button className="btn big" type="submit" disabled={busy} style={{ width: "100%" }}>
        {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
      </button>

      <p className="small center" style={{ marginTop: 16 }}>
        {mode === "signup" ? (
          <>Already have an account? <Link href="/login">Log in</Link></>
        ) : (
          <>New tenant? <Link href="/signup">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
