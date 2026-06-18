"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/db-client/client";
import type { Post, Profile } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawUsername = (params?.username as string || "").replace(/^@/, "");
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!rawUsername) return;
    const load = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Try by username first, then by ID
      let { data: prof } = await supabase.from("profiles").select("*").eq("username", rawUsername).single();
      if (!prof) {
        const res = await supabase.from("profiles").select("*").eq("id", rawUsername).single();
        prof = res.data;
      }
      if (!prof) { setLoading(false); return; }
      setProfile(prof);

      if (user && user.id !== prof.id) {
        const { data: followRes } = await supabase.from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", prof.id)
          .single();
        setIsFollowing(!!followRes);
      }

      const { data } = await supabase.from("posts")
        .select("*").eq("author_id", prof.id).eq("published", true)
        .order("created_at", { ascending: false });
      setPosts(data as Post[] || []);
      setLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawUsername]);

  const handleFollow = async () => {
    if (!currentUser) { router.push("/auth"); return; }
    if (!profile) return;
    
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", profile.id);
      setIsFollowing(false);
      setProfile({
        ...profile,
        follower_count: Math.max((profile.follower_count || 0) - 1, 0)
      });
    } else {
      await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: profile.id });
      setIsFollowing(true);
      setProfile({
        ...profile,
        follower_count: (profile.follower_count || 0) + 1
      });
    }
  };

  if (loading) return (
    <div style={{ background: "white", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }}>
        <div className="spinner" style={{ width: 28, height: 28, borderColor: "var(--border)", borderTopColor: "var(--ink)" }} />
      </div>
    </div>
  );

  if (!profile) return (
    <div style={{ background: "white", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 700, color: "var(--black)", marginBottom: 8 }}>Writer not found</h1>
        <Link href="/" className="btn btn-primary btn-md" style={{ textDecoration: "none", marginTop: 16, display: "inline-flex" }}>Back to home</Link>
      </div>
    </div>
  );

  const totalViews = posts.reduce((s, p) => s + (p.view_count || 0), 0);

  return (
    <div style={{ background: "white", minHeight: "100vh" }}>
      <Navbar />

      {/* Profile header */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "60px 0 40px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 36, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.full_name || ""} width={96} height={96} style={{ objectFit: "cover" }} />
              ) : getInitials(profile.full_name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 6 }}>
                <h1 style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 700, color: "var(--black)", letterSpacing: "-0.02em", margin: 0 }}>
                  {profile.full_name}
                </h1>
                {currentUser && currentUser.id !== profile.id && (
                  <button
                    onClick={handleFollow}
                    className={`btn btn-sm ${isFollowing ? "btn-outline" : "btn-primary"}`}
                    style={{ borderRadius: 999, height: 32, padding: "0 16px", display: "inline-flex", alignItems: "center" }}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
              {profile.bio && (
                <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)", lineHeight: 1.6, marginBottom: 12 }}>{profile.bio}</p>
              )}
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {[
                  { v: posts.length, l: "Stories" },
                  { v: (profile.follower_count || 0).toLocaleString(), l: "Followers" },
                  { v: totalViews.toLocaleString(), l: "Views" },
                ].map((s) => (
                  <div key={s.l} style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)" }}>
                    <strong style={{ color: "var(--ink)", fontWeight: 700 }}>{s.v}</strong> {s.l}
                  </div>
                ))}
                {profile.twitter && (
                  <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener"
                    style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--blue)", textDecoration: "none" }}>
                    @{profile.twitter}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✍️</div>
            <p style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--muted)" }}>No stories published yet.</p>
          </div>
        ) : (
          posts.map((post) => {
            const cat = CATEGORIES.find((c) => c.id === post.category);
            return (
              <article key={post.id} className="post-card">
                <div className="post-card-content">
                  <div className="post-card-meta" style={{ marginBottom: 8 }}>
                    {cat && <span className="post-card-tag">{cat.icon} {cat.label}</span>}
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <Link href={`/post/${post.slug}`} style={{ textDecoration: "none" }}>
                    <h2 className="post-card-title">{post.title}</h2>
                    {post.excerpt && <p className="post-card-excerpt">{post.excerpt}</p>}
                  </Link>
                  <div className="post-card-meta" style={{ marginTop: 8 }}>
                    <span>{post.read_time} min read</span>
                    <span>· {post.view_count} views</span>
                    <span>· {post.like_count} likes</span>
                  </div>
                </div>
                {post.cover_image && (
                  <Link href={`/post/${post.slug}`} className="post-card-image">
                    <Image src={post.cover_image} alt={post.title} width={200} height={134} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                  </Link>
                )}
              </article>
            );
          })
        )}
      </div>

      <Footer />
    </div>
  );
}
