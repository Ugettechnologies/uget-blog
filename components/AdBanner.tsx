"use client";

import { useEffect, useState } from "react";
import SponsoredCard from "./SponsoredCard";

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

interface AdBannerProps {
  dataAdSlot: string;
  dataAdFormat?: string;
  dataFullWidthResponsive?: boolean;
  className?: string;
}

export default function AdBanner({
  dataAdSlot,
  dataAdFormat = "auto",
  dataFullWidthResponsive = true,
  className = "",
}: AdBannerProps) {
  const [adSenseFilled, setAdSenseFilled] = useState<boolean>(false);

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }

    // Check if AdSense successfully loaded an ad element inside ins tag
    const checkTimer = setTimeout(() => {
      const insNode = document.querySelector(`ins[data-ad-slot="${dataAdSlot}"]`);
      if (insNode && insNode.children.length > 0 && insNode.clientHeight > 20) {
        setAdSenseFilled(true);
      } else {
        setAdSenseFilled(false);
      }
    }, 1500);

    return () => clearTimeout(checkTimer);
  }, [dataAdSlot]);

  return (
    <div className={`my-6 text-center ${className}`}>
      <div 
        style={{ 
          padding: adSenseFilled ? "12px" : "0", 
          borderRadius: "12px", 
          background: adSenseFilled ? "var(--bg-2)" : "transparent", 
          border: adSenseFilled ? "1px solid var(--border)" : "none",
          overflow: "hidden"
        }}
      >
        {adSenseFilled && (
          <div style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "8px" }}>
            Advertisement
          </div>
        )}
        <ins
          className="adsbygoogle"
          style={{ display: "block", minHeight: adSenseFilled ? "90px" : "1px" }}
          data-ad-client="ca-pub-7030150096951668"
          data-ad-slot={dataAdSlot}
          data-ad-format={dataAdFormat}
          data-full-width-responsive={dataFullWidthResponsive ? "true" : "false"}
        />
      </div>

      {!adSenseFilled && (
        <SponsoredCard variant="banner" />
      )}
    </div>
  );
}

