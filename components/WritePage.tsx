"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/db-client/client";
import { CATEGORIES, slugify, estimateReadTime } from "@/lib/types";

// Dynamic TipTap import to avoid SSR issues
import dynamic from "next/dynamic";
const TipTapEditor = dynamic(() => import("./TipTapEditor"), { ssr: false, loading: () => (
  <div style={{ minHeight: 400, padding: "20px 0", color: "var(--muted-2)", fontFamily: "var(--serif)", fontSize: 19 }}>
    Loading editor…
  </div>
) });

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string; icon?: string; description?: string }[];
  label: string;
}

function CustomSelect({ value, onChange, options, label }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          border: isOpen ? "1px solid var(--brand)" : "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          background: "var(--input-bg, white)",
          color: "var(--ink)",
          cursor: "pointer",
          textAlign: "left",
          fontSize: 14,
          fontFamily: "var(--sans)",
          outline: "none",
          transition: "all 0.2s ease",
          boxShadow: isOpen ? "0 0 0 3px rgba(124, 58, 237, 0.08)" : "none"
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {selectedOption?.icon && <span style={{ fontSize: 16 }}>{selectedOption.icon}</span>}
          <span style={{ fontWeight: 500 }}>{selectedOption?.label}</span>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: "var(--muted)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease"
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          right: 0,
          background: "var(--modal-bg, white)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-md)",
          zIndex: 210,
          maxHeight: 220,
          overflowY: "auto",
          animation: "slideDown 0.15s ease-out"
        }}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  cursor: "pointer",
                  background: isSelected ? "var(--brand-light)" : "transparent",
                  color: isSelected ? "var(--brand)" : "var(--ink)",
                  fontSize: 14,
                  fontFamily: "var(--sans)",
                  transition: "background 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "var(--bg-3)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {opt.icon && <span style={{ fontSize: 16 }}>{opt.icon}</span>}
                  <div>
                    <div style={{ fontWeight: isSelected ? 600 : 400 }}>{opt.label}</div>
                    {opt.description && (
                      <div style={{ fontSize: 11, color: isSelected ? "var(--brand)" : "var(--muted-2)", marginTop: 2 }}>{opt.description}</div>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function WritePage() {
  const router = useRouter();
  const params = useParams();
  const editId = params?.id as string | undefined;

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [publishAsStaff, setPublishAsStaff] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("technology");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const supabase = createClient();

  const showMsg = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/auth"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin" && profile?.role !== "staff" && profile?.role !== "writer") {
        router.push("/");
        return;
      }
      setUser(user);
      setUserProfile(profile);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load existing post for editing
  useEffect(() => {
    if (!editId) return;
    supabase.from("posts").select("*").eq("id", editId).single().then(({ data }) => {
      if (!data) return;
      setTitle(data.title);
      setSubtitle(data.excerpt || "");
      setContent(data.content);
      setCategory(data.category);
      setTags(data.tags || []);
      setCoverImage(data.cover_image || "");
      setPublished(data.published);
      setFeatured(data.featured);
      setPostId(data.id);
      if (data.author_id === "c0de57af-f011-0e5a-ff55-c0de57aff555") {
        setPublishAsStaff(true);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingCover(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error, data } = await supabase.storage.from("post-images").upload(path, file, { upsert: true });
    if (error) { showMsg(error.message, "err"); setUploadingCover(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(data.path);
    setCoverImage(publicUrl);
    setUploadingCover(false);
    showMsg("Cover image uploaded!");
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (t && !tags.includes(t) && tags.length < 5) {
        setTags([...tags, t]);
        setTagInput("");
      }
    }
  };

  const savePost = async (pub: boolean) => {
    if (!user || !title.trim()) { showMsg("Title is required", "err"); return; }
    const isPublishing = pub;
    if (isPublishing) setPublishing(true); else setSaving(true);

    const slug = slugify(title) + "-" + Math.random().toString(36).slice(2, 6);
    const readTime = estimateReadTime(content);
    const payload = {
      title: title.trim(),
      slug: postId ? undefined : slug,
      excerpt: subtitle.trim() || content.replace(/<[^>]*>/g, "").slice(0, 160) + "…",
      content,
      cover_image: coverImage || null,
      category,
      tags,
      author_id: publishAsStaff ? "c0de57af-f011-0e5a-ff55-c0de57aff555" : user.id,
      published: pub,
      featured,
      read_time: readTime,
      updated_at: new Date().toISOString(),
    };

    let error, data;
    if (postId) {
      ({ error, data } = await supabase.from("posts").update(payload).eq("id", postId).select().single());
    } else {
      ({ error, data } = await supabase.from("posts").insert({ ...payload, slug }).select().single());
      if (data) setPostId(data.id);
    }

    if (error) { showMsg(error.message, "err"); }
    else {
      showMsg(pub ? "Published!" : "Draft saved");
      setPublished(pub);
      if (pub && data) router.push(`/post/${data.slug}`);
    }
    setSaving(false); setPublishing(false);
  };

  return (
    <div className="editor-page">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === "err" ? "toast-error" : "toast-success"}`}>
            {toast.type === "ok" ? "✓" : "✗"} {toast.msg}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="editor-topbar">
        <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted-2)", flex: 1 }}>
          {published ? "Published" : "Draft"} · {estimateReadTime(content)} min read
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => savePost(false)} disabled={saving}
            className="btn btn-outline btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {saving ? <div className="spinner" style={{ width: 14, height: 14, borderColor: "var(--border)", borderTopColor: "var(--ink)" }} /> : null}
            Save draft
          </button>
          <button onClick={() => setShowSettings(true)}
            className="btn btn-primary btn-sm">
            Publish
          </button>
        </div>
      </div>

      {/* Cover image */}
      <div className="editor-cover-upload">
        {coverImage ? (
          <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", maxHeight: 320 }}>
            <Image src={coverImage} alt="Cover" width={800} height={320} style={{ width: "100%", height: 320, objectFit: "cover" }} />
            <button onClick={() => setCoverImage("")}
              style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              ✕
            </button>
          </div>
        ) : (
          <label className="editor-cover-btn">
            {uploadingCover ? (
              <><div className="spinner" style={{ width: 18, height: 18, borderColor: "var(--border)", borderTopColor: "var(--muted)" }} />Uploading…</>
            ) : (
              <><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>Add a cover image</>
            )}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
          </label>
        )}
      </div>

      {/* Title + subtitle */}
      <div className="editor-wrap">
        <textarea
          value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="editor-title"
          style={{ resize: "none", overflow: "hidden", height: "auto", width: "100%", border: "none", outline: "none" }}
          rows={1}
          onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
        />
        <textarea
          value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Add a subtitle…"
          className="editor-subtitle-input"
          style={{ resize: "none", overflow: "hidden", width: "100%", border: "none", outline: "none" }}
          rows={1}
          onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
        />
        <div style={{ borderTop: "1px solid var(--border-2)", marginBottom: 24 }} />
        <TipTapEditor content={content} onChange={setContent} />
      </div>

      {/* Publish settings modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, borderRadius: 24, padding: "32px 36px", border: "1px solid var(--border)", background: "var(--modal-bg, white)" }}>
            <h2 className="modal-title" style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--display)", color: "var(--black)", marginBottom: 6 }}>Publish your story</h2>
            <p className="modal-desc" style={{ fontSize: 14, color: "var(--muted)", fontFamily: "var(--sans)", marginBottom: 28 }}>Review your settings before publishing.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 32, marginBottom: 32 }}>
              {/* Cover preview card */}
              <div>
                <div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Story preview</div>
                
                <div style={{ 
                  border: "1px solid var(--border)", 
                  borderRadius: 16, 
                  overflow: "hidden", 
                  background: "var(--bg-2)", 
                  boxShadow: "var(--shadow-md)",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  minHeight: 280,
                  justifyContent: "space-between"
                }}>
                  {/* Card cover image / default gradient */}
                  <div style={{ position: "relative", width: "100%", height: 130, overflow: "hidden" }}>
                    {coverImage ? (
                      <Image src={coverImage} alt="Preview" width={280} height={130} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                    ) : (
                      <div style={{ 
                        width: "100%", 
                        height: "100%", 
                        background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        position: "relative"
                      }}>
                        <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.15)", filter: "blur(10px)" }} />
                        <div style={{ position: "absolute", bottom: -20, left: -20, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.15)", filter: "blur(10px)" }} />
                        <div style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 32, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.15))" }}>📝</span>
                          <span style={{ fontSize: 9, fontFamily: "var(--sans)", color: "rgba(255,255,255,0.85)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>EchoGist Story Preview</span>
                        </div>
                      </div>
                    )}
                    {/* Category tag on image */}
                    <span style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: "rgba(0, 0, 0, 0.65)",
                      backdropFilter: "blur(6px)",
                      color: "white",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 999,
                      fontFamily: "var(--sans)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      {CATEGORIES.find(c => c.id === category)?.icon} {CATEGORIES.find(c => c.id === category)?.label || category}
                    </span>
                  </div>

                  {/* Card body content */}
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8, flexGrow: 1, justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ 
                        fontFamily: "var(--display)", 
                        fontSize: 15, 
                        fontWeight: 700, 
                        color: "var(--black)", 
                        lineHeight: 1.3,
                        margin: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {title.trim() || "Untitled Story"}
                      </h3>
                      <p style={{ 
                        fontFamily: "var(--serif)", 
                        fontSize: 12, 
                        color: "var(--muted)", 
                        lineHeight: 1.4,
                        marginTop: 4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {subtitle.trim() || content.replace(/<[^>]*>/g, "").slice(0, 100).trim() || "No excerpt added yet. Write your story to generate a preview here."}
                      </p>
                    </div>

                    {/* Card footer details */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-2)", paddingTop: 10, marginTop: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ 
                          width: 20, 
                          height: 20, 
                          borderRadius: "50%", 
                          background: "var(--brand)", 
                          color: "white", 
                          fontSize: 9, 
                          fontWeight: 700, 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center" 
                        }}>
                          {publishAsStaff ? "E" : (userProfile?.full_name?.[0] || "W")}
                        </div>
                        <span style={{ fontSize: 11, fontFamily: "var(--sans)", color: "var(--ink-2)", fontWeight: 600 }}>
                          {publishAsStaff ? "EchoGist Staff" : (userProfile?.full_name || "You")}
                        </span>
                      </div>
                      <span style={{ fontSize: 10, fontFamily: "var(--sans)", color: "var(--muted-2)" }}>
                        {estimateReadTime(content)} min read
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Form */}
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {(userProfile?.role === "admin" || userProfile?.role === "staff") && (
                  <CustomSelect
                    label="Publish As"
                    value={publishAsStaff ? "staff" : "self"}
                    onChange={(val) => setPublishAsStaff(val === "staff")}
                    options={[
                      { value: "self", label: `Yourself (${userProfile?.full_name || "Writer"})`, icon: "👤", description: "Publish under your personal profile" },
                      { value: "staff", label: "EchoGist Staff", icon: "🏢", description: "Publish as official publication staff" }
                    ]}
                  />
                )}
                
                <CustomSelect
                  label="Category"
                  value={category}
                  onChange={setCategory}
                  options={CATEGORIES.map(c => ({
                    value: c.id,
                    label: c.label,
                    icon: c.icon
                  }))}
                />

                <div>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Tags <span style={{ fontWeight: 400, textTransform: "none" }}>(up to 5)</span></div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {tags.map((t) => (
                      <span key={t} style={{ background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 999, padding: "4px 10px", fontFamily: "var(--sans)", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500, color: "var(--ink-2)" }}>
                        #{t}
                        <button onClick={() => setTags(tags.filter((x) => x !== t))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0, lineHeight: 1, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, borderRadius: "50%" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--red)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted)"}>✕</button>
                      </span>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Add tag, press Enter" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)} 
                    onKeyDown={handleAddTag} 
                    style={{ fontSize: 13, padding: "10px 14px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", outline: "none", fontFamily: "var(--sans)", background: "var(--input-bg, white)", color: "var(--ink)" }} 
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, borderTop: "1px solid var(--border-2)", paddingTop: 20 }}>
              <button onClick={() => setShowSettings(false)} className="btn btn-outline btn-md" style={{ flex: 1, borderRadius: 999, padding: "10px 20px", fontWeight: 600, fontSize: 14 }}>Cancel</button>
              <button onClick={() => { setShowSettings(false); savePost(true); }} disabled={publishing}
                className="btn btn-primary btn-md" style={{ flex: 1, borderRadius: 999, padding: "10px 20px", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {publishing ? <div className="spinner" /> : null}
                Publish now
              </button>
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
