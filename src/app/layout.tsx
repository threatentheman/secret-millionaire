import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secret Millionaire: Bali Villa Edition",
  description: "Realtime party game for Bali villa chaos."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
