const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EACCES') return;
      throw err;
    }
  });
  return filelist;
};

const files = [
  ...walkSync('app'),
  ...walkSync('components')
].filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Fix 1: Notification Dropdown
  const notifRegex = /<div className="notif-dropdown absolute right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden py-1"[^>]*>([\s\S]*?)<div className="px-4 py-8 text-center text-sm text-gray-400 font-sans">\s*No notifications yet\s*<\/div>/g;
  
  if (notifRegex.test(content)) {
    content = content.replace(notifRegex, `<div className="notif-dropdown" style={{ position: "absolute", right: 0, top: "calc(100% + 12px)", background: "white", border: "1px solid var(--border-2)", borderRadius: 20, boxShadow: "0 12px 48px rgba(0,0,0,0.1)", zIndex: 100, width: 340, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-2)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fcfcfc" }}>
                    <span style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, color: "var(--black)" }}>Notifications</span>
                    <div style={{ display: "flex", gap: 12 }}>
                      {unreadNotifCount > 0 && (
                        <button onClick={markAllAsRead} style={{ fontSize: 13, color: "var(--brand)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sans)" }}>
                          Mark read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button onClick={clearAllNotifications} style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sans)" }}>
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ maxHeight: 360, overflowY: "auto", background: "white" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "48px 20px", textAlign: "center", fontSize: 14, color: "var(--muted)", fontFamily: "var(--sans)" }}>
                        No notifications yet
                      </div>`);
    changed = true;
  }

  // A variant that might be in app/settings/page.tsx (split across lines differently)
  const notifRegex2 = /className="notif-dropdown absolute right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden py-1"([^>]*)>([\s\S]*?)<div className="px-4 py-8 text-center text-sm text-gray-400 font-sans">\s*No notifications yet\s*<\/div>/g;
  if (notifRegex2.test(content) && !changed) {
    content = content.replace(notifRegex2, `className="notif-dropdown" style={{ position: "absolute", right: 0, top: "calc(100% + 12px)", background: "white", border: "1px solid var(--border-2)", borderRadius: 20, boxShadow: "0 12px 48px rgba(0,0,0,0.1)", zIndex: 100, width: 340, overflow: "hidden" }}$1>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-2)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fcfcfc" }}>
                    <span style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, color: "var(--black)" }}>Notifications</span>
                    <div style={{ display: "flex", gap: 12 }}>
                      {unreadNotifCount > 0 && (
                        <button onClick={markAllAsRead} style={{ fontSize: 13, color: "var(--brand)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sans)" }}>
                          Mark read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button onClick={clearAllNotifications} style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sans)" }}>
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ maxHeight: 360, overflowY: "auto", background: "white" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "48px 20px", textAlign: "center", fontSize: 14, color: "var(--muted)", fontFamily: "var(--sans)" }}>
                        No notifications yet
                      </div>`);
    changed = true;
  }

  // Also replace the layout padding for responsive margin
  if (content.includes("padding: 24px 16px 60px;")) {
    content = content.replace(/padding: 24px 16px 60px;/g, "padding: 40px 24px 60px;");
    changed = true;
  }
  if (content.includes("padding: 24px 16px;") && file.includes("DashboardPage")) {
    content = content.replace(/padding: 24px 16px;/g, "padding: 40px 24px;");
    changed = true;
  }
  // Let's also push the specific margin down for "Your stories" (or all pages) by adding a padding to uget-header
  if (content.includes(".uget-header {") && content.includes("padding: 0 16px;")) {
    content = content.replace(/padding: 0 16px;/g, "padding: 0 24px;");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log("Updated", file);
  }
}
