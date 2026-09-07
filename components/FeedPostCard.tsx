"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/db-client/client";
import type { Post } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials, formatViews } from "@/lib/types";
import SafeImage from "./SafeImage";

interface FeedPostCardProps {
  post: Post;
  currentUser?: any;
  currentUserProfile?: any;
  isInitiallyLiked?: boolean;
  isInitiallyBookmarked?: boolean;
  isInitiallyFollowing?: boolean;
  onFollowToggle?: (authorId: string, willFollow: boolean) => void;
}

export default function FeedPostCard({
  post,
  currentUser,
  currentUserProfile,
  isInitiallyLiked = false,
  isInitiallyBookmarked = false,
  isInitiallyFollowing = false,
  onFollowToggle
}: FeedPostCardProps) {
  const router = useRouter();
  const supabase = createClient();
  const optionsRef = useRef<HTMLDivElement>(null);

  const [liked, setLiked] = useState(isInitiallyLiked);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [bookmarked, setBookmarked] = useState(isInitiallyBookmarked);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(() => {
    // Check if user previously restacked locally
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem("echogist_restacks") || "[]");
        if (saved.includes(post.id)) return 1;
      } catch {}
    }
    return Math.floor((post.view_count || 0) * 0.04);
  });
  const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setLiked(isInitiallyLiked);
  }, [isInitiallyLiked]);

  useEffect(() => {
    setBookmarked(isInitiallyBookmarked);
  }, [isInitiallyBookmarked]);

  useEffect(() => {
    setIsFollowing(isInitiallyFollowing);
  }, [isInitiallyFollowing]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem("echogist_restacks") || "[]");
        if (saved.includes(post.id)) {
          setReposted(true);
        }
      } catch {}
    }
  }, [post.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  const authorName = (post.profiles as any)?.full_name || "EchoGist Writer";
  const authorAvatar = (post.profiles as any)?.avatar_url;
  const authorUsername = (post.profiles as any)?.username || post.author_id;
  const isAuthor = currentUser?.id === post.author_id;
  const cat = CATEGORIES.find((c) => c.id === post.category);

  // ── Like Handler ─────────────────────────────────────────────────────────────
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      router.push(`/?auth=signin`);
      return;
    }

    const nextLiked = !liked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    setLiked(nextLiked);
    setLikeCount(nextCount);

    try {
      if (nextLiked) {
        await supabase.from("likes").insert({ post_id: post.id, user_id: currentUser.id });
        if (post.author_id && post.author_id !== currentUser.id) {
          await supabase.from("notifications").insert({
            user_id: post.author_id,
            actor_id: currentUser.id,
            post_id: post.id,
            type: "like",
            content: "liked your story"
          });
        }
      } else {
        await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", currentUser.id);
      }
      await supabase.from("posts").update({ like_count: nextCount }).eq("id", post.id);
    } catch (err) {
      console.error("Failed to update like status", err);
    }
  };

  // ── Restack / Repost Handler ────────────────────────────────────────────────
  const handleRestack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      router.push(`/?auth=signin`);
      return;
    }

    const nextReposted = !reposted;
    const nextCount = nextReposted ? repostCount + 1 : Math.max(0, repostCount - 1);
    setReposted(nextReposted);
    setRepostCount(nextCount);

    try {
      if (typeof window !== "undefined") {
        const saved = JSON.parse(localStorage.getItem("echogist_restacks") || "[]");
        if (nextReposted) {
          if (!saved.includes(post.id)) saved.push(post.id);
          showToast("Restacked to your feed! 🔁");
          if (post.author_id && post.author_id !== currentUser.id) {
            supabase.from("notifications").insert({
              user_id: post.author_id,
              actor_id: currentUser.id,
              post_id: post.id,
              type: "post",
              content: "restacked your story"
            }).then().catch(() => {});
          }
        } else {
          const filtered = saved.filter((id: string) => id !== post.id);
          localStorage.setItem("echogist_restacks", JSON.stringify(filtered));
          showToast("Restack removed");
          return;
        }
        localStorage.setItem("echogist_restacks", JSON.stringify(saved));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Bookmark Handler ────────────────────────────────────────────────────────
  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      router.push(`/?auth=signin`);
      return;
    }

    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);

    try {
      if (nextBookmarked) {
        await supabase.from("bookmarks").insert({ post_id: post.id, user_id: currentUser.id });
        showToast("Saved to your Library! 🔖");
      } else {
        await supabase.from("bookmarks").delete().eq("post_id", post.id).eq("user_id", currentUser.id);
        showToast("Removed from Library");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Share Handler ───────────────────────────────────────────────────────────
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/post/${post.slug}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard! 📋");
      }
    }
  };

  // ── Follow Author Handler ───────────────────────────────────────────────────
  const handleFollowAuthor = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      router.push(`/?auth=signin`);
      return;
    }

    const willFollow = !isFollowing;
    setIsFollowing(willFollow);

    if (onFollowToggle) {
      onFollowToggle(post.author_id, willFollow);
    } else {
      try {
        if (willFollow) {
          await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: post.author_id });
          showToast(`Subscribed to ${authorName}!`);
        } else {
          await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", post.author_id);
          showToast(`Unsubscribed from ${authorName}`);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <article className="substack-post-card">
      {/* Toast popup */}
      {toastMsg && (
        <div className="substack-toast">
          {toastMsg}
        </div>
      )}

      {/* Top Author Row */}
      <div className="substack-post-header">
        <div className="substack-author-info">
          <Link href={`/profile/${authorUsername}`} className="substack-avatar" onClick={(e) => e.stopPropagation()}>
            {authorAvatar ? (
              <SafeImage src={authorAvatar} alt={authorName} width={38} height={38} className="substack-avatar-img" />
            ) : (
              <div className="substack-avatar-fallback">
                {getInitials(authorName)}
              </div>
            )}
          </Link>

          <div className="substack-author-meta">
            <div className="substack-name-row">
              <Link href={`/profile/${authorUsername}`} className="substack-author-name" onClick={(e) => e.stopPropagation()}>
                {authorName}
              </Link>
              <span className="substack-dot">·</span>
              <span className="substack-date">{formatDate(post.created_at)}</span>
            </div>
            {cat && (
              <span className="substack-cat-badge">
                {cat.icon || "🏷️"} {cat.label}
              </span>
            )}
          </div>
        </div>

        {/* Subscribe / Follow button & Options */}
        <div className="substack-header-actions" ref={optionsRef}>
          {!isAuthor && (
            <button
              onClick={handleFollowAuthor}
              className={`substack-subscribe-btn ${isFollowing ? "following" : ""}`}
              aria-label={isFollowing ? "Subscribed" : "Subscribe"}
            >
              {isFollowing ? "Subscribed" : "Subscribe"}
            </button>
          )}

          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOptionsOpen(!optionsOpen);
              }}
              className="substack-more-btn"
              title="More options"
              aria-label="More options"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>

            {optionsOpen && (
              <div className="substack-dropdown-menu">
                <button
                  onClick={(e) => {
                    handleShare(e);
                    setOptionsOpen(false);
                  }}
                  className="substack-dropdown-item"
                >
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy story link
                </button>
                <button
                  onClick={(e) => {
                    handleBookmark(e);
                    setOptionsOpen(false);
                  }}
                  className="substack-dropdown-item"
                >
                  <svg width="15" height="15" fill={bookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  {bookmarked ? "Remove bookmark" : "Bookmark story"}
                </button>
                {isAuthor && (
                  <Link
                    href={`/write/${post.id}`}
                    className="substack-dropdown-item"
                    onClick={() => setOptionsOpen(false)}
                  >
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Edit story
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Post Body */}
      <Link href={`/post/${post.slug}`} className="substack-post-body" style={{ textDecoration: "none" }}>
        <div className="substack-body-text">
          <h3 className="substack-post-title">{post.title}</h3>
          {post.excerpt && (
            <p className="substack-post-excerpt">
              {post.excerpt}
            </p>
          )}
        </div>

        {post.cover_image && (
          <div className="substack-cover-wrap">
            <SafeImage
              src={post.cover_image}
              alt={post.title}
              fill
              className="substack-cover-img"
              fallbackSeed={post.id || post.slug}
            />
          </div>
        )}
      </Link>

      {/* Substack Interactive Bottom Action Bar */}
      <div className="substack-action-bar">
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`substack-action-btn like-btn ${liked ? "active" : ""}`}
          title={liked ? "Unlike" : "Like"}
          aria-label={`${likeCount} likes`}
        >
          <span className="substack-icon-wrap">
            {liked ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            ) : (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            )}
          </span>
          <span className="substack-count">{formatViews(likeCount)}</span>
        </button>

        {/* Comment Button */}
        <Link
          href={`/post/${post.slug}#comments`}
          className="substack-action-btn comment-btn"
          title="Comments"
          aria-label={`${post.comment_count || 0} comments`}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="substack-icon-wrap">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.606 1.077.472 1.685l-.545 2.455a.75.75 0 00.916.892l2.875-.767a1.5 1.5 0 011.009.079A9.155 9.155 0 0012 20.25z" />
            </svg>
          </span>
          <span className="substack-count">{formatViews(post.comment_count || 0)}</span>
        </Link>

        {/* Restack / Repost Button */}
        <button
          onClick={handleRestack}
          className={`substack-action-btn restack-btn ${reposted ? "active" : ""}`}
          title={reposted ? "Undo restack" : "Restack"}
          aria-label={`${repostCount} restacks`}
        >
          <span className="substack-icon-wrap">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M4.5 12l3 3m-3-3l3-3m15 0l-3-3m3 3l-3 3" />
            </svg>
          </span>
          <span className="substack-count">{formatViews(repostCount)}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="substack-action-btn share-btn"
          title="Share story"
          aria-label="Share"
        >
          <span className="substack-icon-wrap">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </span>
        </button>

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className={`substack-action-btn bookmark-btn ${bookmarked ? "active" : ""}`}
          title={bookmarked ? "Saved" : "Save story"}
          aria-label="Save story"
        >
          <span className="substack-icon-wrap">
            {bookmarked ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="var(--brand)" stroke="var(--brand)" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            ) : (
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            )}
          </span>
        </button>
      </div>

      <style jsx>{`
        .substack-post-card {
          padding: 24px 0 20px;
          border-bottom: 1px solid var(--border-2);
          position: relative;
          transition: background-color 0.2s ease;
        }
        .substack-toast {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: #18181b;
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 999px;
          font-family: var(--sans);
          font-size: 12px;
          font-weight: 600;
          z-index: 50;
          box-shadow: 0 4px 14px rgba(0,0,0,0.2);
          animation: fadeInDown 0.2s ease;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .substack-post-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .substack-author-info {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .substack-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          background: var(--bg-3);
          display: block;
        }
        .substack-avatar-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--sans);
          font-weight: 700;
          font-size: 13px;
          background: var(--brand-light);
          color: var(--brand);
        }
        .substack-author-meta {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .substack-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--sans);
          font-size: 14px;
        }
        .substack-author-name {
          font-weight: 700;
          color: var(--black);
          text-decoration: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .substack-author-name:hover {
          text-decoration: underline;
        }
        .substack-dot {
          color: var(--muted-2);
          font-size: 12px;
        }
        .substack-date {
          color: var(--muted);
          font-size: 12.5px;
          white-space: nowrap;
        }
        .substack-cat-badge {
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 600;
          color: var(--muted-2);
        }
        .substack-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .substack-subscribe-btn {
          font-family: var(--sans);
          font-size: 13px;
          font-weight: 700;
          color: #ea580c;
          background: rgba(234, 88, 12, 0.08);
          border: 1px solid rgba(234, 88, 12, 0.2);
          padding: 5px 14px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .substack-subscribe-btn:hover {
          background: rgba(234, 88, 12, 0.15);
          transform: translateY(-1px);
        }
        .substack-subscribe-btn.following {
          color: var(--muted);
          background: var(--bg-3);
          border-color: var(--border-2);
          font-weight: 600;
        }
        .substack-subscribe-btn.following:hover {
          color: var(--ink);
          background: var(--bg-2);
        }
        .substack-more-btn {
          color: var(--muted);
          padding: 6px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .substack-more-btn:hover {
          background: var(--bg-3);
          color: var(--black);
        }
        .substack-dropdown-menu {
          position: absolute;
          right: 0;
          top: 32px;
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 10px 28px rgba(0,0,0,0.18);
          min-width: 170px;
          padding: 6px;
          z-index: 60;
        }
        .substack-dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          font-family: var(--sans);
          font-size: 13px;
          font-weight: 500;
          color: var(--ink);
          background: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .substack-dropdown-item:hover {
          background: var(--bg-3);
        }
        .substack-post-body {
          display: flex;
          gap: 20px;
          margin-bottom: 12px;
          cursor: pointer;
        }
        .substack-body-text {
          flex: 1;
          min-width: 0;
        }
        .substack-post-title {
          font-family: var(--display);
          font-size: 18px;
          font-weight: 800;
          line-height: 1.35;
          color: var(--black);
          margin: 0 0 6px 0;
          transition: color 0.15s ease;
        }
        .substack-post-body:hover .substack-post-title {
          color: var(--brand);
        }
        .substack-post-excerpt {
          font-family: var(--serif);
          font-size: 14.5px;
          line-height: 1.55;
          color: var(--muted);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .substack-cover-wrap {
          position: relative;
          width: 110px;
          height: 80px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          background: var(--bg-3);
          border: 1px solid var(--border-2);
        }
        .substack-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 440px;
          padding-top: 4px;
        }
        .substack-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          border-radius: 999px;
          color: var(--muted);
          background: transparent;
          font-family: var(--sans);
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .substack-action-btn:hover {
          color: var(--black);
          background: var(--bg-3);
        }
        .substack-action-btn.like-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }
        .substack-action-btn.like-btn.active {
          color: #ef4444;
          font-weight: 700;
        }
        .substack-action-btn.comment-btn:hover {
          color: var(--brand);
          background: var(--brand-light);
        }
        .substack-action-btn.restack-btn:hover {
          color: #10b981;
          background: rgba(16, 185, 129, 0.08);
        }
        .substack-action-btn.restack-btn.active {
          color: #10b981;
          font-weight: 700;
        }
        .substack-action-btn.share-btn:hover {
          color: var(--brand);
          background: var(--brand-light);
        }
        .substack-action-btn.bookmark-btn.active {
          color: var(--brand);
        }
        .substack-count {
          line-height: 1;
        }

        @media (max-width: 640px) {
          .substack-post-card {
            padding: 18px 0 16px;
          }
          .substack-post-title {
            font-size: 16.5px;
          }
          .substack-cover-wrap {
            width: 84px;
            height: 64px;
          }
          .substack-action-bar {
            max-width: 100%;
          }
          .substack-action-btn {
            padding: 6px 6px;
            font-size: 12px;
          }
        }
      `}</style>
    </article>
  );
}
