export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function estimateReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export const CATEGORIES = [
  { id: "frontend", label: "Frontend Dev", color: "cat-frontend", emoji: "💻" },
  { id: "uiux", label: "UI/UX Design", color: "cat-uiux", emoji: "🎨" },
  { id: "cybersecurity", label: "Cybersecurity", color: "cat-cyber", emoji: "🔐" },
  { id: "ai", label: "AI & Tech", color: "cat-ai", emoji: "🤖" },
  { id: "career", label: "Career Guides", color: "cat-career", emoji: "🚀" },
  { id: "tutorials", label: "Tutorials", color: "cat-tutorials", emoji: "📚" },
  { id: "mobile", label: "Mobile Dev", color: "cat-mobile", emoji: "📱" },
  { id: "backend", label: "Backend Dev", color: "cat-backend", emoji: "⚙️" },
];

export function getCategoryMeta(id: string) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
