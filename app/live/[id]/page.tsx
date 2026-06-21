"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/db-client/client";
import { formatDate } from "@/lib/types";

interface LiveUpdate {
  id: string;
  event_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

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

export default function LiveEventRoom({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const eventId = params.id;

  const [user, setUser] = useState<{ id: string; role?: string } | null>(null);
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Composer state
  const [newUpdate, setNewUpdate] = useState("");
  const [posting, setPosting] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    
    fetchEventAndUpdates();

    // Poll for updates every 5 seconds since custom client doesn't support Realtime WebSockets
    const interval = setInterval(() => {
      fetchEventAndUpdates(false);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const fetchEventAndUpdates = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    // Fetch Event
    const { data: eventData, error: eventErr } = await supabase
      .from("live_events")
      .select("*, profiles(id, full_name, avatar_url, username)")
      .eq("id", eventId)
      .single();

    if (eventErr) {
      setError(eventErr.message || "Failed to load live event.");
      setLoading(false);
      return;
    }
    setEvent(eventData as LiveEvent);

    // Fetch Updates
    const { data: updatesData, error: updatesErr } = await supabase
      .from("live_updates")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (!updatesErr && updatesData) {
      setUpdates(updatesData as LiveUpdate[]);
    }

    setLoading(false);
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdate.trim() || !user || !event) return;

    setPosting(true);
    const payload = {
      event_id: event.id,
      content: newUpdate.trim(),
      created_at: new Date().toISOString(),
    };

    const { error: postErr } = await supabase
      .from("live_updates")
      .insert(payload);

    setPosting(false);
    if (!postErr) {
      setNewUpdate("");
    } else {
      alert("Failed to post update: " + postErr.message);
    }
  };

  const handleEndEvent = async () => {
    if (!confirm("Are you sure you want to end this live event? You won't be able to post further updates.")) return;
    if (!user || !event) return;

    setEnding(true);
    const { error: endErr } = await supabase
      .from("live_events")
      .update({ status: "ended", updated_at: new Date().toISOString() })
      .eq("id", event.id);

    setEnding(false);
    if (endErr) {
      alert("Failed to end event: " + endErr.message);
    } else {
      setEvent({ ...event, status: "ended" });
    }
  };

  if (loading) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--ink)" }}>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div className="spinner" style={{ width: 32, height: 32, borderColor: "var(--border)", borderTopColor: "var(--ink)" }} />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--ink)" }}>
        <Navbar />
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, color: "var(--black)", marginBottom: 8 }}>Event Not Found</h1>
          <p style={{ fontFamily: "var(--sans)", color: "var(--muted)", marginBottom: 24 }}>{error || "The live event you are looking for does not exist."}</p>
          <Link href="/live" className="btn btn-outline btn-md" style={{ borderRadius: 999 }}>
            Back to Live Events
          </Link>
        </main>
      </div>
    );
  }

  const isAuthor = user?.id === event.author_id;
  const isActive = event.status === "active";

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--ink)" }}>
      <Navbar />

      {/* Hero Header */}
      <div style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border-2)", padding: "48px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            {isActive ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fef2f2", color: "#ef4444", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, fontFamily: "var(--sans)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span className="uget-live-dot" style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                Live Now
              </span>
            ) : (
              <span style={{ background: "var(--bg-3)", color: "var(--muted)", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, fontFamily: "var(--sans)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Ended
              </span>
            )}
            <span style={{ fontSize: 13, color: "var(--muted-2)", fontFamily: "var(--sans)" }}>
              {formatDate(event.created_at)}
            </span>
          </div>

          <h1 style={{ fontFamily: "var(--display)", fontSize: 40, fontWeight: 800, color: "var(--black)", letterSpacing: "-0.02em", marginBottom: 16, lineHeight: 1.2 }}>
            {event.title}
          </h1>
          
          {event.description && (
            <p style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24, maxWidth: 600 }}>
              {event.description}
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid var(--border-2)", paddingTop: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--border)", overflow: "hidden" }}>
              {event.profiles?.avatar_url ? (
                <Image src={event.profiles.avatar_url} alt="" width={40} height={40} style={{ objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "#f5f3ff", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontFamily: "var(--sans)" }}>
                  {event.profiles?.full_name[0]}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--sans)", color: "var(--black)" }}>{event.profiles?.full_name}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--sans)" }}>@{event.profiles?.username} • Reporter</div>
            </div>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 120px" }}>
        
        {/* Author Composer */}
        {isAuthor && isActive && (
          <div style={{ background: "white", border: "1px solid var(--brand)", borderRadius: 16, padding: 24, marginBottom: 48, boxShadow: "0 8px 30px rgba(139, 92, 246, 0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, color: "var(--black)" }}>Post Live Update</h3>
              <button onClick={handleEndEvent} disabled={ending} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--sans)" }}>
                {ending ? "Ending..." : "End Event"}
              </button>
            </div>
            <form onSubmit={handlePostUpdate}>
              <textarea
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                placeholder="What's happening right now?"
                rows={3}
                style={{ width: "100%", border: "1px solid var(--border-2)", borderRadius: 12, padding: 16, fontSize: 15, fontFamily: "var(--sans)", resize: "vertical", outline: "none", marginBottom: 16, background: "var(--bg)" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--brand)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-2)"}
                required
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" disabled={posting || !newUpdate.trim()} className="btn btn-primary" style={{ borderRadius: 999, padding: "10px 24px", fontWeight: 600 }}>
                  {posting ? "Posting..." : "Post Update"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Timeline Feed */}
        <div style={{ position: "relative" }}>
          {/* Vertical line for timeline */}
          <div style={{ position: "absolute", left: 16, top: 20, bottom: 0, width: 2, background: "var(--border-2)", zIndex: 0 }} />

          {updates.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", position: "relative", zIndex: 1 }}>
              <div style={{ background: "white", display: "inline-block", padding: "0 24px" }}>
                <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)" }}>
                  {isActive ? "Waiting for the first update..." : "This event ended without any updates."}
                </p>
                {isActive && (
                  <div className="spinner" style={{ width: 24, height: 24, margin: "24px auto 0", borderColor: "var(--border)", borderTopColor: "var(--brand)" }} />
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 32, position: "relative", zIndex: 1 }}>
              {updates.map((update, index) => {
                const date = new Date(update.created_at);
                const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={update.id} style={{ display: "flex", gap: 20 }}>
                    {/* Timeline Node */}
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: index === 0 && isActive ? "var(--brand)" : "var(--bg-3)", border: "4px solid var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4, zIndex: 2, boxShadow: index === 0 && isActive ? "0 0 0 4px rgba(139, 92, 246, 0.1)" : "none" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: index === 0 && isActive ? "white" : "var(--border)" }} />
                    </div>
                    
                    {/* Content Card */}
                    <div style={{ flex: 1, background: "white", border: "1px solid var(--border-2)", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--sans)", color: "var(--black)" }}>{timeString}</span>
                        {index === 0 && isActive && (
                          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--sans)", color: "var(--brand)", background: "var(--bg-brand)", padding: "2px 8px", borderRadius: 999 }}>Latest</span>
                        )}
                      </div>
                      <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--ink)", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>
                        {update.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .uget-live-dot {
          animation: pulse-red 2s infinite;
        }
      `}} />
    </div>
  );
}
