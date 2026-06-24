import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orbit Rover — GitLab pipeline root-cause analysis",
  description:
    "When CI fails, Orbit Rover investigates logs, merge requests, and your dependency graph — then posts the diagnosis on your MR.",
  metadataBase: new URL("https://orbit-rover.vercel.app"),
  openGraph: {
    title: "Orbit Rover",
    description: "AI-powered GitLab pipeline root-cause analysis",
    url: "https://orbit-rover.vercel.app",
    siteName: "Orbit Rover",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
