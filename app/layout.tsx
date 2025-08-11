
import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-[calc(105dvh-64px)] ">
      {/* <body className="min-h-[calc(105dvh-64px)] flex justify-center content-center"></body> */}

        <Navbar />
        {children}
      </body>
    </html>
  );
}