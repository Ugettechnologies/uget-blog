"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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

interface LiveUpdate {
  id: string;
  event_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

export default function LiveEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const supabase = createClient();

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Form states
  const [newUpdate, setNewUpdate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");

  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    if (id) {
      loadEventData();
    }

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (autoRefresh && event && event.status === "active") {
      refreshInterval.current = setInterval(() => {
        loadUpdates();
      }, 10000); // refresh updates every 10 seconds
    } else {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, event]);

  const loadEventData = async () => {
    setLoading(true);
    // Load event metadata
    const { data: eventData } = await supabase
      .from("live_events")
      .select("*, profiles(id, full_name, avatar_url, username)")
      .eq("id", id)
      .single();

    if (eventData) {
      setEvent(eventData as LiveEvent);
      // Load event updates
      await loadUpdates();
    }
    setLoading(false);
  };

  const loadUpdates = async () => {
    const { data } = await supabase
      .from("live_updates")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (data) {
      setUpdates(data as LiveUpdate[]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `live/${id}/${Date.now()}.${ext}`;

    const { error, data } = await supabase.storage.from("live-images").upload(path, file);

    if (error) {
      setError(error.message);
      setUploading(false);
      return;
    }

    setImageUrl(data.path);
    setUploading(false);
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newUpdate.trim()) return;

    setPosting(true);
    setError("");

    const payload = {
      event_id: id,
      content: newUpdate.trim(),
      image_url: imageUrl || null,
      created_at: new Date().toISOString()
    };

    const { data, error: err } = await supabase
      .from("live_updates")
      .insert(payload);

    setPosting(false);
    if (err) {
      setError(err.message || "Failed to post update");
    } else {
      setNewUpdate("");
      setImageUrl("");
      loadUpdates();
    }
  };

  const handleEndEvent = async () => {
    if (!confirm("Are you sure you want to end this live reporting event? This will archive the stream.")) return;
    
    const { error: err } = await supabase
      .from("live_events")
      .update({ status: "ended", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (err) {
      alert("Failed to end event: " + err.message);
    } else {
      loadEventData();
    }
  };

  const isAuthor = user && event && user.id === event.author_id;

  if (loading) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }}>
          <div className="spinner" style={{ width: 28, height: 28, borderColor: "var(--border)", borderTopColor: "var(--ink)" }} />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ maxWidth: 680, margin: "80px auto", padding: "0 24px", textAlign: "center", color: "var(--ink)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Live Event Not Found</h1>
          <p style={{ color: "var(--muted)", marginBottom: 20 }}>The live reporting event does not exist or has been removed.</p>
          <Link href="/live" className="btn btn-primary btn-md" style={{ textDecoration: "none" }}>Back to Live Reports</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--ink)" }}>
      <Navbar />

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "60px 24px 100px" }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 24, marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{
              background: event.status === "active" ? "#fef2f2" : "var(--bg-3)",
              color: event.status === "active" ? "#ef4444" : "var(--muted)",
              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
              fontFamily: "var(--sans)", textTransform: "uppercase", letterSpacing: "0.05em",
              display: "flex", alignItems: "center", gap: 6
            }}>
              {event.status === "active" ? (
                <><span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />LIVE</>
              ) : "ARCHIVED"}
            </span>
            {event.status === "active" && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted-2)", fontFamily: "var(--sans)", cursor: "pointer" }}>
                <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                Auto-refresh (10s)
              </label>
            )}
          </div>

          <h1 style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--black)", marginBottom: 12 }}>
            {event.title}
          </h1>

          {event.description && (
            <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
              {event.description}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--ink)", color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {event.profiles?.avatar_url ? <Image src={event.profiles.avatar_url} alt="" width={24} height={24} style={{ objectFit: "cover" }} /> : event.profiles?.full_name[0]}
              </div>
              <span style={{ fontSize: 13, color: "var(--ink-2)", fontFamily: "var(--sans)" }}>
                By <strong>{event.profiles?.full_name}</strong> · {formatDate(event.created_at)}
              </span>
            </div>
            {isAuthor && event.status === "active" && (
              <button onClick={handleEndEvent} className="btn btn-sm btn-outline" style={{ color: "var(--red)", border: "1px solid rgba(192,57,43,0.2)" }}>
                ⛔ End Live Stream
              </button>
            )}
          </div>
        </div>

        {/* Post update (Author-only) */}
        {isAuthor && event.status === "active" && (
          <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 40 }}>
            <h3 style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 700, color: "var(--black)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span>✍️</span> Post a Live Update
            </h3>
            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            
            <form onSubmit={handlePostUpdate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <textarea className="form-input" placeholder="Type what's happening now..." value={newUpdate} onChange={(e) => setNewUpdate(e.target.value)} rows={4} style={{ fontFamily: "var(--serif)", fontSize: 15 }} required />
              
              {imageUrl && (
                <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", maxHeight: 200, border: "1px solid var(--border)" }}>
                  <Image src={imageUrl} alt="Upload preview" width={600} height={200} style={{ objectFit: "cover", width: "100%", height: 200 }} />
                  <button type="button" onClick={() => setImageUrl("")} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", color: "white", borderRadius: "50%", width: 28, height: 28, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="btn btn-outline btn-sm" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  {uploading ? (
                    <><div className="spinner" style={{ width: 12, height: 12, borderColor: "var(--border)", borderTopColor: "var(--muted)" }} />Uploading...</>
                  ) : (
                    <>🖼️ Add Image</>
                  )}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} disabled={uploading} />
                </label>
                <button type="submit" className="btn btn-primary btn-sm" disabled={posting || !newUpdate.trim()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {posting && <div className="spinner" style={{ width: 12, height: 12 }} />}
                  Post Update
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Timeline updates */}
        <div>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginBottom: 24 }}>
            Timeline Updates ({updates.length})
          </h2>

          {updates.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--muted-2)", borderTop: "1px solid var(--border)" }}>
              <p style={{ fontFamily: "var(--serif)", fontSize: 15 }}>No updates posted yet. Timeline is currently empty.</p>
            </div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 24, borderLeft: "2px solid var(--border)" }}>
              {updates.map((update, index) => {
                const updateTime = new Date(update.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                return (
                  <div key={update.id} style={{ position: "relative", marginBottom: 40 }}>
                    {/* Circle timeline bullet */}
                    <div style={{
                      position: "absolute", left: -31, top: 4, width: 12, height: 12, borderRadius: "50%",
                      background: index === 0 && event.status === "active" ? "#ef4444" : "var(--border)",
                      border: index === 0 && event.status === "active" ? "3px solid #fef2f2" : "3px solid var(--bg)"
                    }} />
                    
                    {/* Timestamp */}
                    <div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: index === 0 && event.status === "active" ? "#ef4444" : "var(--muted)", marginBottom: 6 }}>
                      {updateTime}
                    </div>

                    {/* Content */}
                    <div style={{ fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.6, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>
                      {update.content}
                    </div>

                    {/* Image if any */}
                    {update.image_url && (
                      <div style={{ marginTop: 16, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-3)" }}>
                        <Image src={update.image_url} alt="" width={600} height={350} style={{ objectFit: "cover", width: "100%", height: "auto", maxHeight: 400 }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
