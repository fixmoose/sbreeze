"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UtilityBillToggle({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch("/api/utilities/mark-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: status === "paid" ? "forwarded" : "paid" }),
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <button className="btn secondary" style={{ padding: "4px 12px", fontSize: 13 }} onClick={toggle} disabled={busy}>
      {busy ? "…" : status === "paid" ? "Mark unpaid" : "Mark paid"}
    </button>
  );
}
