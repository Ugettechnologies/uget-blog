import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UGET Technology Academy | Tech Blog",
  description: "Expert tutorials, career guides, and deep dives into UI/UX, Frontend Development, Cybersecurity, AI — for the next generation of African tech talent.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
