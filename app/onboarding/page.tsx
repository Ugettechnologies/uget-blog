"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/db-client/client";
import { getInitials } from "@/lib/types";

// Categorized topics from the user screenshots
const TOPIC_CATEGORIES = [
  {
    name: "Technology",
    topics: [
      "Technology", "AI", "Artificial Intelligence", "Cybersecurity", 
      "AWS", "LLM", "ChatGPT", "UX", "UX Design", 
      "Android", "iOS", "Apple", "AI Agent", "Future", "Tech", "Kubernetes"
    ]
  },
  {
    name: "Programming",
    topics: [
      "Programming", "Data Science", "Software Development", "Python", 
      "Software Engineering", "Machine Learning", "DevOps", "Web Development", 
      "Data Engineering", "Java", "JavaScript", "Flutter", "Deep Learning", "React"
    ]
  },
  {
    name: "Wellness",
    topics: [
      "Psychology", "Self Improvement", "Mental Health", "Productivity", 
      "Spirituality", "Personal Growth", "Wellness", "Mindfulness", 
      "Fitness", "Personal Development", "Motivation", "Sports"
    ]
  },
  {
    name: "Business",
    topics: [
      "Business", "Money", "Entrepreneurship", "Leadership", 
      "Startup", "Careers", "Finance", "Investing", "Work", 
      "Marketing", "Cryptocurrency"
    ]
  },
  {
    name: "Culture",
    topics: [
      "Science", "Writing", "Culture", "Philosophy", "Education", 
      "Books", "Humor", "Space", "Inspiration", "Creativity", 
      "Art", "Music", "Gaming", "Math"
    ]
  },
  {
    name: "Society",
    topics: [
      "Society", "News", "War", "Economics", "Religion", 
      "Christianity", "Feminism", "Geopolitics", "World", 
      "Justice", "Equality", "Ukraine War"
    ]
  },
  {
    name: "Life",
    topics: [
      "Life", "Relationships", "Love"
    ]
  }
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        // Redirect to login if not logged in
        router.push("/?auth=signin");
        return;
      }
      setUser(user);
      
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);
      if (prof?.interests && Array.isArray(prof.interests)) {
        setSelected(prof.interests);
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const toggleTopic = (topic: string) => {
    setSelected((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  const handleContinue = async () => {
    if (selected.length < 3) return;
    setSaving(true);

    // Always save selections to localStorage as a backup
    try {
      localStorage.setItem("uget_user_interests", JSON.stringify(selected));
    } catch (_) {}

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ interests: selected })
        .eq("id", user.id);

      if (error) {
        console.warn("interests column update failed, trying migration then retrying:", error.message);

        // Try to run migration to add interests column
        try {
          await fetch("/api/migrate");
        } catch (_) {}

        // Retry saving after migration
        const retry = await supabase
          .from("profiles")
          .update({ interests: selected })
          .eq("id", user.id);

        if (retry.error) {
          // Still failed — but we've saved to localStorage, so we can continue gracefully
          console.error("Retry also failed:", retry.error.message);
          // Don't block the user — just redirect since interests are saved locally
        }
      }

      // Always redirect — interests are saved in localStorage as fallback
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Unexpected error saving interests:", err);
      // Save to localStorage already done above, still redirect gracefully
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
        <div className="spinner" style={{ borderTopColor: "var(--brand)", width: 40, height: 40 }} />
        <p style={{ fontFamily: "var(--sans)", color: "var(--muted)", marginTop: 16 }}>Loading preferences…</p>
      </div>
    );
  }

  const remaining = 3 - selected.length;

  return (
    <div className="onboarding-page-container">
      {/* Mini Navbar */}
      <header style={{ borderBottom: "1px solid var(--border)", padding: "16px 24px", position: "sticky", top: 0, background: "var(--nav-bg)", zIndex: 100, backdropFilter: "blur(8px)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <Image src="/favicon.png" alt="EchoGist" width={24} height={24} />
            <span style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--brand)" }}>EchoGist</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>
              {profile?.full_name || user.email}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px" }}>
        {/* Custom Orbits SVG Illustration */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <svg viewBox="0 0 100 100" width="80" height="80" style={{ transform: "rotate(-10deg)" }}>
            <circle cx="50" cy="50" r="40" stroke="rgba(124, 58, 237, 0.1)" strokeWidth="1" fill="none" />
            <circle cx="50" cy="50" r="30" stroke="rgba(124, 58, 237, 0.15)" strokeWidth="1" fill="none" />
            <circle cx="50" cy="50" r="20" stroke="rgba(124, 58, 237, 0.2)" strokeWidth="1" fill="none" />
            <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(124, 58, 237, 0.05)" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(124, 58, 237, 0.05)" strokeWidth="0.8" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="5" fill="var(--brand)" />
            <circle cx="20" cy="50" r="3.5" fill="#ef4444" />
            <circle cx="50" cy="20" r="3" fill="#f59e0b" />
            <path d="M 50 10 A 40 40 0 0 1 90 50" stroke="var(--brand)" strokeWidth="1.2" fill="none" />
            <path d="M 50 80 A 30 30 0 0 1 20 50" stroke="#10b981" stroke-width="1.2" fill="none" />
          </svg>
        </div>

        <h1 style={{ fontFamily: "var(--serif)", fontSize: 36, fontWeight: 400, color: "var(--black)", textAlign: "center", marginBottom: 12, letterSpacing: "-0.02em" }}>
          What would you like to read?
        </h1>
        <p style={{ fontFamily: "var(--sans)", fontSize: 16, color: "var(--muted)", textAlign: "center", marginBottom: 48 }}>
          Choose 3 topics or more to continue.
        </p>

        {/* Categories Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          {TOPIC_CATEGORIES.map((category) => (
            <section key={category.name}>
              <h2 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, color: "var(--black)", marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                {category.name}
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 8px" }}>
                {category.topics.map((topic) => {
                  const isSelected = selected.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={`topic-pill-btn ${isSelected ? "selected" : ""}`}
                    >
                      {isSelected && (
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {topic}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Bottom Bar (Floating on mobile, static on desktop) */}
      <div className="onboarding-bottom-bar">
        <button
          type="button"
          onClick={handleContinue}
          disabled={selected.length < 3 || saving}
          style={{
            minWidth: 200,
            padding: "12px 32px",
            borderRadius: "999px",
            fontFamily: "var(--sans)",
            fontSize: 15,
            fontWeight: 600,
            cursor: selected.length >= 3 ? "pointer" : "default",
            backgroundColor: selected.length >= 3 ? "var(--black)" : "var(--bg-3)",
            color: selected.length >= 3 ? "var(--bg)" : "var(--muted-2)",
            border: "none",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            if (selected.length >= 3) {
              e.currentTarget.style.backgroundColor = "var(--brand)";
              e.currentTarget.style.color = "white";
            }
          }}
          onMouseLeave={(e) => {
            if (selected.length >= 3) {
              e.currentTarget.style.backgroundColor = "var(--black)";
              e.currentTarget.style.color = "var(--bg)";
            }
          }}
        >
          {saving ? (
            <div className="spinner" style={{ width: 18, height: 18, borderTopColor: "white", margin: "0 auto" }} />
          ) : selected.length >= 3 ? (
            "Continue"
          ) : (
            `Add ${remaining} more topic${remaining > 1 ? "s" : ""}`
          )}
        </button>
        <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)" }}>
          {selected.length >= 3 ? "Ready to personalize your feed" : `Choose at least 3 topics to unlock your personalized feed`}
        </span>
      </div>
    </div>
  );
}
