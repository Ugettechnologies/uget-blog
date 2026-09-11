import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const baseUrl = (!envUrl || envUrl.includes("localhost")) ? "https://www.echo-gist.com" : envUrl;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/onboarding/"],
      },
      {
        userAgent: ["Mediapartners-Google", "Google-AdSense-Bot"],
        allow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

