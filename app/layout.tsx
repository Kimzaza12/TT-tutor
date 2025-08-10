// app/layout.tsx
import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="pt-25">
        <Navbar />
        {children}
      </body>
    </html>
  );
}