"use client";

import { useEffect } from "react";

// Monetag Direct Links
const DIRECT_LINKS = [
  "https://omg10.com/4/11623443",
  "https://omg10.com/4/11623466"
];

export default function DirectLinkClickPopunder() {
  useEffect(() => {
    let triggered = false;

    const handleClick = (e: MouseEvent) => {
      // Don't trigger if already fired in this session, or user clicked an existing anchor tag with target _blank
      if (triggered) return;

      const lastFired = sessionStorage.getItem("direct_link_last_fired");
      const now = Date.now();

      // Frequency cap: Trigger once every 3 minutes per user session
      if (lastFired && now - parseInt(lastFired, 10) < 3 * 60 * 1000) {
        return;
      }

      // Pick a random direct link
      const chosenLink = DIRECT_LINKS[Math.floor(Math.random() * DIRECT_LINKS.length)];

      try {
        const adWindow = window.open(chosenLink, "_blank");
        if (adWindow) {
          adWindow.blur();
          window.focus();
        }
        sessionStorage.setItem("direct_link_last_fired", now.toString());
        triggered = true;
      } catch (err) {
        console.warn("Direct link popup blocked:", err);
      }
    };

    window.addEventListener("click", handleClick, { capture: true, once: false });

    return () => {
      window.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return null;
}
