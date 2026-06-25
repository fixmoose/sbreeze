"use client";

import { useEffect, useState } from "react";
import { PhotoItem } from "@/lib/supabase";
import { photoLabel } from "@/lib/photos";

export default function Carousel({ photos }: { photos: PhotoItem[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = photos.length;
  const go = (n: number) => setI((prev) => (n + total) % total);

  // Auto-advance every 6s unless the user is hovering/interacting.
  useEffect(() => {
    if (paused || total <= 1) return;
    const t = setInterval(() => setI((prev) => (prev + 1) % total), 6000);
    return () => clearInterval(t);
  }, [paused, total]);

  if (total === 0) {
    return (
      <div className="gallery-empty">
        <p style={{ margin: 0, fontWeight: 700 }}>Photos coming soon</p>
      </div>
    );
  }

  return (
    <div
      className="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="carousel-img" src={photos[i].url} alt={photoLabel(photos[i].name)} />
      {/* preload neighbour so next/prev is instant */}
      {total > 1 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photos[(i + 1) % total].url} alt="" style={{ display: "none" }} aria-hidden="true" />
      )}

      {total > 1 && (
        <>
          <button className="carousel-btn prev" onClick={() => go(i - 1)} aria-label="Previous photo">‹</button>
          <button className="carousel-btn next" onClick={() => go(i + 1)} aria-label="Next photo">›</button>
          <span className="carousel-cap">{photoLabel(photos[i].name)}</span>
          <span className="carousel-counter">{i + 1} / {total}</span>
        </>
      )}

      {total > 1 && (
        <div className="carousel-dots" role="tablist">
          {photos.map((p, idx) => (
            <button
              key={p.name}
              className={`carousel-dot${idx === i ? " active" : ""}`}
              onClick={() => setI(idx)}
              aria-label={`Go to photo ${idx + 1}`}
              aria-selected={idx === i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
