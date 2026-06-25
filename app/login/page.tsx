import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import { property } from "@/data/property";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main>
      <section style={{ borderBottom: "none" }}>
        <div className="container" style={{ maxWidth: 520 }}>
          <p className="center" style={{ marginBottom: 6 }}>
            <Link className="brand" href="/">☀️ {property.name}</Link>
          </p>
          <h1 className="center">Log in</h1>
          <p className="lead center" style={{ margin: "0 auto 24px" }}>
            Tenants: pay rent and see your payment history. Landlord: manage applications, payments, and taxes.
          </p>
          <Suspense fallback={null}>
            <AuthForm mode="login" />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
