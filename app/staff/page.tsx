"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/db-client/client";
import type { Post, Profile } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";
import SafeImage from "@/components/SafeImage";

export default function StaffPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [staffProfile, setStaffProfile] = useState<Profile | null>(null);
  const [staffMembers, setStaffMembers] = useState<Profile[]>([]);
  const [staffPosts, setStaffPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "team" | "guidelines">("posts");
  
  const supabase = createClient();

  useEffect(() => {
    // Load current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
        supabase.from("profiles").select("*").eq("id", user.id).single()
          .then(({ data }) => {
            setCurrentUserProfile(data as Profile);
            // Check follow state for EchoGist Staff
            supabase.from("follows")
              .select("id")
              .eq("follower_id", user.id)
              .eq("following_id", "c0de57af-f011-0e5a-ff55-c0de57aff555")
              .single()
              .then(({ data: followRes }) => {
                setIsFollowing(!!followRes);
              });
          });
      }
    });

    loadStaffData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPrivileged = currentUserProfile?.role === "admin" || currentUserProfile?.role === "staff";

  // Tab guard for non-privileged users
  useEffect(() => {
    if (activeTab === "team" && !loading && !isPrivileged) {
      setActiveTab("posts");
    }
  }, [activeTab, isPrivileged, loading]);

  const loadStaffData = async () => {
    setLoading(true);
    try {
      // 1. Fetch EchoGist Staff profile
      const { data: staffProf } = await supabase.from("profiles")
        .select("*")
        .eq("id", "c0de57af-f011-0e5a-ff55-c0de57aff555")
        .single();
      if (staffProf) {
        setStaffProfile(staffProf as Profile);
      }

      // 2. Fetch all profiles (we will filter for admin & staff on client side)
      const { data: profiles } = await supabase.from("profiles").select("*");
      const filteredStaff = (profiles || []).filter(
        (p: any) => p.role === "staff" || p.role === "admin"
      );
      setStaffMembers(filteredStaff as Profile[]);

      // 3. Fetch all posts (including posts authored by EchoGist Staff)
      const { data: posts } = await supabase.from("posts")
        .select("*, profiles(full_name, avatar_url, username, role)")
        .eq("published", true)
        .order("created_at", { ascending: false });

      const filteredPosts = (posts || []).filter(
        (p: any) => p.profiles?.role === "staff" || p.profiles?.role === "admin" || p.author_id === "c0de57af-f011-0e5a-ff55-c0de57aff555"
      );
      setStaffPosts(filteredPosts as Post[]);
    } catch (err) {
      console.error("Error loading staff data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      window.location.href = "/auth";
      return;
    }
    if (!staffProfile) return;

    if (isFollowing) {
      await supabase.from("follows")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", "c0de57af-f011-0e5a-ff55-c0de57aff555");
      
      setIsFollowing(false);
      
      // Update local state and follower_count in profiles table
      const newCount = Math.max((staffProfile.follower_count || 0) - 1, 0);
      setStaffProfile({ ...staffProfile, follower_count: newCount });
      await supabase.from("profiles").update({ follower_count: newCount }).eq("id", "c0de57af-f011-0e5a-ff55-c0de57aff555");
    } else {
      await supabase.from("follows")
        .insert({
          follower_id: currentUser.id,
          following_id: "c0de57af-f011-0e5a-ff55-c0de57aff555"
        });
      
      setIsFollowing(true);
      
      // Update local state and follower_count in profiles table
      const newCount = (staffProfile.follower_count || 0) + 1;
      setStaffProfile({ ...staffProfile, follower_count: newCount });
      await supabase.from("profiles").update({ follower_count: newCount }).eq("id", "c0de57af-f011-0e5a-ff55-c0de57aff555");
    }
  };

  const isAdmin = currentUserProfile?.role === "admin";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--ink)" }}>
      <Navbar />

      <main style={{ maxWidth: 1040, margin: "64px auto 80px", padding: "40px 24px" }}>
        {/* Verified Publication Header */}
        <div style={{
          display: "flex",
          gap: 28,
          alignItems: "center",
          borderBottom: "1px solid var(--border-2)",
          paddingBottom: 40,
          marginBottom: 32,
          flexWrap: "wrap"
        }}>
          {/* Circular logo */}
          <div style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            backgroundColor: "#191919",
            color: "white",
            fontFamily: "var(--display)",
            fontSize: 36,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--border)",
            flexShrink: 0
          }}>
            U
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
              <h1 style={{
                fontFamily: "var(--display)",
                fontSize: 32,
                fontWeight: 700,
                color: "var(--black)",
                margin: 0,
                letterSpacing: "-0.025em"
              }}>
                EchoGist Staff
              </h1>
              {/* Verified Badge */}
              <span 
                style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  backgroundColor: "rgba(26,137,23,0.1)", 
                  color: "#1a8917", 
                  borderRadius: "50%", 
                  width: 22, 
                  height: 22, 
                  fontSize: 12,
                  fontWeight: "bold",
                  border: "1px solid rgba(26,137,23,0.2)"
                }}
                title="Verified Publication"
              >
                ✓
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", fontWeight: 500 }}>
                {staffProfile ? `${staffProfile.follower_count || 0} followers` : "Loading followers…"}
              </span>
              
              {/* Follow Button */}
              <button
                onClick={handleFollow}
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: isFollowing ? "var(--muted)" : "white",
                  backgroundColor: isFollowing ? "transparent" : "#1a8917",
                  border: isFollowing ? "1px solid var(--border)" : "none",
                  padding: "6px 18px",
                  borderRadius: 999,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>

              {isAdmin && (
                <Link 
                  href="/admin?tab=staff" 
                  style={{
                    fontFamily: "var(--sans)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--brand)",
                    textDecoration: "none",
                    border: "1px solid rgba(124,58,237,0.3)",
                    padding: "5px 16px",
                    borderRadius: 999,
                    transition: "all 0.2s"
                  }}
                  className="hover:bg-brand-light"
                >
                  🛡️ Manage Staff
                </Link>
              )}
            </div>

            <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              Official account for news, announcements, and hand-picked stories from the EchoGist Editorial Team.
            </p>
          </div>
        </div>

        {/* Tab Switcher Navigation */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid var(--border-2)",
          marginBottom: 32,
          gap: 24
        }}>
          {[
            { id: "posts", label: "Announcements & Picks", count: staffPosts.length },
            ...(isPrivileged ? [{ id: "team", label: "Editorial Directory", count: staffMembers.length }] : []),
            { id: "guidelines", label: "Writer Guidelines", count: null }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                fontFamily: "var(--sans)",
                fontSize: 14,
                fontWeight: activeTab === t.id ? 700 : 500,
                color: activeTab === t.id ? "var(--black)" : "var(--muted)",
                border: "none",
                background: "none",
                padding: "12px 4px 16px",
                cursor: "pointer",
                position: "relative",
                transition: "color 0.2s"
              }}
            >
              {t.label}
              {t.count !== null && (
                <span style={{ 
                  marginLeft: 6, 
                  fontSize: 11, 
                  background: activeTab === t.id ? "var(--bg-3)" : "var(--bg-2)", 
                  padding: "1px 6px", 
                  borderRadius: 99, 
                  fontWeight: 600 
                }}>
                  {t.count}
                </span>
              )}
              {activeTab === t.id && (
                <div style={{
                  position: "absolute",
                  bottom: -1,
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: "var(--black)"
                }} />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", flexDirection: "column", gap: 16 }}>
            <div className="spinner" style={{ width: 36, height: 36, borderColor: "var(--border)", borderTopColor: "var(--ink)", borderWidth: 3 }} />
            <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)" }}>Loading staff panel…</p>
          </div>
        ) : (
          <div>
            {/* ─── ANNOUNCEMENTS & PICKS TAB ─── */}
            {activeTab === "posts" && (
              <div style={{ maxWidth: 760, margin: "0 auto" }}>
                {staffPosts.length === 0 ? (
                  <div style={{ padding: "60px 24px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: 12 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>✍️</div>
                    <h4 style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 600 }}>No announcements yet</h4>
                    <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)" }}>Check back later for staff pick stories and updates.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {staffPosts.map((post) => {
                      const author = post.profiles as any;
                      const cat = CATEGORIES.find((c) => c.id === post.category);
                      return (
                        <article key={post.id} style={{ 
                          display: "flex", 
                          gap: 32, 
                          alignItems: "flex-start", 
                          padding: "32px 0",
                          borderBottom: "1px solid var(--border-2)"
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", overflow: "hidden", justifyContent: "center" }}>
                                {author?.avatar_url ? <Image src={author.avatar_url} alt="" width={22} height={22} style={{ objectFit: "cover" }} /> : getInitials(author?.full_name)}
                              </div>
                              <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "var(--black)" }}>{author?.full_name || "EchoGist Staff"}</span>
                              <span style={{ 
                                fontFamily: "var(--sans)", 
                                fontSize: 9, 
                                fontWeight: 700, 
                                background: author?.role === "admin" ? "rgba(239,68,68,0.08)" : "rgba(26,137,23,0.08)", 
                                color: author?.role === "admin" ? "#ef4444" : "#1a8917",
                                padding: "2px 6px", 
                                borderRadius: 4 
                              }}>
                                {author?.role === "admin" ? "ADMIN" : "STAFF"}
                              </span>
                              <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>· {formatDate(post.created_at)}</span>
                            </div>
                            
                            <Link href={`/post/${post.slug}`} style={{ textDecoration: "none" }}>
                              <h3 style={{ 
                                fontFamily: "var(--display)", 
                                fontSize: 22, 
                                fontWeight: 700, 
                                color: "var(--black)", 
                                margin: "4px 0 8px",
                                lineHeight: 1.3,
                                letterSpacing: "-0.015em"
                              }}>
                                {post.title}
                              </h3>
                              {post.excerpt && <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", margin: 0, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.excerpt}</p>}
                            </Link>
                            
                            <div style={{ display: "flex", gap: 12, marginTop: 16, color: "var(--muted-2)", fontSize: 12, alignItems: "center" }}>
                              <span>{post.read_time} min read</span>
                              {cat && <span style={{ background: "var(--bg-3)", padding: "2px 8px", borderRadius: 12 }}>{cat.icon} {cat.label}</span>}
                            </div>
                          </div>
                          <Link href={`/post/${post.slug}`} style={{ width: 112, height: 112, borderRadius: 6, overflow: "hidden", flexShrink: 0, display: "block" }}>
                            <SafeImage src={post.cover_image} alt="" width={112} height={112} fallbackSeed={post.id || post.slug} />
                          </Link>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── EDITORIAL DIRECTORY TAB ─── */}
            {activeTab === "team" && (
              <section style={{ marginBottom: 56 }}>
                {staffMembers.length === 0 ? (
                  <div style={{ padding: "40px 0", textAlign: "center", border: "1px dashed var(--border)", borderRadius: 12, background: "var(--bg-2)" }}>
                    <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)" }}>No staff members assigned yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
                    {staffMembers.map((member) => (
                      <div key={member.id} style={{ 
                        background: "white", 
                        border: "1px solid var(--border)", 
                        borderRadius: 16, 
                        padding: 24, 
                        display: "flex", 
                        flexDirection: "column",
                        justifyContent: "space-between",
                        boxShadow: "var(--shadow-sm)",
                        transition: "transform 0.2s, box-shadow 0.2s"
                      }} className="hover:shadow-md hover:translate-y-[-2px]">
                        <div>
                          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", background: "var(--bg-3)", flexShrink: 0 }}>
                              {member.avatar_url ? (
                                <Image src={member.avatar_url} alt="" width={48} height={48} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                              ) : (
                                <div style={{ width: "100%", height: "100%", background: "var(--brand-light)", color: "var(--brand)", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {getInitials(member.full_name)}
                                </div>
                              )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <h3 style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--black)", margin: 0 }}>
                                  {member.full_name || "Staff Writer"}
                                </h3>
                                <span style={{ 
                                  fontSize: 9, 
                                  fontWeight: 700, 
                                  background: member.role === "admin" ? "rgba(239,68,68,0.1)" : "rgba(124,58,237,0.1)", 
                                  color: member.role === "admin" ? "#ef4444" : "var(--brand)", 
                                  padding: "2px 6px", 
                                  borderRadius: 4,
                                  textTransform: "uppercase"
                                }}>
                                  {member.role}
                                </span>
                              </div>
                              <span style={{ display: "block", fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>@{member.username}</span>
                            </div>
                          </div>
                          <p style={{ 
                            fontFamily: "var(--serif)", 
                            fontSize: 14, 
                            color: "var(--muted)", 
                            lineHeight: 1.5,
                            margin: "0 0 20px 0",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                          }}>
                            {member.bio || "Official EchoGist staff team member."}
                          </p>
                        </div>
                        
                        <Link 
                          href={`/profile/${member.username || member.id}`}
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "center",
                            fontFamily: "var(--sans)",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--ink)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: "8px 16px",
                            textDecoration: "none",
                            background: "var(--bg-2)",
                            transition: "background 0.2s"
                          }}
                          className="hover:bg-gray-100"
                        >
                          View Profile
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ─── WRITER GUIDELINES TAB ─── */}
            {activeTab === "guidelines" && (
              <div style={{ maxWidth: 680, margin: "0 auto" }}>
                <div style={{ 
                  background: "var(--bg-2)", 
                  border: "1px solid var(--border)", 
                  borderRadius: 16, 
                  padding: 32, 
                  boxShadow: "var(--shadow-sm)" 
                }}>
                  <h3 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginBottom: 12 }}>EchoGist Writer Guidelines</h3>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24 }}>
                    Welcome to the EchoGist Editorial Board. Review these basic rules and guidelines to ensure your articles qualify for official curation and promotion in our Staff Picks feed.
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {[
                      { title: "1. Content Integrity & Quality", desc: "Respect intellectual property. Plagiarism, uncredited sources, or spam content will result in immediate removal and suspension." },
                      { title: "2. Clean Formatting & Typography", desc: "Format code blocks with syntax highlighting, structure posts with clean hierarchical titles (H2, H3), and use relevant high-quality cover images." },
                      { title: "3. Readability & Engagement", desc: "Keep paragraphs readable, avoid heavy blocks of text, use clear explanatory subheadings, and verify factual references." }
                    ].map((g) => (
                      <div key={g.title} style={{ borderBottom: "1px solid var(--border-2)", paddingBottom: 16 }}>
                        <strong style={{ fontFamily: "var(--display)", fontSize: 16, color: "var(--ink)", display: "block", marginBottom: 6 }}>{g.title}</strong>
                        <span style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{g.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .staff-layout-columns {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .staff-guidelines-sidebar {
            width: 100% !important;
          }
        }
      `}} />
    </div>
  );
}
