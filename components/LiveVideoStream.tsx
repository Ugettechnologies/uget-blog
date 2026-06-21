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

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoActive, setVideoActive] = useState(videoActiveInitial);
  const [isLocalStreaming, setIsLocalStreaming] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [isMuted, setIsMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Simulated streaming statistics
  const [stats, setStats] = useState({
    uptime: "00:00",
    bitrate: 0,
    fps: 30,
    viewers: 12
  });

  // Track stream uptime
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let startTime = Date.now();
    if (isLocalStreaming || (videoActive && !isAuthor)) {
      timer = setInterval(() => {
        const diff = Date.now() - startTime;
        const mins = Math.floor(diff / 60000).toString().padStart(2, "0");
        const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
        setStats(prev => ({
          ...prev,
          uptime: `${mins}:${secs}`,
          bitrate: isLocalStreaming ? Math.floor(2200 + Math.random() * 600) : 0,
          viewers: isLocalStreaming ? Math.floor(15 + Math.random() * 10) : prev.viewers
        }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocalStreaming, videoActive, isAuthor]);

  // Load available camera devices
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(deviceInfos => {
          const videoInputs = deviceInfos.filter(device => device.kind === "videoinput");
          setDevices(videoInputs);
          if (videoInputs.length > 0) {
            setSelectedVideoDevice(videoInputs[0].deviceId);
          }
        })
        .catch(err => {
          console.warn("Could not list media devices:", err);
        });
    }
  }, []);

  // Poll database periodically to see if video broadcast has started (for viewers)
  useEffect(() => {
    if (isAuthor) return; // Authors manage their own state

    const checkStatus = async () => {
      const { data, error } = await supabase
        .from("live_events")
        .select("video_active")
        .eq("id", eventId)
        .single();
      if (!error && data) {
        setVideoActive(data.video_active);
        if (onStatusChange) {
          onStatusChange(data.video_active);
        }
      }
    };

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [eventId, isAuthor, onStatusChange]);

  // Start local camera stream
  const startCamera = async (deviceId?: string) => {
    setErrorMsg(null);
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      setErrorMsg("Camera access is not supported in this browser. Ensure you are using HTTPS or localhost.");
      return;
    }

    try {
      // Stop existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: true
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraEnabled(true);
      setIsMuted(false);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Permission denied. Please grant camera and microphone access in your browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMsg("No camera device found on your system. Please connect a webcam.");
      } else {
        setErrorMsg(`Failed to access camera: ${err.message || "Unknown error"}`);
      }
    }
  };

  // Stop local camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLocalStreaming(false);
  };

  // Toggle audio (mute)
  const toggleMute = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video (hide camera)
  const toggleCamera = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setCameraEnabled(!cameraEnabled);
    }
  };

  // Start Broadcast
  const startBroadcast = async () => {
    if (!stream) {
      await startCamera(selectedVideoDevice);
    }
    
    try {
      const { error } = await supabase
        .from("live_events")
        .update({ video_active: true })
        .eq("id", eventId);
      
      if (error) throw new Error(error.message);

      setVideoActive(true);
      setIsLocalStreaming(true);
      if (onStatusChange) onStatusChange(true);
    } catch (err: any) {
      alert("Failed to start broadcast: " + err.message);
    }
  };

  // Stop Broadcast
  const stopBroadcast = async () => {
    try {
      const { error } = await supabase
        .from("live_events")
        .update({ video_active: false })
        .eq("id", eventId);

      if (error) throw new Error(error.message);

      setVideoActive(false);
      setIsLocalStreaming(false);
      stopCamera();
      if (onStatusChange) onStatusChange(false);
    } catch (err: any) {
      alert("Failed to stop broadcast: " + err.message);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div style={{ background: "white", border: "1px solid var(--border-2)", borderRadius: 16, overflow: "hidden", marginBottom: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "var(--bg-2)", borderBottom: "1px solid var(--border-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🎥</span>
          <span style={{ fontWeight: 700, fontFamily: "var(--sans)", color: "var(--black)" }}>
            {isAuthor ? "Video Broadcast Control Panel" : "Live Video Stream"}
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
              OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* Main player display */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#0c0a0f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
        
        {/* Stream output video tag */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isAuthor || isMuted}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: stream || (videoActive && !isAuthor) ? "block" : "none"
          }}
        />

        {/* Viewers: Stream Active, simulated content */}
        {videoActive && !isAuthor && !stream && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", background: "linear-gradient(to bottom, rgba(12, 10, 15, 0.9), rgba(28, 25, 35, 0.95))" }}>
            <div className="spinner" style={{ width: 36, height: 36, borderColor: "rgba(255,255,255,0.1)", borderTopColor: "var(--brand)", marginBottom: 16 }} />
            <h4 style={{ color: "white", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Connecting to Video Feed...</h4>
            <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 360 }}>
              The reporter has started a live camera transmission. Setting up connection tunnels.
            </p>
            
            {/* Viewers Camera Test Utility */}
            <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20 }}>
              <button 
                onClick={() => startCamera()}
                className="btn btn-outline" 
                style={{ color: "white", borderColor: "rgba(255,255,255,0.2)", borderRadius: 999, padding: "6px 16px", fontSize: 12 }}
              >
                📹 Test My Camera Device
              </button>
            </div>
          </div>
        )}

        {/* Placeholder: Stream offline */}
        {(!stream && (!videoActive || isAuthor)) && (
          <div style={{ padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
            <h4 style={{ color: "white", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              {isAuthor ? "Configure Camera Stream" : "No Video Stream Active"}
            </h4>
            <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 320, margin: "0 auto 16px" }}>
              {isAuthor 
                ? "Grant camera access to start streaming live video updates directly from your device."
                : "The reporter is currently posting text-based live updates."}
            </p>
            
            {isAuthor ? (
              <button
                onClick={() => startCamera(selectedVideoDevice)}
                className="btn btn-primary"
                style={{ borderRadius: 999, padding: "8px 20px", fontSize: 13 }}
              >
                📹 Initialize Camera
              </button>
            ) : (
              <button
                onClick={() => startCamera()}
                className="btn btn-outline"
                style={{ borderRadius: 999, padding: "8px 20px", fontSize: 13, color: "white", borderColor: "rgba(255,255,255,0.2)" }}
              >
                📹 Test Local Camera
              </button>
            )}
          </div>
        )}

        {/* Error Message Overlay */}
        {errorMsg && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(12, 10, 15, 0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
            <span style={{ fontSize: 32, marginBottom: 12 }}>⚠️</span>
            <h4 style={{ color: "#f87171", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Camera Error</h4>
            <p style={{ fontSize: 12, color: "#d1d5db", maxWidth: 340, lineHeight: 1.5, marginBottom: 16 }}>{errorMsg}</p>
            <button
              onClick={() => startCamera(selectedVideoDevice)}
              className="btn btn-outline"
              style={{ color: "white", borderColor: "rgba(255,255,255,0.3)", borderRadius: 999, padding: "6px 16px", fontSize: 12 }}
            >
              🔄 Retry Connection
            </button>
          </div>
        )}

        {/* Broadcast Overlay Dashboard (HUD) */}
        {(stream || (videoActive && !isAuthor)) && (
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 8, zIndex: 10, fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: "white" }}>
            <span style={{ background: "rgba(0, 0, 0, 0.6)", padding: "4px 8px", borderRadius: 4, backdropFilter: "blur(4px)" }}>
              ⏱️ {stats.uptime}
            </span>
            {isLocalStreaming && (
              <span style={{ background: "rgba(0, 0, 0, 0.6)", padding: "4px 8px", borderRadius: 4, backdropFilter: "blur(4px)" }}>
                📶 {stats.bitrate} kbps
              </span>
            )}
            <span style={{ background: "rgba(0, 0, 0, 0.6)", padding: "4px 8px", borderRadius: 4, backdropFilter: "blur(4px)" }}>
              👥 {stats.viewers} watching
            </span>
          </div>
        )}
      </div>

      {/* Control panel controls */}
      <div style={{ padding: 20, background: "var(--bg-2)", borderTop: "1px solid var(--border-2)", display: "flex", flexDirection: "column", gap: 16 }}>
        {isAuthor ? (
          <>
            {/* Device selectors */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Select Video Device</label>
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => {
                    setSelectedVideoDevice(e.target.value);
                    if (stream) startCamera(e.target.value);
                  }}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border-2)", borderRadius: 8, fontSize: 13, background: "white", outline: "none", color: "var(--ink)" }}
                >
                  {devices.length === 0 ? (
                    <option value="">Default System Camera</option>
                  ) : (
                    devices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Webcam ${devices.indexOf(device) + 1}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Hardware toggles */}
              {stream && (
                <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                  <button
                    onClick={toggleCamera}
                    style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border-2)", background: cameraEnabled ? "white" : "#fee2e2", color: cameraEnabled ? "var(--ink)" : "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {cameraEnabled ? "📷 Turn Camera Off" : "📷 Turn Camera On"}
                  </button>
                  <button
                    onClick={toggleMute}
                    style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border-2)", background: !isMuted ? "white" : "#fee2e2", color: !isMuted ? "var(--ink)" : "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {!isMuted ? "🎤 Mute Mic" : "🎤 Unmute Mic"}
                  </button>
                </div>
              )}
            </div>

            {/* Broadcast action triggers */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid var(--border-2)", paddingTop: 16 }}>
              {stream && (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="btn btn-outline"
                  style={{ borderRadius: 999, padding: "8px 20px" }}
                  disabled={isLocalStreaming}
                >
                  Stop Camera
                </button>
              )}
              
              {isLocalStreaming ? (
                <button
                  type="button"
                  onClick={stopBroadcast}
                  className="btn btn-outline"
                  style={{ borderRadius: 999, padding: "8px 20px", color: "#ef4444", borderColor: "#fca5a5" }}
                >
                  🔴 End Video Broadcast
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startBroadcast}
                  className="btn btn-primary"
                  style={{ borderRadius: 999, padding: "8px 20px" }}
                >
                  🎬 Go Live on Video
                </button>
              )}
            </div>
          </>
        ) : (
          // Viewers Panel info
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
              {videoActive 
                ? "🔴 Watch real-time video coverage directly from the reporter's location."
                : "📹 Video transmission is currently offline. Follow the text feed for live reporting."}
            </p>
            {stream && (
              <button
                onClick={stopCamera}
                className="btn btn-outline"
                style={{ borderRadius: 999, padding: "6px 14px", fontSize: 12 }}
              >
                Close Local Test Stream
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
