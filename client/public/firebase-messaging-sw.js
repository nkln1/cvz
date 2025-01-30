importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Your web app's Firebase configuration
firebase.initializeApp({
  apiKey: "AIzaSyC9A1xOJB_shnlAG3hH6s7ZhxH8EhH1h9Q",
  projectId: "car-service-app-xxxxx",
  messagingSenderId: "888159174030",
  appId: "1:888159174030:web:xxxxxxxxxxxxx"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/notification-icon.png',
    badge: '/badge-icon.png',
    data: payload.data,
    requireInteraction: true,
    tag: payload.data?.type || 'default', // Group similar notifications
    actions: [
      {
        action: 'open',
        title: 'View Details',
      },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions)
    .catch(error => {
      console.error('[Service Worker] Error showing notification:', error);
    });
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  // Handle the click action
  if (action === 'open' || !action) {
    const urlToOpen = new URL('/dashboard', self.location.origin).href;

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // Look for an existing window
          for (const client of windowClients) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // If no window is found, open a new one
          return clients.openWindow(urlToOpen);
        })
        .catch(error => {
          console.error('[Service Worker] Error handling notification click:', error);
        })
    );
  }
});

// Log service worker initialization
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing new service worker');
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Service worker activated');
});