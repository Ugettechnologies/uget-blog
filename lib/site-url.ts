/**
 * Canonical Site URL Helper
 * Ensures all canonical URLs, sitemaps, robots.txt, and metadata use the exact primary production domain.
 * Vercel redirects https://echo-gist.com -> https://www.echo-gist.com (308),
 * so all canonical links and schemas MUST use https://www.echo-gist.com to prevent redirect loops
 * and resolve Google Search Console "Duplicate without user-selected canonical" errors.
 */

export const PRIMARY_DOMAIN = "https://www.echo-gist.com";

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!envUrl) {
    return PRIMARY_DOMAIN;
  }

  const trimmed = envUrl.trim().replace(/\/+$/, "");
  if (trimmed.includes("localhost") || trimmed.includes("127.0.0.1")) {
    return trimmed;
  }

  // If apex domain is used, normalize to primary www domain
  if (trimmed === "https://echo-gist.com" || trimmed === "http://echo-gist.com") {
    return PRIMARY_DOMAIN;
  }

  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

export function getAbsoluteUrl(path: string): string {
  const base = getSiteUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
