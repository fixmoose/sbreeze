import { fullAddress } from "@/data/property";

// Renders the property address as a link that opens Google Maps in a new tab.
// Inherits the surrounding text color so it reads well on light or dark backgrounds.
export default function AddressLink() {
  const addr = fullAddress();
  const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  return (
    <a className="addr-link" href={href} target="_blank" rel="noreferrer noopener">
      {addr}
    </a>
  );
}
