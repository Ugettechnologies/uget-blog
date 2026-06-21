"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import { FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import FloatingMenuExtension from "@tiptap/extension-floating-menu";
import Youtube from "@tiptap/extension-youtube";
import { useState, useRef } from "react";
import { createClient } from "@/lib/db-client/client";

interface Props {
  content: string;
  onChange: (html: string) => void;
}

const ToolbarButton = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string }) => (
  <button type="button" onClick={onClick} title={title} className={`toolbar-btn ${active ? "active" : ""}`}>
    {children}
  </button>
);

export default function TipTapEditor({ content, onChange }: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal and state management
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [unsplashOpen, setUnsplashOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  
  // Input fields
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashResults, setUnsplashResults] = useState<any[]>([]);
  const [loadingUnsplash, setLoadingUnsplash] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Tell your story…" }),
      Link.configure({ openOnClick: false }),
      ImageExtension.configure({
        inline: false,
        HTMLAttributes: {
          style: "max-width: 100%; border-radius: 8px; margin: 24px 0; display: block;",
        },
      }),
      Youtube.configure({
        inline: false,
        width: 640,
        height: 480,
        HTMLAttributes: {
          style: "width: 100%; aspect-ratio: 16/9; height: auto; border-radius: 12px; margin: 28px 0;",
        },
      }),
      FloatingMenuExtension,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onSelectionUpdate: () => setMenuExpanded(false),
    editorProps: {
      attributes: {
        class: "tiptap-editor",
        style: "min-height:450px; outline:none; font-family: var(--serif); font-size: 19px; line-height: 1.6; color: var(--ink-2);",
      },
    },
  });

  if (!editor) return null;

  // 1. Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setMenuExpanded(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please sign in to upload images.");
        setUploadingImage(false);
        return;
      }

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error, data } = await supabase.storage.from("post-images").upload(path, file, { upsert: true });
      if (error) {
        alert(`Upload error: ${error.message}`);
        setUploadingImage(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(data.path);
      
      // Insert image block
      editor.chain().focus().setImage({ src: publicUrl, alt: file.name }).run();
    } catch (err: any) {
      alert(`Unexpected error: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // 2. Unsplash Stock Photo Search Handler
  const searchUnsplash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unsplashQuery.trim()) return;

    setLoadingUnsplash(true);
    try {
      const res = await fetch(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(unsplashQuery)}&per_page=9`);
      if (res.ok) {
        const data = await res.json();
        const results = data.results.map((r: any) => ({
          id: r.id,
          thumb: r.urls.small,
          full: r.urls.regular,
          alt: r.alt_description || "Stock Image",
          photographer: r.user.name,
          photographerUrl: r.user.links.html,
        }));
        setUnsplashResults(results);
      } else {
        alert("Failed to fetch from Unsplash. Please try again.");
      }
    } catch {
      alert("Error contacting Unsplash service.");
    } finally {
      setLoadingUnsplash(false);
    }
  };

  const insertUnsplashImage = (photo: any) => {
    editor
      .chain()
      .focus()
      .insertContent(`
        <figure style="margin: 28px 0; text-align: center;">
          <img src="${photo.full}" alt="${photo.alt}" style="max-width: 100%; border-radius: 8px; display: block; margin: 0 auto;" />
          <figcaption style="margin-top: 8px; font-size: 13px; font-family: var(--sans); color: var(--muted); text-align: center;">
            Photo by <a href="${photo.photographerUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--muted); text-decoration: underline;">${photo.photographer}</a> on <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" style="color: var(--muted); text-decoration: underline;">Unsplash</a>
          </figcaption>
        </figure>
        <p></p>
      `)
      .run();
    setUnsplashOpen(false);
    setUnsplashQuery("");
    setUnsplashResults([]);
  };

  // 3. Video Embed Handler
  const insertVideoEmbed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    editor.commands.setYoutubeVideo({
      src: videoUrl.trim(),
    });

    setVideoOpen(false);
    setVideoUrl("");
  };

  // 4. Code Block
  const insertCodeBlock = () => {
    editor.chain().focus().toggleCodeBlock().run();
    setMenuExpanded(false);
  };

  // 5. Separator (Horizontal Rule)
  const insertSeparator = () => {
    editor.chain().focus().setHorizontalRule().run();
    setMenuExpanded(false);
  };

  const optionBtnStyle = {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "1px solid var(--border)",
    background: "var(--bg-2)",
    color: "var(--ink)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s ease",
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Standard Toolbar */}
      <div className="editor-toolbar" style={{ display: "flex", alignItems: "center", gap: 2, padding: "8px 0", marginBottom: 16, borderBottom: "1px solid var(--border-2)", flexWrap: "wrap" }}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <strong style={{ fontSize: 14 }}>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <em style={{ fontSize: 14 }}>I</em>
        </ToolbarButton>
        <div className="toolbar-sep" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading">
          <span style={{ fontSize: 12, fontWeight: 700 }}>H1</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Subheading">
          <span style={{ fontSize: 12, fontWeight: 700 }}>H2</span>
        </ToolbarButton>
        <div className="toolbar-sep" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.242 5.992h12m-12 6.003H20.24m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 2.577a1.125 1.125 0 113.262 0c-.145.223-.334.402-.583.562-.61.394-1.016.925-1.034 1.512v.02h3m-3 0h3m-3 3.12h3" />
          </svg>
        </ToolbarButton>
        <div className="toolbar-sep" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
        </ToolbarButton>
        <div className="toolbar-sep" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Floating Menu for empty lines (Medium-like plus button) */}
      <FloatingMenu editor={editor} options={{ placement: "left-start", offset: 12 }}>
        <div className="editor-floating-menu">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setMenuExpanded(!menuExpanded);
            }}
            className={`floating-menu-btn ${menuExpanded ? "active" : ""}`}
            title="More options"
          >
            +
          </button>

          <div className={`floating-menu-options ${menuExpanded ? "open" : ""}`}>
            {/* Photo Upload */}
            <button 
              type="button" 
              onMouseDown={(e) => {
                e.preventDefault();
                fileInputRef.current?.click();
              }}
              className="floating-option-btn" 
              title="Upload Image"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>

            {/* Unsplash Search */}
            <button 
              type="button" 
              onMouseDown={(e) => {
                e.preventDefault();
                setUnsplashOpen(true);
                setMenuExpanded(false);
              }}
              className="floating-option-btn" 
              title="Search Unsplash"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Video Embed */}
            <button 
              type="button" 
              onMouseDown={(e) => {
                e.preventDefault();
                setVideoOpen(true);
                setMenuExpanded(false);
              }}
              className="floating-option-btn" 
              title="Embed Video"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button>

            {/* Code block */}
            <button 
              type="button" 
              onMouseDown={(e) => {
                e.preventDefault();
                insertCodeBlock();
              }}
              className="floating-option-btn" 
              title="Insert Code Block"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>

            {/* Separator */}
            <button 
              type="button" 
              onMouseDown={(e) => {
                e.preventDefault();
                insertSeparator();
              }}
              className="floating-option-btn" 
              title="Insert Divider"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <circle cx="12" cy="6" r="1" />
                <circle cx="12" cy="18" r="1" />
              </svg>
            </button>
          </div>
        </div>
      </FloatingMenu>

      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* Editor Content Area */}
      {uploadingImage && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-3)", marginBottom: 12 }}>
          <div className="spinner" style={{ width: 16, height: 16, borderColor: "var(--border)", borderTopColor: "var(--ink)" }} />
          <span style={{ fontSize: 13, fontFamily: "var(--sans)", color: "var(--muted)" }}>Uploading image to story…</span>
        </div>
      )}
      
      <EditorContent editor={editor} />

      {/* ── Unsplash Search Modal ── */}
      {unsplashOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setUnsplashOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Unsplash Stock Photos</h2>
              <button onClick={() => setUnsplashOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--muted)" }}>✕</button>
            </div>
            
            <form onSubmit={searchUnsplash} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search high-resolution photos (e.g. tech, design, writing)..."
                value={unsplashQuery}
                onChange={(e) => setUnsplashQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: "0 24px" }} disabled={loadingUnsplash}>
                {loadingUnsplash ? "Searching…" : "Search"}
              </button>
            </form>

            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {loadingUnsplash ? (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <div className="spinner" style={{ margin: "0 auto", borderColor: "var(--border)", borderTopColor: "var(--ink)" }} />
                </div>
              ) : unsplashResults.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                  {unsplashQuery ? "No results found. Try another query." : "Type a query and search high-quality photos."}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {unsplashResults.map((photo) => (
                    <div 
                      key={photo.id}
                      onClick={() => insertUnsplashImage(photo)}
                      style={{ 
                        aspectRatio: "4/3", 
                        borderRadius: 8, 
                        overflow: "hidden", 
                        cursor: "pointer", 
                        position: "relative",
                        border: "1px solid var(--border-2)" 
                      }}
                      title={`By ${photo.photographer}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={photo.thumb} 
                        alt={photo.alt} 
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.2s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      />
                      <div style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                        padding: "6px 8px",
                        color: "white",
                        fontSize: 10,
                        fontFamily: "var(--sans)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        👤 {photo.photographer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Video Embed Modal ── */}
      {videoOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setVideoOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Embed Video</h2>
              <button onClick={() => setVideoOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--muted)" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--muted)", fontFamily: "var(--sans)" }}>
              Paste a link from YouTube (e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ) or a direct MP4 URL to embed it.
            </p>
            
            <form onSubmit={insertVideoEmbed} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <input 
                type="url" 
                className="form-input" 
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                required
              />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setVideoOpen(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Embed video</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
