"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/db-client/client";
import type { Post, Profile } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";

export default function StaffPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [staffMembers, setStaffMembers] = useState<Profile[]>([]);
  const [staffPosts, setStaffPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    // Load current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
        supabase.from("profiles").select("*").eq("id", user.id).single()
          .then(({ data }) => {
            setCurrentUserProfile(data as Profile);
          });
      }
    });

    loadStaffData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStaffData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all profiles (we will filter for admin & staff on client side)
      const { data: profiles } = await supabase.from("profiles").select("*");
      const filteredStaff = (profiles || []).filter(
        (p: any) => p.role === "staff" || p.role === "admin"
      );
      setStaffMembers(filteredStaff as Profile[]);

      // 2. Fetch all posts (we will filter for posts written by admin or staff)
      const { data: posts } = await supabase.from("posts")
        .select("*, profiles(full_name, avatar_url, username, role)")
        .eq("published", true)
        .order("created_at", { ascending: false });

      const filteredPosts = (posts || []).filter(
        (p: any) => p.profiles?.role === "staff" || p.profiles?.role === "admin"
      );
      setStaffPosts(filteredPosts as Post[]);
    } catch (err) {
      console.error("Error loading staff data:", err);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = currentUserProfile?.role === "admin";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--ink)" }}>
      <Navbar />

      <main style={{ maxWidth: 1040, margin: "64px auto 80px", padding: "40px 24px" }}>
        {/* Header Section */}
        <div style={{ 
          borderBottom: "1px solid var(--border-2)", 
          paddingBottom: 32, 
          marginBottom: 40,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 20
        }}>
          <div>
            <span style={{ 
              fontFamily: "var(--sans)", 
              fontSize: 12, 
              fontWeight: 700, 
              color: "var(--brand)", 
              textTransform: "uppercase", 
              letterSpacing: "0.1em",
              display: "block",
              marginBottom: 8
            }}>
              Official Directory
            </span>
            <h1 style={{ 
              fontFamily: "var(--display)", 
              fontSize: 42, 
              fontWeight: 800, 
              color: "var(--black)", 
              letterSpacing: "-0.03em",
              margin: 0,
              lineHeight: 1.1
            }}>
              UGET Staff & Writers
            </h1>
            <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)", marginTop: 8, margin: 0 }}>
              Meet the editorial guild, official team, and creators behind UGET.
            </p>
          </div>
          {isAdmin && (
            <Link 
              href="/admin?tab=staff" 
              style={{
                fontFamily: "var(--sans)",
                fontSize: 14,
                fontWeight: 600,
                color: "white",
                backgroundColor: "var(--brand)",
                padding: "10px 20px",
                borderRadius: 999,
                textDecoration: "none",
                boxShadow: "0 4px 12px rgba(124,58,237,0.15)",
                transition: "all 0.2s"
              }}
              className="hover:scale-105"
            >
              🛡️ Manage Staff (Admin)
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", flexDirection: "column", gap: 16 }}>
            <div className="spinner" style={{ width: 36, height: 36, borderColor: "var(--border)", borderTopColor: "var(--ink)", borderWidth: 3 }} />
            <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)" }}>Loading staff panel…</p>
          </div>
        ) : (
          <div>
            {/* Staff Profiles Grid */}
            <section style={{ marginBottom: 56 }}>
              <h2 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-2)", marginBottom: 24 }}>
                Team Members ({staffMembers.length})
              </h2>
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
                          {member.bio || "Official UGET staff team member."}
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

            {/* Layout Columns for Posts & Rules */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 48 }} className="staff-layout-columns">
              {/* Staff Posts Feed */}
              <section style={{ minWidth: 0 }}>
                <h2 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-2)", marginBottom: 20 }}>
                  Staff Picks & Corner ({staffPosts.length})
                </h2>
                
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
                          gap: 20, 
                          alignItems: "flex-start", 
                          padding: "24px 0",
                          borderBottom: "1px solid var(--border-2)"
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", overflow: "hidden", justifyContent: "center" }}>
                                {author?.avatar_url ? <Image src={author.avatar_url} alt="" width={24} height={24} style={{ objectFit: "cover" }} /> : getInitials(author?.full_name)}
                              </div>
                              <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, color: "var(--black)" }}>{author?.full_name || "UGET Staff"}</span>
                              <span style={{ 
                                fontFamily: "var(--sans)", 
                                fontSize: 9, 
                                fontWeight: 700, 
                                background: author?.role === "admin" ? "rgba(239,68,68,0.1)" : "rgba(124,58,237,0.1)", 
                                color: author?.role === "admin" ? "#ef4444" : "var(--brand)",
                                padding: "2px 6px", 
                                borderRadius: 4 
                              }}>
                                {author?.role === "admin" ? "ADMIN" : "STAFF"}
                              </span>
                              <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>· {formatDate(post.created_at)}</span>
                            </div>
                            
                            <Link href={`/post/${post.slug}`} style={{ textDecoration: "none" }}>
                              <h3 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", margin: "4px 0 8px" }}>{post.title}</h3>
                              {post.excerpt && <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.excerpt}</p>}
                            </Link>
                            
                            <div style={{ display: "flex", gap: 12, marginTop: 8, color: "var(--muted-2)", fontSize: 12 }}>
                              <span>{post.read_time} min read</span>
                              {cat && <span>· {cat.icon} {cat.label}</span>}
                            </div>
                          </div>
                          {post.cover_image && (
                            <Link href={`/post/${post.slug}`} style={{ width: 100, height: 100, borderRadius: 8, overflow: "hidden", flexShrink: 0, display: "block" }}>
                              <Image src={post.cover_image} alt="" width={100} height={100} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                            </Link>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Guidelines Sidebar */}
              <aside style={{ alignSelf: "start" }} className="staff-guidelines-sidebar">
                <div style={{ 
                  background: "var(--bg-2)", 
                  border: "1px solid var(--border)", 
                  borderRadius: 16, 
                  padding: 24, 
                  boxShadow: "var(--shadow-sm)" 
                }}>
                  <h3 style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--black)", marginBottom: 12 }}>UGET Writer Guild</h3>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                    Welcome to the UGET Writer Guild. Review these basic rules and guidelines to ensure your articles qualify for promotion in the Staff Picks feed.
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { title: "Content Policy", desc: "Respect intellectual property and avoid plagiarism." },
                      { title: "Format & Layout", desc: "Use headers, bolding, and code snippets correctly." },
                      { title: "Readability Tips", desc: "Keep paragraphs short and explain complex jargon." }
                    ].map((g) => (
                      <div key={g.title} style={{ borderBottom: "1px solid var(--border-2)", paddingBottom: 10 }}>
                        <strong style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink)", display: "block" }}>{g.title}</strong>
                        <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)" }}>{g.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
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
