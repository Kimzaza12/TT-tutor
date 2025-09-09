import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Vent App", description: "พื้นที่ระบายความในใจ" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-gray-100">{children}</body>
    </html>
  );
}