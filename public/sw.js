// Monetag Service Worker Setup for all active zones

// 1. Zone 11608961 (5gvci.com)
self.options = {
    "domain": "5gvci.com",
    "zoneId": 11608961
};
self.lary = "";
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw');

// 2. Zone 11609101 - Terrific Tag (5gvci.com)
self.options = {
    "domain": "5gvci.com",
    "zoneId": 11609101
};
self.lary = "";
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw');

// 3. Zone 11609104 - Push Notifications (3nbf4.com)
self.options = {
    "domain": "3nbf4.com",
    "zoneId": 11609104
};
self.lary = "";
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw');


