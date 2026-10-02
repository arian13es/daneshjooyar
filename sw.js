if(!self.define){let s,e={};const i=(i,l)=>(i=new URL(i+".js",l).href,e[i]||new Promise(e=>{if("document"in self){const s=document.createElement("script");s.src=i,s.onload=e,document.head.appendChild(s)}else s=i,importScripts(i),e()}).then(()=>{let s=e[i];if(!s)throw new Error(`Module ${i} didn’t register its module`);return s}));self.define=(l,n)=>{const r=s||("document"in self?document.currentScript.src:"")||location.href;if(e[r])return;let a={};const u=s=>i(s,r),o={module:{uri:r},exports:a,require:u};e[r]=Promise.all(l.map(s=>o[s]||u(s))).then(s=>(n(...s),a))}}define(["./workbox-9c191d2f"],function(s){"use strict";self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"pwa-512x512.png",revision:"990cdf1190c0650b3afca58276849ae3"},{url:"pwa-192x192.png",revision:"990cdf1190c0650b3afca58276849ae3"},{url:"logo_tabriz.png",revision:"fee99ecf1b002092b525aac139b631aa"},{url:"index.html",revision:"5fd7153bedbebf6746a7d2059a5c1c5e"},{url:"apple-touch-icon.png",revision:"990cdf1190c0650b3afca58276849ae3"},{url:"fonts/vazirmatn.woff2",revision:"05d9ce2a23d36fa14185b5343d3b43af"},{url:"assets/workbox-window.prod.es5-BBnX5xw4.js",revision:null},{url:"assets/web-KhT71B14.js",revision:null},{url:"assets/web-DiMgCJqF.js",revision:null},{url:"assets/web-DC5kNOAQ.js",revision:null},{url:"assets/web-CLCor2bb.js",revision:null},{url:"assets/web-C98hwgQ5.js",revision:null},{url:"assets/web-3Vy8UX9d.js",revision:null},{url:"assets/square-pen-DE8N9s34.js",revision:null},{url:"assets/sparkles-DAxJGkbb.js",revision:null},{url:"assets/search-B4AwMjmf.js",revision:null},{url:"assets/ScheduleGrid-C_l2u0t2.js",revision:null},{url:"assets/ProjectBoard-Dda9xwB7.js",revision:null},{url:"assets/pen-line-B4WIk_Ga.js",revision:null},{url:"assets/OfficialWebsitesModal-DB81FHN2.js",revision:null},{url:"assets/navigation-BoEGk5KP.js",revision:null},{url:"assets/logo_tabriz-byilbVz3.png",revision:null},{url:"assets/index-ChY_pYts.css",revision:null},{url:"assets/index-B0qVngec.js",revision:null},{url:"assets/facultyBuildings-z7qW7hvw.js",revision:null},{url:"assets/ExamList-m3IyEnn_.js",revision:null},{url:"assets/ECEAssistant-BTjpt6XH.js",revision:null},{url:"assets/Dashboard-BIduq6FR.js",revision:null},{url:"assets/CustomDateTimePicker-CDgrmBIa.js",revision:null},{url:"assets/chevron-right-BmxFc-Gh.js",revision:null},{url:"assets/CampusMap-DRkFW9dY.js",revision:null},{url:"assets/CampusMap-CIGW-MKW.css",revision:null},{url:"assets/campusGisData-D8fmEub6.js",revision:null},{url:"assets/backHandler-BOE5vsxK.js",revision:null},{url:"apple-touch-icon.png",revision:"990cdf1190c0650b3afca58276849ae3"},{url:"pwa-192x192.png",revision:"990cdf1190c0650b3afca58276849ae3"},{url:"pwa-512x512.png",revision:"990cdf1190c0650b3afca58276849ae3"},{url:"manifest.webmanifest",revision:"a87f2a5901f763c7098ae6df3ab94007"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))});

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
