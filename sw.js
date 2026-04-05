const CACHE_NAME = 'studyhub-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/js/app.js',
  '/js/ui.js',
  '/js/auth.js',
  '/js/dashboard.js',
  '/js/study.js',
  '/js/plan.js',
  '/js/social.js',
  '/js/rewards.js',
  '/js/profile.js',
  '/js/onboarding.js',
  '/js/flashcards.js',
  '/js/gamification.js',
  '/js/badges.js',
  '/js/shop.js',
  '/js/friends.js',
  '/js/activity-feed.js',
  '/js/timetable.js',
  '/js/goals.js',
  '/js/translation.js',
  '/js/alpha.js',
  '/js/supabase-client.js',
  '/config.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
