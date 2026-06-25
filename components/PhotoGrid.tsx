"use client";

import { useState, useEffect, useCallback } from "react";
import { PhotoItem } from "@/lib/supabase";
import { photoLabel } from "@/lib/photos";

// A clickable photo grid with a full-screen lightbox (arrows + keyboard).
export default function PhotoGrid({ photos }: { photos: PhotoItem[] }) {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const total = photos.length;

  const go = useCallback((n: number) => setI((p) => (n + total) % total), [total]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "ArrowRight") go(i + 1);
      else if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden"; // lock background scroll
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, i, go]);

  if (!total) {
    return (
      <div className="gallery-empty">
        <p style={{ margin: 0, fontWeight: 700 }}>Photos coming soon</p>
      </div>
    );
  }

  return (
    <>
      <div className="gallery">
        {photos.map((p, idx) => (
          <button
            key={p.name}
            className="gallery-thumb"
            onClick={() => {
              setI(idx);
              setOpen(true);
            }}
            aria-label={`Enlarge: ${photoLabel(p.name)}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={photoLabel(p.name)} loading="lazy" />
          </button>
        ))}
      </div>

      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <button className="lightbox-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
          <button
            className="lightbox-btn prev"
            onClick={(e) => { e.stopPropagation(); go(i - 1); }}
            aria-label="Previous photo"
          >‹</button>

          <figure className="lightbox-figure" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[i].url} alt={photoLabel(photos[i].name)} />
            <figcaption>{photoLabel(photos[i].name)} · {i + 1} / {total}</figcaption>
          </figure>

          <button
            className="lightbox-btn next"
            onClick={(e) => { e.stopPropagation(); go(i + 1); }}
            aria-label="Next photo"
          >›</button>
        </div>
      )}
    </>
  );
}
