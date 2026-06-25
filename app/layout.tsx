import type { Metadata } from "next";
import "./globals.css";
import { fullAddress, property, siteUrl } from "@/data/property";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `For Rent — ${property.addressLine}, ${property.city} ${property.state}`,
  description: `${property.beds} bd / ${property.baths} ba townhouse for rent at ${fullAddress()}. Solar + EV chargers, newer kitchen, move-in ready.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
