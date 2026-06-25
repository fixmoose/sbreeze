import { PhotoItem } from "@/lib/supabase";

export default function Gallery({ photos }: { photos: PhotoItem[] }) {
  if (!photos.length) {
    return (
      <div className="gallery-empty">
        <p style={{ margin: 0, fontWeight: 700 }}>Photos coming soon</p>
        <p className="small" style={{ margin: "6px 0 0" }}>
          Upload images to the <code>SB_property_photos</code> bucket in Supabase and they
          appear here automatically. Tip: name them <code>01-living.jpg</code>, <code>02-kitchen.jpg</code> … to control the order.
        </p>
      </div>
    );
  }
  return (
    <div className="gallery">
      {photos.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={p.name} src={p.url} alt={`Sunset Breeze — ${p.name}`} loading="lazy" />
      ))}
    </div>
  );
}
