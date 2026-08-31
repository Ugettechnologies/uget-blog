import type { MetadataRoute } from "next";
import { queryAll } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://echo-gist.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await queryAll(
      `SELECT slug, updated_at, created_at FROM posts WHERE published = true ORDER BY created_at DESC`
    );

    if (posts && Array.isArray(posts)) {
      postRoutes = posts.map((post: any) => ({
        url: `${baseUrl}/post/${post.slug}`,
        lastModified: post.updated_at ? new Date(post.updated_at) : new Date(post.created_at || Date.now()),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error("Failed to generate dynamic sitemap for posts:", err);
  }

  return [...staticRoutes, ...postRoutes];
}

