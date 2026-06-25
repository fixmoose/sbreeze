import Link from "next/link";
import Carousel from "@/components/Carousel";
import ContactForm from "@/components/ContactForm";
import PhoneReveal from "@/components/PhoneReveal";
import { listPropertyPhotos } from "@/lib/supabase";
import { sortForDisplay, pickFeatured, findMap, excludeMap } from "@/lib/photos";
import {
  property,
  utilities,
  features,
  criteria,
  pets,
  occupancy,
  requirements,
  disclosures,
  fairHousing,
  screeningProcess,
  contact,
  fullAddress,
  money,
} from "@/data/property";

// Re-fetch photos at most every 60s (so new uploads show without a redeploy).
export const revalidate = 60;

export default async function Home() {
  const raw = await listPropertyPhotos();
  const mapPhoto = findMap(raw);
  const allPhotos = sortForDisplay(excludeMap(raw));
  const featured = pickFeatured(allPhotos);

  // Hero background photo (Garage Door front shot), with sensible fallbacks.
  const heroPhoto =
    allPhotos.find((p) => p.name.toLowerCase().endsWith("garage-door.jpg")) ||
    allPhotos.find((p) => p.name.toLowerCase().includes("garage-door")) ||
    allPhotos.find((p) => p.name.toLowerCase().includes("exterior-east")) ||
    allPhotos.find((p) => p.name.toLowerCase().includes("exterior")) ||
    featured[0] ||
    allPhotos[0];

  return (
    <>
      {/* Hero */}
      <header
        className={heroPhoto ? "hero hero-photo" : "hero"}
        style={
          heroPhoto
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(20,12,4,0.30) 0%, rgba(20,12,4,0.74) 100%), url('${heroPhoto.url}')`,
              }
            : undefined
        }
      >
        <div className="container">
          <div className="nav">
            <span className="brand">☀️ {property.name}</span>
            <Link className="btn secondary" href="/apply">Apply now</Link>
          </div>
          <p className="eyebrow">For Rent · {property.type}</p>
          <h1>{property.name} — {property.city}, {property.state}</h1>
          <p className="addr">{fullAddress()}</p>
          <div className="price-row">
            <span className="price">{money(property.rent)}<small> / month</small></span>
            <span className="avail">{property.availability}</span>
          </div>
          <div className="facts">
            <span>{property.beds} Bedrooms</span>
            <span>{property.baths} Baths</span>
            <span>~{property.sqft.toLocaleString()} sq ft</span>
            <span>Solar + EV</span>
          </div>
          <Link className="btn big" href="/apply">Start your application →</Link>
        </div>
      </header>

      <main>
        {/* Gallery */}
        <section>
          <div className="container">
            <h2>Photos</h2>
            <Carousel photos={featured} />
            {allPhotos.length > featured.length && (
              <p style={{ marginTop: 16 }}>
                <Link className="btn secondary" href="/photos">
                  View all {allPhotos.length} photos →
                </Link>
              </p>
            )}
          </div>
        </section>

        {/* Features */}
        <section>
          <div className="container">
            <h2>The home</h2>
            <p className="lead">
              A move-in-ready {property.beds}-bed, {property.baths}-bath townhouse with modern,
              energy-smart upgrades. Professionally cleaned and empty — available immediately.
            </p>
            <div className="grid">
              {features.map((f) => (
                <div className="card" key={f.title}>
                  <div className="ic">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Utilities */}
        <section>
          <div className="container">
            <h2>What’s included</h2>
            <div className="cols2">
              <div>
                <h3>Included in rent</h3>
                <ul className="clean">
                  {utilities.includedInRent.map((u) => <li key={u}>{u}</li>)}
                </ul>
              </div>
              <div>
                <h3>Paid by tenant</h3>
                <ul className="clean dash">
                  {utilities.paidByTenant.map((u) => <li key={u}>{u}</li>)}
                </ul>
              </div>
            </div>
            <div className="callout">
              <strong>Note on power:</strong> the solar + battery system is <strong>included at no
              extra charge</strong> — it keeps electricity costs lower and provides backup during
              outages. Remaining usage is billed by NV Energy (the account stays in the owner’s name
              for net metering, and the bill is forwarded to the tenant).
            </div>
          </div>
        </section>

        {/* Terms & requirements */}
        <section>
          <div className="container">
            <h2>Lease terms & requirements</h2>
            <p className="lead">Clear, up-front, and applied to every applicant the same way.</p>
            <dl className="kv">
              <dt>Rent</dt>
              <dd>{money(property.rent)}/month (includes the solar + battery system, property tax, garbage, and sewer).</dd>
              <dt>Lease term</dt>
              <dd>{property.leaseTermMonths}-month lease.</dd>
              <dt>Security deposit</dt>
              <dd>{money(property.securityDeposit)} — {property.securityDepositMaxNote}</dd>
            </dl>
            <div className="grid" style={{ marginTop: 22 }}>
              {requirements.map((r) => (
                <div className="card" key={r.title}>
                  <h3>{r.title}</h3>
                  <p>{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Occupancy + Pets */}
        <section>
          <div className="container">
            <div className="cols2">
              <div>
                <h2>Occupancy</h2>
                <ul className="clean dash">
                  {occupancy.policy.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
              <div>
                <h2>Pets</h2>
                <ul className="clean dash">
                  {pets.policy.map((p) => <li key={p}>{p}</li>)}
                </ul>
                <div className="callout law small">{pets.serviceAnimalNote}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Rental criteria */}
        <section>
          <div className="container">
            <h2>Rental criteria</h2>
            <p className="lead">
              To qualify, applicants must meet all of the following. These criteria are published
              here and applied uniformly to everyone who applies.
            </p>
            <ul className="clean">
              {criteria.items.map((c) => <li key={c}>{c}</li>)}
            </ul>
            <div className="callout law">{criteria.fairnessNote}</div>
          </div>
        </section>

        {/* How screening works */}
        <section>
          <div className="container">
            <h2>How the application works</h2>
            <ol>
              {screeningProcess.steps.map((s) => <li key={s} style={{ marginBottom: 8 }}>{s}</li>)}
            </ol>
            <div className="callout">{screeningProcess.screeningFeeNote}</div>
            <p style={{ marginTop: 22 }}>
              <Link className="btn big" href="/apply">Start your application →</Link>
            </p>
          </div>
        </section>

        {/* Disclosures */}
        <section>
          <div className="container">
            <h2>Disclosures</h2>
            <dl className="kv">
              {disclosures.map((d) => (
                <div key={d.title}>
                  <dt>{d.title}</dt>
                  <dd>{d.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Location */}
        {mapPhoto && (
          <section>
            <div className="container">
              <h2>Location</h2>
              <p className="lead">
                {property.city}, {property.state} {property.zip} — close to schools, shopping, and
                quick freeway access to the rest of the region.
              </p>
              <div className="map-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mapPhoto.url} alt={`Map of ${fullAddress()}`} loading="lazy" />
              </div>
              <p className="small" style={{ marginTop: 12 }}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress())}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps →
                </a>
              </p>
            </div>
          </section>
        )}

        {/* Contact */}
        <section style={{ borderBottom: "none" }}>
          <div className="container">
            <h2>Contact / request a showing</h2>
            <p className="lead">
              {contact.showingNote} Prefer to call? <PhoneReveal />{" "}
              <span className="small muted">(click to reveal)</span>
            </p>
            <div style={{ maxWidth: 640 }}>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="eho">
            <span className="house">🏠</span> Equal Housing Opportunity
          </div>
          <p className="small">{fairHousing.long}</p>
          <p className="small muted" style={{ marginTop: 18 }}>
            {fullAddress()} · This listing is provided by the property owner. Information believed
            accurate but not guaranteed; terms subject to a signed lease.
          </p>
          <p className="small" style={{ marginTop: 14 }}>
            <Link href="/login">Resident sign in</Link>
          </p>
        </div>
      </footer>
    </>
  );
}
