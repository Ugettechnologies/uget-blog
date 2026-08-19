import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "EchoGist — Where Ideas Live", template: "%s | EchoGist" },
  description: "Read and write stories that matter. Join EchoGist's community of writers sharing ideas on technology, design, careers, and more.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: { type: "website", siteName: "EchoGist" },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeScript = `
    (function() {
      try {
        var t = localStorage.getItem('theme');
        var dark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (dark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        var sidebarCollapsed = localStorage.getItem('uget_sidebar_collapsed') === 'true';
        if (sidebarCollapsed) {
          document.documentElement.classList.add('sidebar-collapsed');
        } else {
          document.documentElement.classList.remove('sidebar-collapsed');
        }
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7030150096951668"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {});
                });
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
