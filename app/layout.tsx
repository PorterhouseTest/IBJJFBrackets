import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bracket Watch",
  description: "Private JiuJitsu.net division scouting dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
