"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/db-client/client";
import type { Post, Comment } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const supabase = createClient();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [related, setRelated] = useState<Post[]>([]);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Click outside listener for share dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    if (slug) loadPost();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadPost = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("*, profiles(id, full_name, avatar_url, username, bio)")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (!data) { router.push("/"); return; }
    setPost(data as Post);
    setLikeCount(data.like_count || 0);

    // Increment views
    await supabase.from("posts").update({ view_count: (data.view_count || 0) + 1 }).eq("id", data.id);

    // Get related
    const { data: rel } = await supabase.from("posts")
      .select("*, profiles(full_name, avatar_url, username)")
      .eq("published", true).eq("category", data.category).neq("id", data.id).limit(3);
    setRelated(rel as Post[] || []);

    // Get comments
    const { data: coms } = await supabase.from("comments")
      .select("*, profiles(full_name, avatar_url, username)")
      .eq("post_id", data.id).order("created_at", { ascending: true });
    setComments(coms as Comment[] || []);

    // Check like/bookmark for current user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [likeRes, bmRes, followRes] = await Promise.all([
        supabase.from("likes").select("id").eq("post_id", data.id).eq("user_id", user.id).single(),
        supabase.from("bookmarks").select("id").eq("post_id", data.id).eq("user_id", user.id).single(),
        supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", data.author_id).single(),
      ]);
      setLiked(!!likeRes.data);
      setBookmarked(!!bmRes.data);
      setIsFollowingAuthor(!!followRes.data);
    }
    setLoading(false);
  };

  const handleLike = async () => {
    if (!user || !post) { router.push("/auth"); return; }
    if (liked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      setLikeCount((n) => n - 1);
    } else {
      await supabase.from("likes").insert({ post_id: post.id, user_id: user.id });
      setLikeCount((n) => n + 1);
    }
    setLiked(!liked);
    await supabase.from("posts").update({ like_count: likeCount + (liked ? -1 : 1) }).eq("id", post.id);
  };

  const handleBookmark = async () => {
    if (!user || !post) { router.push("/auth"); return; }
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("bookmarks").insert({ post_id: post.id, user_id: user.id });
    }
    setBookmarked(!bookmarked);
  };

  const handleFollowAuthor = async () => {
    if (!user || !post) { router.push("/auth"); return; }
    if (isFollowingAuthor) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", post.author_id);
      setIsFollowingAuthor(false);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: post.author_id });
      setIsFollowingAuthor(true);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !commentText.trim()) return;
    setSubmitting(true);
    const { data } = await supabase.from("comments")
      .insert({ post_id: post.id, user_id: user.id, content: commentText.trim() })
      .select("*, profiles(full_name, avatar_url, username)").single();
    if (data) {
      setComments([...comments, data as Comment]);
      setCommentText("");
      await supabase.from("posts").update({ comment_count: comments.length + 1 }).eq("id", post.id);
    }
    setSubmitting(false);
  };

  const handleDeletePost = async () => {
    if (!post || !user) return;
    if (!confirm("Delete this story? This cannot be undone.")) return;
    setDeleting(true);
    await supabase.from("posts").delete().eq("id", post.id);
    router.push("/dashboard");
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    setComments(comments.filter((c) => c.id !== commentId));
  };

  if (loading) return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
        <div className="spinner" style={{ width: 32, height: 32, borderColor: "var(--border)", borderTopColor: "var(--ink)", borderWidth: 3 }} />
        <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)" }}>Loading story…</p>
      </div>
    </div>
  );

  if (!post) return null;

  const author = post.profiles as any;
  const cat = CATEGORIES.find((c) => c.id === post.category);
  const isAuthor = user?.id === post.author_id;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      {/* Article header */}
      <div className="article-header">
        <span className="article-category">{cat?.icon} {cat?.label}</span>
        <h1 className="article-title">{post.title}</h1>
        {post.excerpt && <p className="article-subtitle">{post.excerpt}</p>}

        {/* Meta bar */}
        <div className="article-meta">
          <div className="article-author">
            <Link href={`/profile/${author?.username || post.author_id}`} className="article-author-avatar" style={{ textDecoration: "none" }}>
              {author?.avatar_url ? (
                <Image src={author.avatar_url} alt={author.full_name || ""} width={44} height={44} style={{ objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 16, fontWeight: 600, fontFamily: "var(--sans)" }}>{getInitials(author?.full_name)}</span>
              )}
            </Link>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link href={`/profile/${author?.username || post.author_id}`} className="article-author-name" style={{ textDecoration: "none" }}>
                  {author?.full_name || "Writer"}
                </Link>
                {user && user.id !== post.author_id && (
                  <button
                    onClick={handleFollowAuthor}
                    style={{ background: "none", border: "none", color: isFollowingAuthor ? "var(--muted)" : "var(--primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "0 4px" }}
                  >
                    · {isFollowingAuthor ? "Following" : "Follow"}
                  </button>
                )}
              </div>
              <span className="article-author-date">
                {formatDate(post.created_at)} · {post.read_time} min read · {post.view_count} views
              </span>
            </div>
          </div>

          <div className="article-actions">
            <button onClick={handleLike} className={`article-action-btn ${liked ? "liked" : ""}`}>
              <svg width="16" height="16" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {likeCount}
            </button>
            <button onClick={handleBookmark} className={`article-action-btn ${bookmarked ? "bookmarked" : ""}`} title="Bookmark">
              <svg width="16" height="16" fill={bookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </button>
            <div ref={shareRef} style={{ position: "relative" }}>
              <button onClick={() => setShareOpen(!shareOpen)} className="article-action-btn" title="Share story">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a3 3 0 100-6 3 3 0 000 6zm-12 7a3 3 0 100-6 3 3 0 000 6zm12 7a3 3 0 100-6 3 3 0 000 6zm-12-7l8-4.5m-8 4.5l8 4.5" />
                </svg>
              </button>
              {shareOpen && (
                <div className="share-dropdown">
                  <a 
                    href={`https://x.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="share-item"
                    onClick={() => setShareOpen(false)}
                  >
                    Share on X
                  </a>
                  <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="share-item"
                    onClick={() => setShareOpen(false)}
                  >
                    Share on Facebook
                  </a>
                  <a 
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="share-item"
                    onClick={() => setShareOpen(false)}
                  >
                    Share on LinkedIn
                  </a>
                  <button 
                    onClick={handleCopyLink}
                    className="share-item"
                  >
                    {copied ? "Link Copied!" : "Copy Link"}
                  </button>
                </div>
              )}
            </div>
            {isAuthor && (
              <>
                <Link href={`/write/${post.id}`} className="article-action-btn" style={{ textDecoration: "none" }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit
                </Link>
                <button onClick={handleDeletePost} disabled={deleting} className="article-action-btn" style={{ color: "var(--red)", borderColor: "rgba(192,57,43,0.2)" }}>
                  {deleting ? "…" : (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cover image */}
      {post.cover_image && (
        <div className="article-cover">
          <Image src={post.cover_image} alt={post.title} width={900} height={500} style={{ width: "100%", height: "auto", borderRadius: 8 }} />
        </div>
      )}

      {/* Article body */}
      <div className="article-body" dangerouslySetInnerHTML={{ __html: post.content }} />

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 40px", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {post.tags.map((tag) => (
            <span key={tag} className="tag-chip" style={{ fontSize: 13 }}>#{tag}</span>
          ))}
        </div>
      )}

      <div className="divider" style={{ maxWidth: 680, margin: "0 auto 40px" }} />

      {/* Author card */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 60px" }}>
        <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 28 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <Link href={`/profile/${author?.username || post.author_id}`} style={{ textDecoration: "none" }}>
              <div className="article-author-avatar" style={{ width: 60, height: 60, fontSize: 20 }}>
                {author?.avatar_url ? (
                  <Image src={author.avatar_url} alt="" width={60} height={60} style={{ objectFit: "cover" }} />
                ) : (
                  <span style={{ fontFamily: "var(--sans)", fontWeight: 700 }}>{getInitials(author?.full_name)}</span>
                )}
              </div>
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                <Link href={`/profile/${author?.username || post.author_id}`} style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--black)", textDecoration: "none" }}>
                  {author?.full_name || "Writer"}
                </Link>
                {user && user.id !== post.author_id && (
                  <button
                    onClick={handleFollowAuthor}
                    className={`btn btn-sm ${isFollowingAuthor ? "btn-outline" : "btn-primary"}`}
                    style={{ borderRadius: 999 }}
                  >
                    {isFollowingAuthor ? "Following" : "Follow"}
                  </button>
                )}
              </div>
              {author?.bio && <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", marginTop: 6, lineHeight: 1.6 }}>{author.bio}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 80px" }}>
        <h3 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginBottom: 24 }}>
          Responses ({comments.length})
        </h3>

        {user ? (
          <form onSubmit={handleComment} style={{ marginBottom: 32 }}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="What are your thoughts?"
              rows={3}
              style={{ width: "100%", padding: "14px 16px", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "var(--serif)", fontSize: 16, color: "var(--ink)", resize: "vertical", outline: "none", marginBottom: 10, lineHeight: 1.6 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ink-3)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
            <button type="submit" disabled={submitting || !commentText.trim()} className="btn btn-primary btn-sm">
              {submitting ? <div className="spinner" /> : "Respond"}
            </button>
          </form>
        ) : (
          <div style={{ background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 8, padding: 20, marginBottom: 32, textAlign: "center" }}>
            <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", marginBottom: 12 }}>Sign in to leave a response</p>
            <Link href="/auth" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>Sign in</Link>
          </div>
        )}

        {comments.length === 0 ? (
          <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)", fontStyle: "italic" }}>No responses yet. Be the first!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {comments.map((c) => {
              const cAuthor = c.profiles as any;
              return (
                <div key={c.id} style={{ display: "flex", gap: 14 }}>
                  <div className="post-card-author-avatar" style={{ width: 36, height: 36, fontSize: 13, flexShrink: 0 }}>
                    {cAuthor?.avatar_url ? (
                      <Image src={cAuthor.avatar_url} alt="" width={36} height={36} style={{ objectFit: "cover" }} />
                    ) : (
                      <span>{getInitials(cAuthor?.full_name)}</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{cAuthor?.full_name || "Writer"}</span>
                      <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>{formatDate(c.created_at)}</span>
                      {user?.id === c.user_id && (
                        <button onClick={() => handleDeleteComment(c.id)}
                          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--muted-2)", fontSize: 12, padding: "2px 8px", borderRadius: 4 }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--red)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-2)"; }}>
                          Delete
                        </button>
                      )}
                    </div>
                    <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--ink-2)", lineHeight: 1.65 }}>{c.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)", padding: "60px 24px" }}>
          <div style={{ maxWidth: 1192, margin: "0 auto" }}>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--black)", marginBottom: 24 }}>
              More from {cat?.label}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
              {related.map((r) => {
                const rAuthor = r.profiles as any;
                return (
                  <Link key={r.id} href={`/post/${r.slug}`} style={{ textDecoration: "none", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", display: "block", transition: "box-shadow 0.2s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--shadow-md)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none"; }}>
                    {r.cover_image && (
                      <Image src={r.cover_image} alt={r.title} width={280} height={160} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                    )}
                    <div style={{ padding: 16 }}>
                      <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)", marginBottom: 6 }}>{rAuthor?.full_name}</div>
                      <h4 style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--black)", lineHeight: 1.3 }} className="truncate-2">{r.title}</h4>
                      <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)", marginTop: 8 }}>{r.read_time} min read</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
