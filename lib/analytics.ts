import { createClient } from "@/lib/db-client/client";
import type { TrafficChannel, DeviceType } from "@/lib/types";
import { isClientBot } from "@/lib/bot-detector";

// Classify referrer domain into channel
export function detectTrafficChannel(referrer: string): { channel: TrafficChannel; domain: string } {
  if (!referrer || referrer.trim() === "") {
    return { channel: "direct", domain: "direct" };
  }

  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();

    // Search engines (Organic)
    if (
      host.includes("google.") ||
      host.includes("bing.com") ||
      host.includes("yahoo.com") ||
      host.includes("duckduckgo.com") ||
      host.includes("ecosia.org") ||
      host.includes("yandex.") ||
      host.includes("baidu.com")
    ) {
      return { channel: "google", domain: host };
    }

    // Social Media
    if (
      host.includes("twitter.com") ||
      host.includes("x.com") ||
      host.includes("t.co") ||
      host.includes("whatsapp.com") ||
      host.includes("wa.me") ||
      host.includes("facebook.com") ||
      host.includes("fb.me") ||
      host.includes("instagram.com") ||
      host.includes("linkedin.com") ||
      host.includes("reddit.com") ||
      host.includes("tiktok.com") ||
      host.includes("threads.net") ||
      host.includes("pinterest.com")
    ) {
      return { channel: "social", domain: host };
    }

    // Internal domain check
    if (typeof window !== "undefined" && host === window.location.hostname.toLowerCase()) {
      return { channel: "direct", domain: "internal" };
    }

    // External Referral
    return { channel: "referral", domain: host };
  } catch {
    return { channel: "direct", domain: "unknown" };
  }
}

// Detect device type from user agent and screen size
export function detectDeviceType(): DeviceType {
  if (typeof window === "undefined") return "desktop";
  
  const ua = navigator.userAgent.toLowerCase();
  const width = window.innerWidth || 1024;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || (width >= 640 && width <= 1024 && 'ontouchstart' in window)) {
    return "tablet";
  }
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua) || width < 640) {
    return "mobile";
  }
  return "desktop";
}

// Session cache to prevent logging the exact same page twice in 15 minutes in the same browser tab
const loggedPagesInSession = new Set<string>();

/**
 * Validates, deduplicates, and records a verified human post view & impression.
 * Incorporates client-side bot detection and 12-hour local caching.
 */
export async function recordPostView(
  postId: string,
  authorId?: string
): Promise<{ recorded: boolean; view_count?: number }> {
  if (typeof window === "undefined" || !postId) return { recorded: false };

  // 1. Client-side bot inspection
  if (isClientBot()) {
    return { recorded: false };
  }

  // 2. Client-side 12-hour local storage cooldown
  try {
    const storageKey = "echogist_viewed_posts";
    const historyStr = localStorage.getItem(storageKey);
    const history: Record<string, number> = historyStr ? JSON.parse(historyStr) : {};
    const now = Date.now();
    const lastViewed = history[postId];

    // If viewed within the last 12 hours (43200000 ms), skip API view increment
    if (lastViewed && now - lastViewed < 12 * 60 * 60 * 1000) {
      return { recorded: false };
    }

    // Save timestamp locally
    history[postId] = now;
    localStorage.setItem(storageKey, JSON.stringify(history));
  } catch {
    // If local storage is unavailable or blocked, proceed to API deduplication
  }

  // 3. Dispatch to secure server endpoint
  try {
    const referrer = document.referrer || "";
    const { channel, domain } = detectTrafficChannel(referrer);
    const device = detectDeviceType();

    const res = await fetch("/api/posts/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId,
        authorId,
        channel,
        referrerDomain: domain,
        device,
      }),
    });

    if (!res.ok) return { recorded: false };
    const data = await res.json();
    return { recorded: !!data.recorded, view_count: data.view_count };
  } catch (err) {
    console.debug("[Analytics] Failed to record post view:", err);
    return { recorded: false };
  }
}

export async function trackVisit(postId?: string | null): Promise<void> {
  if (typeof window === "undefined") return;
  if (isClientBot()) return;

  const pageKey = postId ? `post_${postId}` : `page_${window.location.pathname}`;
  if (loggedPagesInSession.has(pageKey)) return;
  loggedPagesInSession.add(pageKey);

  try {
    const referrer = document.referrer || "";
    const { channel, domain } = detectTrafficChannel(referrer);
    const device = detectDeviceType();

    const supabase = createClient();
    await supabase.from("site_visits").insert({
      post_id: postId || null,
      channel: channel,
      referrer_domain: domain,
      device: device,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    // Non-blocking catch to avoid disrupting user experience
    console.debug("[Analytics] Failed to log visit:", err);
  }
}

