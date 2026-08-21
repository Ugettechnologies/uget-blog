"use client";

import { useEffect, useState } from "react";

export default function AntiAdblockNotice() {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if adblocker is blocking ad scripts
    const checkAdBlocker = async () => {
      try {
        await fetch("https://5gvci.com/act/files/tag.min.js?z=11617002", {
          method: "HEAD",
          mode: "no-cors",
        });
      } catch (err) {
        // Network fetch error triggered by browser ad blocker extension
        setAdBlockDetected(true);
      }
    };

    const timer = setTimeout(checkAdBlocker, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!adBlockDetected || dismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] max-w-sm rounded-2xl bg-zinc-900/95 border border-amber-500/40 p-4 text-zinc-100 shadow-2xl backdrop-blur-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Support EchoGist</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-zinc-400 hover:text-white transition-colors p-1 rounded-md"
          aria-label="Dismiss notice"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
        It looks like you are using an ad blocker. EchoGist relies on ads to keep reading free and support our creators. Please consider pausing your ad blocker for <strong>echo-gist.com</strong>.
      </p>
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg transition-colors"
        >
          I've Whitelisted EchoGist
        </button>
      </div>
    </div>
  );
}
