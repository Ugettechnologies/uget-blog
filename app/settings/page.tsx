"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/db-client/client";
import type { Profile } from "@/lib/types";
import { getInitials } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [role, setRole] = useState("writer");
  const [theme, setTheme] = useState("light");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showMsg = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setUser(user);
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile(data);
            setFullName(data.full_name || "");
            setUsername(data.username || "");
            setBio(data.bio || "");
            setTwitter(data.twitter || "");
            setWebsite(data.website || "");
            setRole(data.role || "writer");
            setAvatarUrl(data.avatar_url || "");
            
            // Read theme from localStorage or DB
            const localTheme = localStorage.getItem("theme") || data.theme || "light";
            setTheme(localTheme);
          }
          setLoading(false);
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}-${Date.now()}.${ext}`;

    const { error, data } = await supabase.storage.from("avatars").upload(path, file);

    if (error) {
      showMsg(error.message, "err");
      setUploading(false);
      return;
    }

    setAvatarUrl(data.path);
    setUploading(false);
    showMsg("Profile picture uploaded!");
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else if (newTheme === "light") {
      root.classList.remove("dark");
    } else {
      // System theme
      const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
      if (darkQuery.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    const payload = {
      full_name: fullName.trim(),
      username: username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""),
      bio: bio.trim(),
      twitter: twitter.trim(),
      website: website.trim(),
      role: role,
      theme: theme,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString()
    };

    let { error } = await supabase.from("profiles").update(payload).eq("id", user.id);

    // Self-healing fallback if the database schema is not migrated yet and 'theme' column is missing
    if (error && error.message && (error.message.includes('column "theme"') || error.message.includes('theme'))) {
      const { theme: _, ...fallbackPayload } = payload;
      const retry = await supabase.from("profiles").update(fallbackPayload).eq("id", user.id);
      error = retry.error;
    }

    setSaving(false);
    if (error) {
      showMsg(error.message, "err");
    } else {
      // Update localStorage cached profile
      localStorage.setItem("uget_last_user", JSON.stringify({
        full_name: payload.full_name || user.email || "User",
        email: user.email || "",
        avatar_url: payload.avatar_url || ""
      }));
      showMsg("Settings saved successfully!");
      router.refresh();
    }
  };

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

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--ink)" }}>
      <Navbar />

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === "err" ? "toast-error" : "toast-success"}`}>
            {toast.type === "ok" ? "✓" : "✗"} {toast.msg}
          </div>
        </div>
      )}

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "60px 24px 100px" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8, color: "var(--black)" }}>
          Settings
        </h1>
        <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
          Manage your profile settings, app appearance, and event configurations.
        </p>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Avatar Upload block */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, paddingBottom: 24, borderBottom: "1px solid var(--border-2)" }}>
            <div style={{ position: "relative", width: 80, height: 80, borderRadius: "50%", background: "var(--ink-2)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", flexShrink: 0 }}>
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" width={80} height={80} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
              ) : (
                <span style={{ fontSize: 28, fontFamily: "var(--sans)", fontWeight: 700 }}>{getInitials(fullName || user?.email || "?")}</span>
              )}
              {uploading && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                </div>
              )}
            </div>
            <div>
              <div style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, color: "var(--black)", marginBottom: 4 }}>Profile photo</div>
              <p style={{ fontFamily: "var(--serif)", fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                Upload a PNG or JPEG file. Recommended size 150x150 pixels.
              </p>
              <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
                Upload photo
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Profile fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input type="text" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ background: "var(--bg-3)", border: "1px solid var(--border)", borderRight: "none", borderRadius: "8px 0 0 8px", padding: "12px 14px", fontFamily: "var(--sans)", fontSize: 15, color: "var(--muted)" }}>@</span>
                <input type="text" className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} style={{ borderRadius: "0 8px 8px 0" }} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bio (Short introduction)</label>
              <textarea className="form-input" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} style={{ resize: "vertical", fontFamily: "var(--serif)" }} placeholder="Write a short bio about yourself..." />
            </div>

            <div className="form-group">
              <label className="form-label">Twitter handle (without @)</label>
              <input type="text" className="form-input" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="username" />
            </div>

            <div className="form-group">
              <label className="form-label">Website URL</label>
              <input type="url" className="form-input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourwebsite.com" />
            </div>
          </div>

          {/* Theme & Customization block */}
          <div style={{ padding: "24px 0", borderTop: "1px solid var(--border-2)", borderBottom: "1px solid var(--border-2)", display: "flex", flexDirection: "column", gap: 20 }}>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)" }}>Appearance & Role</h3>
            
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: 12, display: "block" }}>App Theme</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                {[
                  { id: "light", label: "Light theme", icon: "☀️" },
                  { id: "dark", label: "Dark theme", icon: "🌙" },
                  { id: "system", label: "System settings", icon: "💻" },
                ].map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleThemeChange(t.id)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        padding: "16px 12px",
                        background: isSelected ? "var(--bg-3)" : "var(--bg-2)",
                        border: isSelected ? "2px solid #7c3aed" : "1px solid var(--border)",
                        borderRadius: 12,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: isSelected ? "0 4px 12px rgba(124, 58, 237, 0.12)" : "none",
                        color: "var(--ink)",
                        position: "relative"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "var(--muted-2)";
                          e.currentTarget.style.background = "var(--bg-3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.background = "var(--bg-2)";
                        }
                      }}
                    >
                      <span style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: "1px solid var(--border)",
                        background: isSelected ? "#7c3aed" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {isSelected && (
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />
                        )}
                      </span>
                      <span style={{ fontSize: 24 }}>{t.icon}</span>
                      <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: isSelected ? 600 : 500 }}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">User Role (For admin testing)</label>
              <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)} style={{ background: "var(--bg)", color: "var(--ink)", cursor: "pointer" }}>
                <option value="reader">Reader</option>
                <option value="writer">Writer</option>
                <option value="admin">🔑 Admin</option>
              </select>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, fontFamily: "var(--sans)" }}>
                🚩 Promoted roles grant access to protected dashboards. Selecting <strong>Admin</strong> will unlock the admin panel.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button type="submit" className="btn btn-primary btn-md" disabled={saving} style={{ padding: "12px 32px" }}>
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button type="button" className="btn btn-outline btn-md" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
