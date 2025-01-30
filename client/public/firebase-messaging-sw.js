importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Your web app's Firebase configuration
// Note: These values are public and safe to expose in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyC9A1xOJB_shnlAG3hH6s7ZhxH8EhH1h9Q",  // This is the public API key
  projectId: "car-service-app-xxxxx",
  messagingSenderId: "888159174030",
  appId: "1:888159174030:web:xxxxxxxxxxxxx"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/notification-icon.png',
    badge: '/badge-icon.png',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'View Details',
      },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  notification.close();

  if (action === 'open' && data.click_action) {
    const urlToOpen = new URL('/', self.location.origin).href;
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});