import React from "react";

export default function LoadingScreen() {
  return (
    <div 
      style={{ 
        height: "100vh", 
        width: "100%", 
        background: "var(--bg, white)", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        gap: 16
      }}
    >
      <div 
        className="spinner" 
        style={{ 
          width: 36, 
          height: 36, 
          borderWidth: 3, 
          borderColor: "var(--border-2, #eaeaea)", 
          borderTopColor: "var(--brand, #7c3aed)" 
        }} 
      />
      <span 
        style={{ 
          fontFamily: "var(--sans)", 
          fontSize: 14, 
          color: "var(--muted)", 
          fontWeight: 500,
          letterSpacing: "0.02em"
        }}
      >
        Loading...
      </span>
    </div>
  );
}
