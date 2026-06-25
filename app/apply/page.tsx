import Link from "next/link";
import type { Metadata } from "next";
import ApplicationForm from "@/components/ApplicationForm";
import AddressLink from "@/components/AddressLink";
import { property, criteria, money } from "@/data/property";

export const metadata: Metadata = {
  title: `Apply — ${property.addressLine}`,
};

export default function ApplyPage() {
  return (
    <>
      <header className="hero" style={{ padding: "32px 0" }}>
        <div className="container">
          <div className="nav">
            <Link className="brand" href="/">☀️ {property.name}</Link>
            <Link className="btn secondary" href="/">← Back to listing</Link>
          </div>
          <p className="eyebrow">Rental application</p>
          <h1 style={{ fontSize: 30 }}>Apply for <AddressLink /></h1>
          <p className="addr">
            {money(property.rent)}/month · {property.beds} bd / {property.baths} ba · {property.leaseTermMonths}-month lease
          </p>
        </div>
      </header>

      <main>
        <section style={{ borderBottom: "none" }}>
          <div className="container">
            <div className="callout">
              <strong>Before you start:</strong> we look for combined gross household income of about{" "}
              {criteria.incomeMultiple}× the rent, a credit score of {criteria.minCreditScore}+, no
              evictions in the last {criteria.evictionLookbackYears} years, and positive landlord
              references. This short form takes ~5 minutes and does <em>not</em> ask for your SSN or
              any documents — that comes later, securely, only if your application qualifies.
            </div>
            <ApplicationForm />
          </div>
        </section>
      </main>
    </>
  );
}
