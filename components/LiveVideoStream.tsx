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
  
  // Streaming modes: "camera" (new Webcam), "upload" (direct Cloudinary upload), or "obs" (RTMP)
  const [broadcastMode, setBroadcastMode] = useState<"camera" | "upload" | "obs">("camera");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [viewersCount, setViewersCount] = useState(12);

  // File upload states
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");

  // Live Camera state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [streamDuration, setStreamDuration] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [fps, setFps] = useState(30);

  // Viewer interactive webcam simulation state
  const [viewerWebcamActive, setViewerWebcamActive] = useState(false);
  const [viewerStream, setViewerStream] = useState<MediaStream | null>(null);

  // Reactions state
  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number; drift: number }[]>([]);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "your-cloud-name";
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const viewerStreamRef = useRef<MediaStream | null>(null);

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

  // Simulated FPS fluctuation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBroadcasting) {
      interval = setInterval(() => {
        setFps(prev => Math.min(30, Math.max(28, prev + (Math.random() > 0.5 ? 1 : -1))));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isBroadcasting]);

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

  // React state synchronization for streaming objects to video tag
  useEffect(() => {
    if (videoRef.current) {
      if (isAuthor && localStream) {
        videoRef.current.srcObject = localStream;
        videoRef.current.play().catch(err => console.warn("Video play error:", err));
      } else if (!isAuthor && viewerStream) {
        videoRef.current.srcObject = viewerStream;
        videoRef.current.play().catch(err => console.warn("Video play error:", err));
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [localStream, viewerStream, isAuthor]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      cleanupStreams();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanupStreams = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (viewerStreamRef.current) {
      viewerStreamRef.current.getTracks().forEach(t => t.stop());
      viewerStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setLocalStream(null);
    setViewerStream(null);
    setMicLevel(0);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // CAMERA STREAMING LOGIC
  // ────────────────────────────────────────────────────────────────────────────
  const startCameraBroadcast = async () => {
    try {
      cleanupStreams();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Save stream state in DB
      const { error: dbErr } = await supabase
        .from("live_events")
        .update({
          video_active: true,
          video_url: "camera-stream"
        })
        .eq("id", eventId);
      
      if (dbErr) throw new Error(dbErr.message);

      setVideoActive(true);
      setVideoUrl("camera-stream");
      setIsBroadcasting(true);
      if (onStatusChange) onStatusChange(true);

      // Start elapsed stopwatch
      setStreamDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setStreamDuration(prev => prev + 1);
      }, 1000);

      // Hook up microphone volume levels via Web Audio API
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        source.connect(analyser);
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkMic = () => {
          if (!localStreamRef.current || !localStreamRef.current.active) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          setMicLevel(Math.min(100, Math.round((average / 255) * 130))); // scaled to 0-100
          animationFrameRef.current = requestAnimationFrame(checkMic);
        };
        animationFrameRef.current = requestAnimationFrame(checkMic);
      } catch (err) {
        console.warn("Could not start AudioContext:", err);
      }
    } catch (err: any) {
      alert("Failed to access camera/mic: " + err.message);
    }
  };

  const stopCameraBroadcast = async () => {
    cleanupStreams();
    try {
      const { error: dbErr } = await supabase
        .from("live_events")
        .update({
          video_active: false,
          video_url: null
        })
        .eq("id", eventId);
      
      if (dbErr) throw new Error(dbErr.message);

      setVideoActive(false);
      setVideoUrl(null);
      setIsBroadcasting(false);
      if (onStatusChange) onStatusChange(false);
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // INTERACTIVE VIEWER WEBCAM LOGIC
  // ────────────────────────────────────────────────────────────────────────────
  const toggleViewerWebcam = async () => {
    if (viewerWebcamActive) {
      if (viewerStreamRef.current) {
        viewerStreamRef.current.getTracks().forEach(t => t.stop());
        viewerStreamRef.current = null;
      }
      setViewerStream(null);
      setViewerWebcamActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false // prevent local feedback audio loop
        });
        viewerStreamRef.current = stream;
        setViewerStream(stream);
        setViewerWebcamActive(true);
      } catch (err: any) {
        alert("Webcam permission denied: " + err.message);
      }
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // FLOATING EMOJI REACTIONS
  // ────────────────────────────────────────────────────────────────────────────
  const triggerReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const x = 20 + Math.random() * 60; // 20% to 80% left positioning
    const drift = Math.floor(Math.random() * 60) - 30; // -30px to 30px lateral drift
    
    setReactions(prev => [...prev, { id, emoji, x, drift }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 2500);
  };

  // Format streaming time (MM:SS)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ────────────────────────────────────────────────────────────────────────────
  // CLOUDINARY UPLOAD & RTMP STUFF
  // ────────────────────────────────────────────────────────────────────────────
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setUploadingVideo(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok && data.path) {
        setUploadedUrl(data.path);
        setVideoUrl(data.path);
        
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

  const startObsBroadcast = async () => {
    try {
      cleanupStreams();
      const { error } = await supabase
        .from("live_events")
        .update({
          video_active: true,
          video_url: "obs-stream"
        })
        .eq("id", eventId);

      if (error) throw new Error(error.message);
      
      setVideoActive(true);
      setVideoUrl("obs-stream");
      setIsBroadcasting(true);
      if (onStatusChange) onStatusChange(true);
    } catch (err: any) {
      alert("Failed to start RTMP stream: " + err.message);
    }
  };

  const stopBroadcast = async () => {
    cleanupStreams();
    try {
      const { error } = await supabase
        .from("live_events")
        .update({
          video_active: false,
          video_url: null
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

  const rtmpServerUrl = "rtmp://global-live.cloudinary.com/live";
  const rtmpStreamKey = `uget_live_${eventId.replace(/[^a-zA-Z0-9]/g, "")}?cloud_name=${cloudName}`;
  const hlsDeliveryUrl = `https://res.cloudinary.com/${cloudName}/video/upload/sp_auto/uget_live_${eventId.replace(/[^a-zA-Z0-9]/g, "")}.m3u8`;

  // Determine what video asset source we should display inside the player box
  const showWebcamFeed = (isAuthor && localStream) || (!isAuthor && viewerWebcamActive && viewerStream);
  const showMockEventClip = !isAuthor && videoActive && videoUrl === "camera-stream" && !viewerWebcamActive;
  const showObsConnecting = videoActive && videoUrl === "obs-stream";
  const showCloudinaryClip = videoActive && videoUrl && videoUrl !== "camera-stream" && videoUrl !== "obs-stream";

  return (
    <div style={{ background: "white", border: "1px solid var(--border-2)", borderRadius: 20, overflow: "hidden", marginBottom: 32, boxShadow: "var(--shadow-md)" }}>
      {/* Stream Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", background: "var(--bg-2)", borderBottom: "1px solid var(--border-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🎥</span>
          <span style={{ fontWeight: 800, fontFamily: "var(--sans)", color: "var(--black)" }}>
            {isAuthor ? "Broadcasting Control Room" : "UGET Live Report Player"}
          </span>
        </div>
        <div>
          {videoActive ? (
            <span style={{ background: "#fef2f2", color: "#ef4444", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 999, fontFamily: "var(--sans)", display: "inline-flex", alignItems: "center", gap: 6, letterSpacing: "0.05em" }}>
              <span className="uget-live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
              BROADCAST ONGOING
            </span>
          ) : (
            <span style={{ background: "var(--bg-3)", color: "var(--muted)", fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 999, fontFamily: "var(--sans)" }}>
              STREAM OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* Main Video Display Area */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#060508", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        
        {/* Overlay CSS Scanlines/Vignette for live video styling */}
        {videoActive && (
          <div style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "radial-gradient(circle, transparent 50%, rgba(0,0,0,0.4) 100%)",
            boxShadow: "inset 0 0 80px rgba(0,0,0,0.6)",
            zIndex: 8
          }} />
        )}

        {/* 1. Webcam Stream (Reporter Camera Preview OR Viewer Interactive Demo Camera) */}
        {showWebcamFeed && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={!isAuthor} // Always mute viewer's self camera to avoid feedback echo
            style={{ width: "100%", height: "100%", objectFit: "cover", zIndex: 5, transform: "scaleX(-1)" }} // mirror webcam
          />
        )}

        {/* 2. Mock Event Live Broadcast Clip (Mixkit Loops of Reporter talking or City scene) */}
        {showMockEventClip && (
          <video
            src="https://assets.mixkit.co/videos/preview/mixkit-news-reporter-talking-to-camera-40619-large.mp4"
            autoPlay
            playsInline
            loop
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", zIndex: 5 }}
          />
        )}

        {/* 3. Cloudinary Uploaded Video Clip */}
        {showCloudinaryClip && (
          <video
            src={videoUrl || undefined}
            autoPlay
            controls
            playsInline
            loop
            style={{ width: "100%", height: "100%", objectFit: "contain", zIndex: 5 }}
          />
        )}

        {/* 4. OBS Connecting Screen */}
        {showObsConnecting && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", background: "linear-gradient(to bottom, #0d0b12, #181520)", zIndex: 6 }}>
            <div className="spinner" style={{ width: 44, height: 44, borderColor: "rgba(255,255,255,0.06)", borderTopColor: "var(--brand)", marginBottom: 20 }} />
            <h4 style={{ color: "white", fontSize: 18, fontWeight: 700, fontFamily: "var(--sans)", marginBottom: 8 }}>Awaiting Broadcast Feed...</h4>
            <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 400, marginBottom: 16 }}>
              The reporter is setting up their encoder. RTMP credentials are active.
            </p>
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--brand)", wordBreak: "break-all", background: "rgba(124, 58, 237, 0.1)", border: "1px solid rgba(124, 58, 237, 0.2)", padding: "6px 12px", borderRadius: 6 }}>
              HLS: {hlsDeliveryUrl.substring(0, 52)}...
            </span>
          </div>
        )}

        {/* 5. Stream Offline Placeholder */}
        {!videoActive && (
          <div style={{ padding: 32, textAlign: "center", zIndex: 6, color: "#9ca3af" }}>
            <div style={{ fontSize: 54, marginBottom: 16 }}>📡</div>
            <h4 style={{ color: "white", fontSize: 18, fontWeight: 700, fontFamily: "var(--sans)", marginBottom: 8 }}>
              {isAuthor ? "Start Live Broadcasting" : "Broadcast Stream is Offline"}
            </h4>
            <p style={{ fontSize: 14, color: "#9ca3af", maxWidth: 420, margin: "0 auto 20px", lineHeight: 1.6 }}>
              {isAuthor 
                ? "Activate your camera to transmit live news updates directly from your browser, or select alternate configurations like OBS streaming or video clip uploads."
                : "The reporter is currently drafting text updates. Tune in below to follow the live news feed."}
            </p>
          </div>
        )}

        {/* Live HUD Overlay (Blinking REC, Stopwatch, Stats) */}
        {videoActive && (
          <>
            <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 10, zIndex: 10, fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: "white", pointerEvents: "none" }}>
              <span style={{ background: "rgba(0, 0, 0, 0.75)", padding: "6px 10px", borderRadius: 6, backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 6 }}>
                <span className="uget-live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                LIVE
              </span>
              {isAuthor && videoUrl === "camera-stream" && (
                <span style={{ background: "rgba(0, 0, 0, 0.75)", padding: "6px 10px", borderRadius: 6, backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  ⏱️ {formatTime(streamDuration)}
                </span>
              )}
              <span style={{ background: "rgba(0, 0, 0, 0.75)", padding: "6px 10px", borderRadius: 6, backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                👥 {viewersCount} view{viewersCount !== 1 ? "s" : ""}
              </span>
            </div>

            <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 10, zIndex: 10, fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: "white", pointerEvents: "none" }}>
              <span style={{ background: "rgba(0, 0, 0, 0.75)", padding: "6px 10px", borderRadius: 6, backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                📶 {videoUrl === "camera-stream" ? "WEBCAM CAPTURE" : videoUrl === "obs-stream" ? "OBS RTMP" : "CDN VIDEO"}
              </span>
              {isAuthor && videoUrl === "camera-stream" && (
                <span style={{ background: "rgba(0, 0, 0, 0.75)", padding: "6px 10px", borderRadius: 6, backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {fps} FPS · {(4500 + Math.floor(Math.random() * 500))} KBPS
                </span>
              )}
            </div>
            
            {/* TV News Static Overlay Tag (bottom right) */}
            <div style={{ position: "absolute", bottom: 16, left: 16, zIndex: 10, pointerEvents: "none", color: "rgba(255,255,255,0.85)", textShadow: "0 2px 4px rgba(0,0,0,0.5)", fontFamily: "var(--sans)", display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.05em", color: "white" }}>UGET NEWS EVENT STREAM</span>
              <span style={{ fontSize: 10, opacity: 0.8, fontFamily: "monospace" }}>DEMO PREVIEW • 1080P FHD BROADCAST</span>
            </div>

            {/* Viewer floating reactions canvas track */}
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 15 }}>
              {reactions.map(r => (
                <span
                  key={r.id}
                  style={{
                    position: "absolute",
                    bottom: 24,
                    left: `${r.x}%`,
                    fontSize: 32,
                    animation: "floatUp 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards",
                    pointerEvents: "none",
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
                    "--drift": `${r.drift}px`
                  } as React.CSSProperties}
                >
                  {r.emoji}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Control Panel Footer */}
      <div style={{ padding: 24, background: "var(--bg-2)", borderTop: "1px solid var(--border-2)" }}>
        {isAuthor ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Mode selection buttons */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border-2)", paddingBottom: 16, gap: 24 }}>
              {[
                { id: "camera", label: "🎥 Live Camera Feed (Webcam)", desc: "Stream directly from browser" },
                { id: "upload", label: "📁 Upload Video Clip", desc: "Select local video file" },
                { id: "obs", label: "💻 External Encoder (OBS)", desc: "Stream via RTMP server" }
              ].map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setBroadcastMode(mode.id as any)}
                  style={{
                    background: "none",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    color: broadcastMode === mode.id ? "var(--brand)" : "var(--muted)",
                    borderBottom: broadcastMode === mode.id ? "3px solid var(--brand)" : "3px solid transparent",
                    paddingBottom: 8,
                    transition: "all 0.2s ease"
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Broadcast Option Panels */}
            {broadcastMode === "camera" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h5 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--black)" }}>Browser Camera Stream</h5>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>Click button to start streaming your camera/mic inputs to all readers.</p>
                  </div>
                  {isBroadcasting && (
                    /* Mic level visualizer bouncing bars */
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 28, width: 60, padding: 4, background: "var(--bg-3)", borderRadius: 6 }}>
                      {Array.from({ length: 6 }).map((_, i) => {
                        const factor = 0.4 + (i % 3) * 0.25;
                        const height = isBroadcasting ? Math.max(4, Math.min(22, micLevel * factor)) : 4;
                        return (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: `${height}px`,
                              background: height > 16 ? "#ef4444" : "var(--brand)",
                              borderRadius: 2,
                              transition: "height 0.08s ease"
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  {isBroadcasting ? (
                    <button type="button" onClick={stopCameraBroadcast} className="btn btn-outline" style={{ borderRadius: 999, color: "#ef4444", borderColor: "#fca5a5", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                      🛑 Terminate Live Broadcast
                    </button>
                  ) : (
                    <button type="button" onClick={startCameraBroadcast} className="btn btn-primary" style={{ borderRadius: 999, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                      🔴 Start Camera Live Broadcast
                    </button>
                  )}
                </div>
              </div>
            )}

            {broadcastMode === "upload" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
                  Upload a video file from your camera or library to Cloudinary
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <label style={{
                    padding: "11px 20px",
                    border: "1px dashed var(--brand)",
                    borderRadius: 999,
                    backgroundColor: "white",
                    color: "var(--brand)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}>
                    📁 {uploadingVideo ? "Uploading video report..." : "Select & Upload Video"}
                    <input type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: "none" }} disabled={uploadingVideo} />
                  </label>
                  {uploadedUrl && (
                    <span style={{ fontSize: 13, color: "#10b981", fontWeight: 700 }}>
                      ✓ Clip uploaded successfully to CDN!
                    </span>
                  )}
                </div>
                {uploadError && <span style={{ fontSize: 12, color: "#ef4444" }}>{uploadError}</span>}
              </div>
            )}

            {broadcastMode === "obs" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--brand)", display: "block", marginBottom: 8, letterSpacing: "0.05em" }}>
                    RTMP Connection Credentials
                  </span>
                  <div style={{ fontSize: 12, fontFamily: "monospace", display: "flex", flexDirection: "column", gap: 8, color: "var(--ink)" }}>
                    <div>
                      <strong style={{ color: "var(--muted)" }}>RTMP Server URL:</strong><br />
                      <input type="text" readOnly value={rtmpServerUrl} style={{ width: "100%", background: "white", border: "1px solid var(--border-2)", borderRadius: 6, padding: "6px 10px", fontSize: 11, marginTop: 4 }} onClick={(e) => e.currentTarget.select()} />
                    </div>
                    <div>
                      <strong style={{ color: "var(--muted)" }}>Stream Key:</strong><br />
                      <input type="text" readOnly value={rtmpStreamKey} style={{ width: "100%", background: "white", border: "1px solid var(--border-2)", borderRadius: 6, padding: "6px 10px", fontSize: 11, marginTop: 4 }} onClick={(e) => e.currentTarget.select()} />
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  {isBroadcasting && videoUrl === "obs-stream" ? (
                    <button type="button" onClick={stopBroadcast} className="btn btn-outline" style={{ borderRadius: 999, color: "#ef4444", borderColor: "#fca5a5", fontWeight: 700 }}>
                      🛑 Stop Stream Broadcast
                    </button>
                  ) : (
                    <button type="button" onClick={startObsBroadcast} className="btn btn-primary" style={{ borderRadius: 999, fontWeight: 700 }}>
                      📡 Activate Cloudinary RTMP Stream
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* General Termination for Uploaded Clip */}
            {videoActive && videoUrl && videoUrl !== "camera-stream" && videoUrl !== "obs-stream" && (
              <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-2)", paddingTop: 16 }}>
                <button type="button" onClick={stopBroadcast} className="btn btn-outline" style={{ borderRadius: 999, color: "#ef4444", borderColor: "#fca5a5", fontWeight: 700 }}>
                  🛑 Remove Uploaded Clip from Live
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Viewer dashboard: reactions & camera test */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <p style={{ fontSize: 14, color: "var(--muted)", margin: 0, maxWidth: "55%" }}>
                {videoActive
                  ? `🔴 Live news event broadcast in progress. ${videoUrl === "camera-stream" ? "Streaming via live reporter camera." : videoUrl === "obs-stream" ? "Connected to RTMP broadcaster stream." : "Playing video report clip."}`
                  : "📹 Video broadcast feed is offline. Follow the text feed below for live coverage."}
              </p>
              
              {videoActive && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {videoUrl === "camera-stream" && (
                    <button
                      type="button"
                      onClick={toggleViewerWebcam}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 999,
                        background: viewerWebcamActive ? "var(--brand)" : "white",
                        border: "1px solid var(--border)",
                        color: viewerWebcamActive ? "white" : "var(--ink)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "var(--shadow-sm)",
                        transition: "all 0.2s"
                      }}
                    >
                      {viewerWebcamActive ? "🟢 Interactive Webcam: ON" : "📸 Use My Webcam (Demo)"}
                    </button>
                  )}

                  {/* Reaction Buttons */}
                  <div style={{ display: "flex", background: "var(--bg-3)", padding: "4px 8px", borderRadius: 999, gap: 6, border: "1px solid var(--border)" }}>
                    {[
                      { emoji: "❤️", label: "Heart" },
                      { emoji: "👏", label: "Clap" },
                      { emoji: "🔥", label: "Fire" },
                      { emoji: "🎉", label: "Celebrate" }
                    ].map(react => (
                      <button
                        key={react.emoji}
                        type="button"
                        onClick={() => triggerReaction(react.emoji)}
                        title={react.label}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 18,
                          cursor: "pointer",
                          padding: 2,
                          transition: "transform 0.15s ease",
                          outline: "none"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      >
                        {react.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.45); }
          70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .uget-live-dot {
          animation: pulse-red 2s infinite;
        }
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          15% {
            transform: translateY(-20px) scale(1.3);
            opacity: 1;
          }
          100% {
            transform: translateY(-260px) scale(0.7) translateX(var(--drift));
            opacity: 0;
          }
        }
      `}} />
    </div>
  );
}
