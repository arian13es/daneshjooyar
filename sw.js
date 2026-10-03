if(!self.define){let s,e={};const i=(i,l)=>(i=new URL(i+".js",l).href,e[i]||new Promise(e=>{if("document"in self){const s=document.createElement("script");s.src=i,s.onload=e,document.head.appendChild(s)}else s=i,importScripts(i),e()}).then(()=>{let s=e[i];if(!s)throw new Error(`Module ${i} didn’t register its module`);return s}));self.define=(l,n)=>{const r=s||("document"in self?document.currentScript.src:"")||location.href;if(e[r])return;let a={};const u=s=>i(s,r),o={module:{uri:r},exports:a,require:u};e[r]=Promise.all(l.map(s=>o[s]||u(s))).then(s=>(n(...s),a))}}define(["./workbox-9c191d2f"],function(s){"use strict";self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"pwa-512x512.png",revision:"990cdf1190c0650b3afca58276849ae3"},{url:"pwa-192x192.png",revision:"990cdf1190c0650b3afca58276849ae3"},{url:"logo_tabriz.png",revision:"fee99ecf1b002092b525aac139b631aa"},{url:"index.html",revision:"962d2c30b13e1937225f89d66d766dd8"},{url:"apple-touch-icon.png",revision:"990cdf1190c0650b3afca58276849ae3"},{url:"fonts/vazirmatn.woff2",revision:"05d9ce2a23d36fa14185b5343d3b43af"},{url:"assets/workbox-window.prod.es5-BBnX5xw4.js",revision:null},{url:"assets/web-jNJfgQXY.js",revision:null},{url:"assets/web-Czcy8Sb_.js",revision:null},{url:"assets/web-CSwrwaC2.js",revision:null},{url:"assets/web-BiJNK4u8.js",revision:null},{url:"assets/web-BEu8tGC0.js",revision:null},{url:"assets/web-3tYvxSoq.js",revision:null},{url:"assets/square-pen-Bl1YvoVT.js",revision:null},{url:"assets/sparkles-TGOdGG7p.js",revision:null},{url:"assets/search-D2u7kyPF.js",revision:null},{url:"assets/ScheduleGrid-BL1nA9lH.js",revision:null},{url:"assets/ProjectBoard-CfU528Kf.js",revision:null},{url:"assets/pen-line-Cm0Sb9EN.js",revision:null},{url:"assets/OfficialWebsitesModal-DHCIECTd.js",revision:null},{url:"assets/navigation-D50meYYs.js",revision:null},{url:"assets/logo_tabriz-byilbVz3.png",revision:null},{url:"assets/index-Ok_Dkcq2.css",revision:null},{url:"assets/index-DjdcYtRA.js",revision:null},{url:"assets/facultyBuildings-z7qW7hvw.js",revision:null},{url:"assets/ExamList-B3QHrsOC.js",revision:null},{url:"assets/ECEAssistant-Bksfzd_T.js",revision:null},{url:"assets/Dashboard-DFzel86A.js",revision:null},{url:"assets/CustomDateTimePicker-Dx8sHfHm.js",revision:null},{url:"assets/chevron-right-DWKL47g8.js",revision:null},{url:"assets/CampusMap-CIGW-MKW.css",revision:null},{url:"assets/CampusMap-C8pO-SRn.js",revision:null},{url:"assets/campusGisData-D8fmEub6.js",revision:null},{url:"assets/backHandler-Mje41gW2.js",revision:null},{url:"apple-touch-icon.png",revision:"990cdf1190c0650b3afca58276849ae3"},{url:"pwa-192x192.png",revision:"990cdf1190c0650b3afca58276849ae3"},{url:"pwa-512x512.png",revision:"990cdf1190c0650b3afca58276849ae3"},{url:"manifest.webmanifest",revision:"a87f2a5901f763c7098ae6df3ab94007"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))});

// ==================== iOS PWA Web Push & Notification Handlers ====================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    event.waitUntil(
      self.registration.showNotification(payload.title || 'دانشجویار تبریز', {
        body: payload.body || '',
        icon: './apple-touch-icon.png',
        badge: './apple-touch-icon.png',
        data: payload.data || {},
      })
    );
  } catch (e) {
    event.waitUntil(
      self.registration.showNotification('دانشجویار تبریز', {
        body: event.data.text(),
        icon: './apple-touch-icon.png',
        badge: './apple-touch-icon.png',
      })
    );
  }
});
