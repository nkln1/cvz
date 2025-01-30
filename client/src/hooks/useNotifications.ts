import { useState, useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { app, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function useNotifications(userId: string) {
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Check if the browser supports notifications
    if (!("Notification" in window)) {
      console.error("This browser does not support desktop notification");
      toast({
        variant: "destructive",
        title: "Notifications Not Supported",
        description: "Your browser doesn't support notifications.",
      });
      return;
    }

    // Check notification permission status
    setNotificationPermission(Notification.permission);
  }, []);

  const requestNotificationPermission = async () => {
    if (isRegistering) return;
    setIsRegistering(true);

    try {
      // Check if service worker is supported
      if (!("serviceWorker" in navigator)) {
        throw new Error("Service Worker is not supported in this browser");
      }

      // Register service worker if needed
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
      } catch (err) {
        console.error('Service Worker registration failed:', err);
        throw new Error("Failed to register service worker");
      }

      // Request notification permission
      console.log("Requesting notification permission...");
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      console.log("Permission granted:", permission);

      if (permission === "granted") {
        // Get FCM token
        console.log("Getting FCM token...");
        const messaging = getMessaging(app);

        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (currentToken) {
          console.log("FCM Token obtained:", currentToken);
          setFcmToken(currentToken);

          // Save the token to Firestore
          console.log("Saving token to Firestore...");
          const userDoc = doc(db, "services", userId);
          await updateDoc(userDoc, {
            fcmToken: currentToken,
          });

          toast({
            title: "Notifications Enabled",
            description: "You will now receive notifications for new offers and messages.",
          });
        } else {
          throw new Error("Failed to obtain FCM token");
        }
      } else {
        throw new Error(`Notification permission ${permission}`);
      }
    } catch (error) {
      console.error("Error setting up notifications:", error);
      toast({
        variant: "destructive",
        title: "Notification Error",
        description: error instanceof Error 
          ? error.message 
          : "Could not enable notifications. Please try again.",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  useEffect(() => {
    if (notificationPermission === "granted") {
      try {
        const messaging = getMessaging(app);
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log("Received foreground message:", payload);

          // Show toast notification
          toast({
            title: payload.notification?.title || "New Notification",
            description: payload.notification?.body,
            duration: 5000,
          });

          // Play notification sound
          const audio = new Audio("/notification.mp3");
          audio.play().catch(console.error);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error setting up message listener:", error);
        toast({
          variant: "destructive",
          title: "Notification Error",
          description: "Failed to set up notification listener",
        });
      }
    }
  }, [notificationPermission]);

  return {
    notificationPermission,
    requestNotificationPermission,
    fcmToken,
    isRegistering,
  };
}