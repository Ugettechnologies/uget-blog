"use client";
import { useState, useEffect, useCallback } from "react";
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

export default function WritePage() {
  const router = useRouter();
  const params = useParams();
  const editId = params?.id as string | undefined;

  const [user, setUser] = useState<{ id: string } | null>(null);
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
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth"); return; }
      setUser(user);
    });
  // eslint-disable-next-line react-hooks
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
      author_id: user.id,
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h2 className="modal-title">Publish your story</h2>
            <p className="modal-desc">Review your settings before publishing.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
              {/* Cover preview */}
              <div>
                <div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Story preview</div>
                <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", aspectRatio: "4/3", background: "var(--bg-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {coverImage ? (
                    <Image src={coverImage} alt="Preview" width={240} height={180} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                  ) : (
                    <span style={{ fontSize: 32 }}>📝</span>
                  )}
                </div>
              </div>
              {/* Settings */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Category</div>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input" style={{ fontSize: 14 }}>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Tags <span style={{ fontWeight: 400, textTransform: "none" }}>(up to 5)</span></div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {tags.map((t) => (
                      <span key={t} style={{ background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 999, padding: "3px 10px", fontFamily: "var(--sans)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                        {t}
                        <button onClick={() => setTags(tags.filter((x) => x !== t))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-2)", padding: 0, lineHeight: 1 }}>✕</button>
                      </span>
                    ))}
                  </div>
                  <input type="text" className="form-input" placeholder="Add tag, press Enter" value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} style={{ fontSize: 13 }} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowSettings(false)} className="btn btn-outline btn-md" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => { setShowSettings(false); savePost(true); }} disabled={publishing}
                className="btn btn-primary btn-md" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {publishing ? <div className="spinner" /> : null}
                Publish now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
