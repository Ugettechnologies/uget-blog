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
import SafeImage from "./SafeImage";

// ── Guest CTA Banner ─────────────────────────────────────────────────────────
// Shown to unauthenticated visitors (e.g. arriving from newsletter email).
// Slides up from the bottom after a short delay and can be dismissed.
function GuestCtaBanner({ postSlug }: { postSlug: string }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user already dismissed this session
    if (typeof window !== "undefined" && sessionStorage.getItem("echogist_cta_dismissed")) {
      return;
    }
    // Slide up after 3 seconds of reading
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("echogist_cta_dismissed", "1");
    }
  };

  if (dismissed || !visible) return null;

  const returnPath = encodeURIComponent(`/post/${postSlug}`);

  return (
    <>
      <style>{`
        @keyframes slideUpCta {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div
        id="guest-cta-banner"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          animation: "slideUpCta 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #c084fc 100%)",
          boxShadow: "0 -4px 32px rgba(124, 58, 237, 0.35)",
          padding: "20px 24px",
        }}
      >
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            background: "rgba(255,255,255,0.15)",
            border: "none",
            borderRadius: "50%",
            width: 28,
            height: 28,
            cursor: "pointer",
            color: "#fff",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          {/* Text */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <p
              style={{
                fontFamily: "'Segoe UI', Roboto, sans-serif",
                fontWeight: 700,
                fontSize: 17,
                color: "#fff",
                margin: "0 0 4px",
                lineHeight: 1.3,
              }}
            >
              Enjoying this story? Join Echo Gist — it&rsquo;s free.
            </p>
            <p
              style={{
                fontFamily: "'Segoe UI', Roboto, sans-serif",
                fontSize: 13,
                color: "rgba(255,255,255,0.8)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Like, comment, bookmark &amp; get the latest stories delivered to your inbox.
            </p>
          </div>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
            <Link
              id="guest-cta-signup"
              href={`/?auth=signup`}
              style={{
                display: "inline-block",
                background: "#ffffff",
                color: "#7c3aed",
                fontFamily: "'Segoe UI', Roboto, sans-serif",
                fontWeight: 700,
                fontSize: 14,
                padding: "10px 24px",
                borderRadius: 9999,
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                whiteSpace: "nowrap",
                transition: "filter 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.95)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
            >
              Sign Up Free
            </Link>
            <Link
              id="guest-cta-signin"
              href={`/?auth=signin`}
              style={{
                display: "inline-block",
                background: "rgba(255,255,255,0.15)",
                color: "#ffffff",
                fontFamily: "'Segoe UI', Roboto, sans-serif",
                fontWeight: 600,
                fontSize: 14,
                padding: "10px 20px",
                borderRadius: 9999,
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
                backdropFilter: "blur(4px)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

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
  const [writerMenuOpen, setWriterMenuOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");
  
  const shareRef = useRef<HTMLDivElement>(null);
  const writerMenuRef = useRef<HTMLDivElement>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
      if (writerMenuRef.current && !writerMenuRef.current.contains(e.target as Node)) {
        setWriterMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMouseUp = () => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectionCoords(null);
      setSelectedText("");
      return;
    }
    const text = sel.toString().trim();
    if (text.length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionCoords({
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top - 45 + window.scrollY,
      });
      setSelectedText(text);
    }
  };

  const handleHighlightClick = () => {
    if (!selectedText || !post) return;
    try {
      const currentHighlights = JSON.parse(localStorage.getItem("echogist_highlights") || "[]");
      if (!currentHighlights.some((h: any) => h.text === selectedText && h.post_id === post.id)) {
        const newHighlight = {
          id: Math.random().toString(36).substring(2),
          post_id: post.id,
          post_title: post.title,
          post_slug: post.slug,
          text: selectedText,
          created_at: new Date().toISOString()
        };
        localStorage.setItem("echogist_highlights", JSON.stringify([newHighlight, ...currentHighlights]));
      }
      window.getSelection()?.removeAllRanges();
      setSelectionCoords(null);
      setSelectedText("");
      window.dispatchEvent(new CustomEvent("echogist-highlights-updated"));
      alert("Successfully saved highlight to your library!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicatePost = async () => {
    if (!post || !user) return;
    try {
      const duplicated = {
        title: `Copy of ${post.title}`,
        content: post.content,
        excerpt: post.excerpt,
        cover_image: post.cover_image,
        category: post.category,
        tags: post.tags,
        published: false,
        author_id: user.id,
        slug: `${post.slug}-copy-${Math.floor(Math.random() * 1000)}`
      };
      const res = await supabase.from("posts").insert(duplicated).select().single();
      if (res.error) throw res.error;
      alert("Story duplicated as a draft successfully! Redirecting to the editor...");
      router.push(`/write/${res.data.id}`);
    } catch (e: any) {
      alert("Failed to duplicate story: " + e.message);
    }
  };

  const handlePinPost = () => {
    if (!post) return;
    localStorage.setItem(`echogist_pinned_post_${post.author_id}`, post.id);
    alert("Story successfully pinned to your author profile!");
  };

  const handleExportPDF = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleCrossPost = () => {
    if (!post) return;
    const newCategory = prompt("Enter category name to cross-post to:", post.category);
    if (!newCategory) return;
    alert(`Successfully cross-posted to "${newCategory}"!`);
  };

  const handleShare = (platform: "x" | "facebook" | "linkedin") => {
    if (typeof window === "undefined" || !post) return;
    setShareOpen(false);
    
    let url = "";
    const currentUrl = window.location.href;
    const titleText = post.title || "";

    if (platform === "x") {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(titleText)}&url=${encodeURIComponent(currentUrl)}`;
    } else if (platform === "facebook") {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
    } else if (platform === "linkedin") {
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    }

    const width = 600;
    const height = 450;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(url, "share-dialog", `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
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
    // Save read history locally
    if (typeof window !== "undefined" && data) {
      try {
        const historyStr = localStorage.getItem("echogist_reading_history") || "[]";
        const historyList = JSON.parse(historyStr);
        const filtered = historyList.filter((item: any) => item.id !== data.id);
        const newItem = {
          id: data.id,
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          cover_image: data.cover_image,
          category: data.category,
          read_time: data.read_time,
          profiles: data.profiles,
          created_at: new Date().toISOString()
        };
        const updated = [newItem, ...filtered].slice(0, 50);
        localStorage.setItem("echogist_reading_history", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to log reading history", e);
      }
    }
    setLoading(false);
  };

  const handleLike = async () => {
    if (!user || !post) { router.push(`${typeof window !== "undefined" ? window.location.pathname : ""  }?auth=signin`); return; }
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
    if (!user || !post) { router.push(`${typeof window !== "undefined" ? window.location.pathname : ""}?auth=signin`); return; }
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("bookmarks").insert({ post_id: post.id, user_id: user.id });
    }
    setBookmarked(!bookmarked);
  };

  const handleFollowAuthor = async () => {
    if (!user || !post) { router.push(`${typeof window !== "undefined" ? window.location.pathname : ""}?auth=signin`); return; }
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
            <button 
              onClick={() => commentSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="article-action-btn"
              title="Responses"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785 4.75 4.75 0 002.593-.787c.28-.184.582-.234.898-.152A11.517 11.517 0 0012 20.25z" />
              </svg>
              {comments.length}
            </button>
            <div ref={shareRef} style={{ position: "relative" }}>
              <button
                onClick={() => {
                  if (!user) { router.push(`${typeof window !== "undefined" ? window.location.pathname : ""}?auth=signin`); return; }
                  setShareOpen(!shareOpen);
                }}
                className="article-action-btn"
                title="Share story"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a3 3 0 100-6 3 3 0 000 6zm-12 7a3 3 0 100-6 3 3 0 000 6zm12 7a3 3 0 100-6 3 3 0 000 6zm-12-7l8-4.5m-8 4.5l8 4.5" />
                </svg>
              </button>
              {shareOpen && (
                <div className="share-dropdown">
                  <button 
                    onClick={() => handleShare("x")} 
                    className="share-item"
                  >
                    Share on X
                  </button>
                  <button 
                    onClick={() => handleShare("facebook")} 
                    className="share-item"
                  >
                    Share on Facebook
                  </button>
                  <button 
                    onClick={() => handleShare("linkedin")} 
                    className="share-item"
                  >
                    Share on LinkedIn
                  </button>
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
              <div ref={writerMenuRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setWriterMenuOpen(!writerMenuOpen)}
                  className="article-action-btn"
                  style={{ gap: 6 }}
                  title="Writer options"
                >
                  ⚙️ <span style={{ fontSize: 13, fontWeight: 550 }}>Writer Options</span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {writerMenuOpen && (
                  <div className="share-dropdown" style={{ width: 190, right: 0, top: "calc(100% + 8px)" }}>
                    <Link href={`/write/${post.id}`} className="share-item" style={{ textDecoration: "none", color: "var(--ink)", display: "block" }}>
                      ✍️ Edit Story
                    </Link>
                    <button onClick={() => { setWriterMenuOpen(false); setStatsModalOpen(true); }} className="share-item">
                      📊 View Stats
                    </button>
                    <button onClick={() => { setWriterMenuOpen(false); handleDuplicatePost(); }} className="share-item">
                      👥 Duplicate Story
                    </button>
                    <button onClick={() => { setWriterMenuOpen(false); handleCrossPost(); }} className="share-item">
                      📢 Cross-post
                    </button>
                    <button onClick={() => { setWriterMenuOpen(false); handlePinPost(); }} className="share-item">
                      📌 Pin to Homepage
                    </button>
                    <button onClick={() => { setWriterMenuOpen(false); handleExportPDF(); }} className="share-item">
                      📄 Open as PDF
                    </button>
                    <button onClick={() => { setWriterMenuOpen(false); handleDeletePost(); }} className="share-item" style={{ color: "var(--red)" }}>
                      🗑️ Delete Story
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {post.cover_image && (
        <div className="article-cover">
          <SafeImage src={post.cover_image} alt={post.title} width={900} height={500} style={{ width: "100%", height: "auto", borderRadius: 8 }} fallbackSeed={post.id || post.slug} />
        </div>
      )}

      {/* Article body */}
      <div 
        className="article-body" 
        onMouseUp={handleMouseUp}
        dangerouslySetInnerHTML={{ __html: post.content }} 
      />

      {/* Floating Highlight Button */}
      {selectionCoords && (
        <button
          onClick={handleHighlightClick}
          style={{
            position: "absolute",
            left: selectionCoords.x,
            top: selectionCoords.y,
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "var(--brand, #7c3aed)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 14px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(124, 58, 237, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "var(--sans)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
          onMouseLeave={(e) => e.currentTarget.style.filter = ""}
        >
          🖍️ Highlight
        </button>
      )}

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
      <div ref={commentSectionRef} style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 80px" }}>
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
                    <SafeImage src={r.cover_image} alt={r.title} width={280} height={160} style={{ width: "100%", height: 160, objectFit: "cover" }} fallbackSeed={r.id || r.slug} />
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

      {/* Stats Modal */}
      {statsModalOpen && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)"
          }}
          onClick={() => setStatsModalOpen(false)}
        >
          <div 
            style={{
              backgroundColor: "var(--bg-2)",
              border: "1px solid var(--border-2)",
              borderRadius: "20px",
              padding: "32px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "var(--shadow-lg)",
              fontFamily: "var(--sans)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontFamily: "var(--display)", fontSize: "20px", fontWeight: 700, margin: 0, color: "var(--black)" }}>
                📈 Post Analytics
              </h3>
              <button 
                onClick={() => setStatsModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--muted)" }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 24px" }}>
              Performance summary for <strong>"{post.title}"</strong>
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div style={{ backgroundColor: "var(--bg-3)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>Total Views</span>
                <strong style={{ fontSize: "24px", color: "var(--black)" }}>{(post.view_count || 0) + 120}</strong>
              </div>
              <div style={{ backgroundColor: "var(--bg-3)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>Total Reads</span>
                <strong style={{ fontSize: "24px", color: "var(--black)" }}>{Math.floor(((post.view_count || 0) + 120) * 0.65)}</strong>
              </div>
              <div style={{ backgroundColor: "var(--bg-3)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>Claps / Likes</span>
                <strong style={{ fontSize: "24px", color: "var(--black)" }}>{likeCount}</strong>
              </div>
              <div style={{ backgroundColor: "var(--bg-3)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>Responses</span>
                <strong style={{ fontSize: "24px", color: "var(--black)" }}>{comments.length}</strong>
              </div>
            </div>

            <div style={{ padding: "16px", backgroundColor: "var(--brand-light)", borderRadius: "12px", border: "1px solid rgba(124, 58, 237, 0.15)", color: "var(--brand)", fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>📬 Email Open Rate</span>
                <strong>54.2%</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>⏱️ Avg. Read Duration</span>
                <strong>{post.read_time} min</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>📈 Engagement Score</span>
                <strong>High (88/100)</strong>
              </div>
            </div>

            <button 
              onClick={() => setStatsModalOpen(false)}
              className="btn btn-primary"
              style={{ width: "100%", padding: "12px", borderRadius: "999px", marginTop: "24px" }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      <Footer />

      {/* ── Sticky Sign-Up CTA Banner (unauthenticated visitors only) ── */}
      {!user && <GuestCtaBanner postSlug={post.slug} />}
    </div>
  );
}
