import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orbit Detective",
  description: "AI-powered GitLab pipeline root-cause analysis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen gradient-hero">{children}</body>
    </html>
  );
}
