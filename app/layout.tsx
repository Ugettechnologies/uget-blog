import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UGET Technologies | Tech Academy Blog",
  description: "Tutorials, guides, and insights on UI/UX, Frontend Development, Cybersecurity, AI, and tech careers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
