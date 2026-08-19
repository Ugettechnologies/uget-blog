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
// 2. Monetag Push Notifications Service Worker (Zone 11609104)
// ==========================================
self.options = {
    "domain": "3nbf4.com",
    "zoneId": 11609104
};
self.lary = "";
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw');
