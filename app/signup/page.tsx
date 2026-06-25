import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import { property } from "@/data/property";

export const metadata: Metadata = { title: "Create your tenant account" };

export default function SignupPage() {
  return (
    <main>
      <section style={{ borderBottom: "none" }}>
        <div className="container" style={{ maxWidth: 520 }}>
          <p className="center" style={{ marginBottom: 6 }}>
            <Link className="brand" href="/">☀️ {property.name}</Link>
          </p>
          <h1 className="center">Create your tenant account</h1>
          <p className="lead center" style={{ margin: "0 auto 24px" }}>
            For approved tenants. Once you’re set up, you can turn on automatic monthly rent
            payments or pay by check / ACH, and see every payment in one place.
          </p>
          <Suspense fallback={null}>
            <AuthForm mode="signup" />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
