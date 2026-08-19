// ==========================================
// 1. Existing 5gvci Ad Service Worker
// ==========================================
self.options = {
    "domain": "5gvci.com",
    "zoneId": 11608961
};
self.lary = "";
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw');

// ==========================================
// 2. Monetag Service Worker Integration
// ==========================================
// If Monetag provided an importScripts URL:
// importScripts('https://[monetag-domain]/[monetag-script].js');
//
// Or paste the code from Monetag's downloaded sw.js file here.
