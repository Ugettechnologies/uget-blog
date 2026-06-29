export type UserRole = "admin" | "writer" | "reader";

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  twitter: string | null;
  website: string | null;
  role: UserRole;
  follower_count: number;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category: string;
  tags: string[];
  author_id: string;
  published: boolean;
  featured: boolean;
  read_time: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export const CATEGORIES = [
  { id: "technology", label: "Technology", icon: "💻" },
  { id: "design", label: "Design", icon: "🎨" },
  { id: "programming", label: "Programming", icon: "⌨️" },
  { id: "ai", label: "Artificial Intelligence", icon: "🤖" },
  { id: "career", label: "Career", icon: "🚀" },
  { id: "cybersecurity", label: "Cybersecurity", icon: "🔐" },
  { id: "mobile", label: "Mobile Dev", icon: "📱" },
  { id: "startup", label: "Startup", icon: "💡" },
  { id: "tutorial", label: "Tutorial", icon: "📚" },
  { id: "opinion", label: "Opinion", icon: "💬" },
];

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 80);
}

export function estimateReadTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 225));
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export interface SavedUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  provider: "email" | "google" | "facebook" | "github";
}

export function getSavedUsers(): SavedUser[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("uget_saved_users");
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveUserToSavedList(
  user: { id: string; email?: string; app_metadata?: { provider?: string } },
  profile: { full_name: string | null; avatar_url: string | null } | null,
  provider?: "email" | "google" | "facebook" | "github"
) {
  if (typeof window === "undefined") return;
  const list = getSavedUsers();
  const email = user.email || "";
  if (!email) return;

  const existingIndex = list.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  const existingUser = existingIndex > -1 ? list[existingIndex] : null;

  const supabaseProvider = user.app_metadata?.provider;
  let resolvedProvider: "email" | "google" | "facebook" | "github" = "email";

  if (provider) {
    resolvedProvider = provider;
  } else if (supabaseProvider && ["google", "facebook", "github", "email"].includes(supabaseProvider)) {
    resolvedProvider = supabaseProvider as any;
  } else {
    const pending = localStorage.getItem("uget_pending_provider") as any;
    if (pending && ["google", "facebook", "github", "email"].includes(pending)) {
      resolvedProvider = pending;
    } else if (existingUser?.provider) {
      resolvedProvider = existingUser.provider;
    }
  }

  localStorage.removeItem("uget_pending_provider");

  const updatedUser: SavedUser = {
    id: user.id,
    full_name: profile?.full_name || email.split("@")[0] || "User",
    email,
    avatar_url: profile?.avatar_url || "",
    provider: resolvedProvider,
  };

  if (existingIndex > -1) {
    list[existingIndex] = updatedUser;
  } else {
    list.unshift(updatedUser);
  }

  localStorage.setItem("uget_saved_users", JSON.stringify(list));
}

export function removeUserFromSavedList(email: string) {
  if (typeof window === "undefined") return;
  const list = getSavedUsers();
  const filtered = list.filter((u) => u.email.toLowerCase() !== email.toLowerCase());
  localStorage.setItem("uget_saved_users", JSON.stringify(filtered));
}

