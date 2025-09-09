import type { Metadata } from "next";
import "./globals.css"; // <-- สำคัญ: ให้ Tailwind ทำงาน

export const metadata: Metadata = {
  title: "Vent App",
  description: "พื้นที่ระบายความในใจ — Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      {/* ใส่ children ลงใน body และตั้งพื้นหลังด้วย Tailwind */}
      <body className="bg-gray-100">{children}</body>
    </html>
  );
}
