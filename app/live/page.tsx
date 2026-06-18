"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/db-client/client";
import { formatDate } from "@/lib/types";

interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "ended";
  author_id: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    username: string;
  };
}

export default function LiveDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ id: string; role?: string } | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    loadEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("live_events")
      .select("*, profiles(id, full_name, avatar_url, username)")
      .order("created_at", { ascending: false });
    
    if (data) {
      setEvents(data as LiveEvent[]);
    }
    setLoading(false);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      setError("Event title is required");
      return;
    }

    setCreating(true);
    setError("");

    const payload = {
      title: title.trim(),
      description: description.trim(),
      author_id: user.id,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error: err } = await supabase
      .from("live_events")
      .insert(payload);

    setCreating(false);
    if (err) {
      setError(err.message || "Failed to create live event");
    } else if (data) {
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      router.push(`/live/${data.id}`);
    }
  };

  const activeEvents = events.filter((e) => e.status === "active");
  const pastEvents = events.filter((e) => e.status === "ended");

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--ink)" }}>
      <Navbar />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--black)", marginBottom: 8 }}>
              🔴 Live Reports
            </h1>
            <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)" }}>
              Follow real-time event updates from our reporters, or report your own live event.
            </p>
          </div>
          {user && (user as any).role !== "reader" && (
            <button className="btn btn-primary btn-md" onClick={() => setShowCreateModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              <span>🔴</span> Start Live Event
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "30vh" }}>
            <div className="spinner" style={{ width: 24, height: 24, borderColor: "var(--border)", borderTopColor: "var(--ink)" }} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            {/* Active Live Events */}
            <div>
              <h2 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: "var(--black)", borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                Ongoing Events ({activeEvents.length})
              </h2>
              {activeEvents.length === 0 ? (
                <div style={{ padding: "40px 24px", background: "var(--bg-2)", border: "1px dashed var(--border)", borderRadius: 12, textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)" }}>There are currently no active live events. Check back later!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {activeEvents.map((e) => (
                    <Link href={`/live/${e.id}`} key={e.id} style={{ textDecoration: "none", display: "block" }}>
                      <div className="post-card" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", transition: "all 0.2s" }}
                           onMouseEnter={(el) => (el.currentTarget.style.borderColor = "var(--brand)")}
                           onMouseLeave={(el) => (el.currentTarget.style.borderColor = "var(--border)")}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ background: "#fef2f2", color: "#ef4444", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, fontFamily: "var(--sans)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Live</span>
                          <span style={{ fontSize: 12, color: "var(--muted-2)", fontFamily: "var(--sans)" }}>Started {formatDate(e.created_at)}</span>
                        </div>
                        <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--black)", marginBottom: 8 }}>{e.title}</h3>
                        {e.description && <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>{e.description}</p>}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--ink)", color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                            {e.profiles?.avatar_url ? <Image src={e.profiles.avatar_url} alt="" width={20} height={20} style={{ objectFit: "cover" }} /> : e.profiles?.full_name[0]}
                          </div>
                          <span style={{ fontSize: 13, color: "var(--ink-2)", fontFamily: "var(--sans)" }}>Reporter: {e.profiles?.full_name}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Past Live Events */}
            <div>
              <h2 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: "var(--black)", borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 20 }}>
                Recent Streams ({pastEvents.length})
              </h2>
              {pastEvents.length === 0 ? (
                <div style={{ padding: "30px 24px", textAlign: "center", color: "var(--muted-2)" }}>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 14 }}>No archived live streams.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {pastEvents.map((e) => (
                    <Link href={`/live/${e.id}`} key={e.id} style={{ textDecoration: "none", display: "block" }}>
                      <div className="post-card" style={{ background: "var(--bg)", border: "1px solid var(--border-2)", borderRadius: 12, padding: 20, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                           onMouseEnter={(el) => (el.currentTarget.style.borderColor = "var(--border)")}
                           onMouseLeave={(el) => (el.currentTarget.style.borderColor = "var(--border-2)")}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <span style={{ background: "var(--bg-3)", color: "var(--muted)", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 999, fontFamily: "var(--sans)" }}>Ended</span>
                            <span style={{ fontSize: 11, color: "var(--muted-2)", fontFamily: "var(--sans)" }}>{formatDate(e.created_at)}</span>
                          </div>
                          <h3 style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--black)", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{e.title}</h3>
                          {e.description && <p style={{ fontFamily: "var(--serif)", fontSize: 13, color: "var(--muted)", lineHeight: 1.4, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{e.description}</p>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                          <span style={{ fontSize: 12, color: "var(--muted-2)", fontFamily: "var(--sans)" }}>By {e.profiles?.full_name}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Start Live Event Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h2 className="modal-title">Start a Live Event</h2>
            <p className="modal-desc">Create a live update stream. You will be redirected to post updates live.</p>

            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <form onSubmit={handleCreateEvent} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Event Title</label>
                <input type="text" className="form-input" placeholder="e.g. NextJS Conference Keynote 2026" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description / Summary</label>
                <textarea className="form-input" placeholder="What is this event about?" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline btn-md" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-md" disabled={creating} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {creating ? <div className="spinner" /> : "🔴 Start Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
