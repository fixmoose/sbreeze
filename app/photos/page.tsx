import Link from "next/link";
import type { Metadata } from "next";
import PhotoGrid from "@/components/PhotoGrid";
import { listPropertyPhotos } from "@/lib/supabase";
import { sortForDisplay, excludeMap } from "@/lib/photos";
import AddressLink from "@/components/AddressLink";
import { property } from "@/data/property";

export const revalidate = 60;
export const metadata: Metadata = { title: `Photos — ${property.addressLine}` };

export default async function PhotosPage() {
  const photos = sortForDisplay(excludeMap(await listPropertyPhotos()));

  return (
    <>
      <header className="hero" style={{ padding: "26px 0" }}>
        <div className="container">
          <div className="nav">
            <Link className="brand" href="/">☀️ {property.name}</Link>
            <span style={{ display: "flex", gap: 10 }}>
              <Link className="btn secondary" href="/">← Back to listing</Link>
              <Link className="btn" href="/apply">Apply now</Link>
            </span>
          </div>
          <h1 style={{ fontSize: 28, marginTop: 8 }}>All photos</h1>
          <p className="addr"><AddressLink /> · {photos.length} photos</p>
        </div>
      </header>

      <main>
        <section style={{ borderBottom: "none" }}>
          <div className="container">
            <PhotoGrid photos={photos} />
          </div>
        </section>
      </main>
    </>
  );
}
