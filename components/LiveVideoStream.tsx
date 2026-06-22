"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/db-client/client";

interface LiveVideoStreamProps {
  eventId: string;
  isAuthor: boolean;
  videoActiveInitial: boolean;
  onStatusChange?: (isActive: boolean) => void;
}

export default function LiveVideoStream({
  eventId,
  isAuthor,
  videoActiveInitial,
  onStatusChange
}: LiveVideoStreamProps) {
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [videoActive, setVideoActive] = useState(videoActiveInitial);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  // Streaming modes: "obs" or "upload"
  const [broadcastMode, setBroadcastMode] = useState<"obs" | "upload">("upload");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [viewersCount, setViewersCount] = useState(12);

  // File upload states
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "your-cloud-name";

  // Simulated viewers counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (videoActive) {
      interval = setInterval(() => {
        setViewersCount(prev => Math.max(1, prev + Math.floor(Math.random() * 5) - 2));
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [videoActive]);

  // Poll database periodically for event status updates (active stream and video url)
  useEffect(() => {
    const checkStatus = async () => {
      const { data, error } = await supabase
        .from("live_events")
        .select("video_active, video_url")
        .eq("id", eventId)
        .single();
      
      if (!error && data) {
        setVideoActive(data.video_active);
        setVideoUrl(data.video_url || null);
        if (onStatusChange) {
          onStatusChange(data.video_active);
        }
      }
    };

    // Run immediately and then poll every 4 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, onStatusChange]);

  // Handle direct video upload to Cloudinary
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setUploadingVideo(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // 1. Upload video to Cloudinary via our server route
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok && data.path) {
        setUploadedUrl(data.path);
        setVideoUrl(data.path);
        
        // 2. Save video url to live_events table and mark video as active
        const { error: dbErr } = await supabase
          .from("live_events")
          .update({
            video_url: data.path,
            video_active: true
          })
          .eq("id", eventId);
        
        if (dbErr) throw new Error(dbErr.message);
        setVideoActive(true);
      } else {
        setUploadError(data.error || "Failed to upload video clip to Cloudinary.");
      }
    } catch (err: any) {
      setUploadError("Video upload failed: " + err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  // Toggle OBS broadcasting status
  const startObsBroadcast = async () => {
    try {
      const { error } = await supabase
        .from("live_events")
        .update({
          video_active: true,
          video_url: null // Reset uploaded url for RTMP stream
        })
        .eq("id", eventId);

      if (error) throw new Error(error.message);
      
      setVideoActive(true);
      setVideoUrl(null);
      setIsBroadcasting(true);
      if (onStatusChange) onStatusChange(true);
    } catch (err: any) {
      alert("Failed to start RTMP stream: " + err.message);
    }
  };

  const stopBroadcast = async () => {
    try {
      const { error } = await supabase
        .from("live_events")
        .update({
          video_active: false
        })
        .eq("id", eventId);

      if (error) throw new Error(error.message);

      setVideoActive(false);
      setIsBroadcasting(false);
      if (onStatusChange) onStatusChange(false);
    } catch (err: any) {
      alert("Failed to terminate broadcast: " + err.message);
    }
  };

  // Cloudinary credentials for OBS
  const rtmpServerUrl = "rtmp://global-live.cloudinary.com/live";
  const rtmpStreamKey = `uget_live_${eventId.replace(/[^a-zA-Z0-9]/g, "")}?cloud_name=${cloudName}`;

  // Viewers secure HLS delivery URL
  const hlsDeliveryUrl = `https://res.cloudinary.com/${cloudName}/video/upload/sp_auto/uget_live_${eventId.replace(/[^a-zA-Z0-9]/g, "")}.m3u8`;

  return (
    <div style={{ background: "white", border: "1px solid var(--border-2)", borderRadius: 16, overflow: "hidden", marginBottom: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
      {/* Stream Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "var(--bg-2)", borderBottom: "1px solid var(--border-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🎥</span>
          <span style={{ fontWeight: 700, fontFamily: "var(--sans)", color: "var(--black)" }}>
            {isAuthor ? "Cloudinary Streaming Dashboard" : "Live Video Broadcast"}
          </span>
        </div>
        <div>
          {videoActive ? (
            <span style={{ background: "#fef2f2", color: "#ef4444", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, fontFamily: "var(--sans)", display: "flex", alignItems: "center", gap: 6 }}>
              <span className="uget-live-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
              BROADCAST LIVE
            </span>
          ) : (
            <span style={{ background: "var(--bg-3)", color: "var(--muted)", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, fontFamily: "var(--sans)" }}>
              STREAM OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* Main Video Display Area */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#0c0a0f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
        
        {/* Playback mode: Display uploaded video report clip */}
        {videoActive && videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            controls
            playsInline
            loop
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : videoActive && !videoUrl ? (
          /* Playback mode: Playing RTMP / HLS Stream via Cloudinary */
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", background: "linear-gradient(to bottom, rgba(12, 10, 15, 0.9), rgba(28, 25, 35, 0.95))" }}>
            <div className="spinner" style={{ width: 36, height: 36, borderColor: "rgba(255,255,255,0.1)", borderTopColor: "var(--brand)", marginBottom: 16 }} />
            <h4 style={{ color: "white", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Connecting to Cloudinary RTMP Feed...</h4>
            <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 360, marginBottom: 12 }}>
              The reporter is transmitting a live broadcast stream.
            </p>
            <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--brand)", wordBreak: "break-all", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 4 }}>
              HLS: {hlsDeliveryUrl.substring(0, 50)}...
            </span>
          </div>
        ) : (
          /* Stream Offline Placeholder */
          <div style={{ padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
            <h4 style={{ color: "white", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              {isAuthor ? "Configure Cloudinary Video Broadcast" : "No Active Video Broadcast"}
            </h4>
            <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 360, margin: "0 auto 16px", lineHeight: 1.5 }}>
              {isAuthor 
                ? "Choose how you want to broadcast. You can upload a recorded video report directly to Cloudinary or connect an external RTMP encoder like OBS."
                : "The reporter is currently posting text-based live updates. Follow the feed below."}
            </p>
          </div>
        )}

        {/* Live HUD Overlay */}
        {videoActive && (
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 8, zIndex: 10, fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: "white" }}>
            <span style={{ background: "rgba(0, 0, 0, 0.6)", padding: "4px 8px", borderRadius: 4, backdropFilter: "blur(4px)" }}>
              📶 CLOUDINARY CDN
            </span>
            <span style={{ background: "rgba(0, 0, 0, 0.6)", padding: "4px 8px", borderRadius: 4, backdropFilter: "blur(4px)" }}>
              👥 {viewersCount} watching
            </span>
            {videoUrl && (
              <span style={{ background: "#8b5cf6", padding: "4px 8px", borderRadius: 4, color: "white" }}>
                🎥 RECORDED CLIP
              </span>
            )}
          </div>
        )}
      </div>

      {/* Control Panel Footer */}
      <div style={{ padding: 20, background: "var(--bg-2)", borderTop: "1px solid var(--border-2)" }}>
        {isAuthor ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Mode selection buttons */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border-2)", paddingBottom: 12, gap: 16 }}>
              <button
                type="button"
                onClick={() => setBroadcastMode("upload")}
                style={{
                  background: "none",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  color: broadcastMode === "upload" ? "var(--brand)" : "var(--muted)",
                  borderBottom: broadcastMode === "upload" ? "2px solid var(--brand)" : "none",
                  paddingBottom: 4
                }}
              >
                📁 Upload Video Report
              </button>
              <button
                type="button"
                onClick={() => setBroadcastMode("obs")}
                style={{
                  background: "none",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  color: broadcastMode === "obs" ? "var(--brand)" : "var(--muted)",
                  borderBottom: broadcastMode === "obs" ? "2px solid var(--brand)" : "none",
                  paddingBottom: 4
                }}
              >
                💻 External RTMP (OBS)
              </button>
            </div>

            {/* Broadcast Option Panels */}
            {broadcastMode === "upload" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>
                  Upload a video file from your camera or library to Cloudinary
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <label style={{
                    padding: "10px 16px",
                    border: "1px dashed var(--brand)",
                    borderRadius: 12,
                    backgroundColor: "white",
                    color: "var(--brand)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}>
                    📁 {uploadingVideo ? "Uploading video report..." : "Select & Upload Video"}
                    <input type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: "none" }} disabled={uploadingVideo} />
                  </label>
                  {uploadedUrl && (
                    <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>
                      ✓ Report video live on Cloudinary CDN!
                    </span>
                  )}
                </div>
                {uploadError && <span style={{ fontSize: 12, color: "#ef4444" }}>{uploadError}</span>}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--brand)", display: "block", marginBottom: 6 }}>
                    OBS / Broadcaster Connection Credentials
                  </span>
                  <div style={{ fontSize: 12, fontFamily: "monospace", display: "flex", flexDirection: "column", gap: 6, color: "var(--ink)" }}>
                    <div>
                      <strong style={{ color: "var(--muted)" }}>RTMP Server URL:</strong><br />
                      <input type="text" readOnly value={rtmpServerUrl} style={{ width: "100%", background: "white", border: "1px solid var(--border-2)", borderRadius: 4, padding: "3px 6px", fontSize: 11, marginTop: 2 }} onClick={(e) => e.currentTarget.select()} />
                    </div>
                    <div>
                      <strong style={{ color: "var(--muted)" }}>Stream Key:</strong><br />
                      <input type="text" readOnly value={rtmpStreamKey} style={{ width: "100%", background: "white", border: "1px solid var(--border-2)", borderRadius: 4, padding: "3px 6px", fontSize: 11, marginTop: 2 }} onClick={(e) => e.currentTarget.select()} />
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  {isBroadcasting ? (
                    <button type="button" onClick={stopBroadcast} className="btn btn-outline" style={{ borderRadius: 999, color: "#ef4444", borderColor: "#fca5a5" }}>
                      🛑 Stop Stream Broadcast
                    </button>
                  ) : (
                    <button type="button" onClick={startObsBroadcast} className="btn btn-primary" style={{ borderRadius: 999 }}>
                      📡 Activate Cloudinary RTMP Stream
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* General Termination for Uploaded Clip */}
            {videoActive && videoUrl && (
              <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-2)", paddingTop: 12 }}>
                <button type="button" onClick={stopBroadcast} className="btn btn-outline" style={{ borderRadius: 999, color: "#ef4444", borderColor: "#fca5a5" }}>
                  🛑 Remove Uploaded Clip from Live
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
              {videoActive
                ? `🔴 Video Broadcast is Live on Cloudinary CDN. ${videoUrl ? "Playing video clip report." : "Connecting via RTMP HLS Delivery stream."}`
                : "📹 Video stream is currently offline. Follow the text feed below for live coverage."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
