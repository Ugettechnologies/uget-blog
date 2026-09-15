"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SafeImage from "@/components/SafeImage";
import { formatDate } from "@/lib/types";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  read_time: number;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/posts?limit=15");
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch (err) {
        console.error("Failed to fetch blog posts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 820, margin: "0 auto", padding: "60px 24px 80px", width: "100%" }}>
        <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--brand)", display: "block", marginBottom: 12 }}>
          EchoGist Publication
        </span>
        <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, marginBottom: 8, color: "var(--black)" }}>
          The EchoGist Official Blog
        </h1>
        <p style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--muted)", marginBottom: 40, lineHeight: 1.6 }}>
          In-depth technical guides, engineering architectures, software career insights, and platform updates.
        </p>

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)", fontFamily: "var(--sans)" }}>
            Loading articles...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {posts.map((post) => (
              <article key={post.id} style={{ borderBottom: "1px solid var(--border-2)", paddingBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--brand)", background: "var(--bg-2)", padding: "2px 8px", borderRadius: 6, border: "1px solid var(--border)" }}>
                    {post.category || "Technology"}
                  </span>
                  <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>·</span>
                  <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>{formatDate(post.created_at)}</span>
                  <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>·</span>
                  <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>{post.read_time || 8} min read</span>
                </div>

                <Link href={`/post/${post.slug}`} style={{ textDecoration: "none" }}>
                  <h2 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: "var(--ink)", margin: "4px 0 10px", lineHeight: 1.3 }}>
                    {post.title}
                  </h2>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
                    {post.excerpt}
                  </p>
                </Link>

                <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {post.profiles?.avatar_url && (
                      <SafeImage src={post.profiles.avatar_url} alt={post.profiles.full_name || "Author"} width={22} height={22} style={{ borderRadius: "50%" }} />
                    )}
                    <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
                      {post.profiles?.full_name || "EchoGist Editorial"}
                    </span>
                  </div>

                  <Link href={`/post/${post.slug}`} style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "var(--brand)", textDecoration: "none" }}>
                    Read article &rarr;
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
