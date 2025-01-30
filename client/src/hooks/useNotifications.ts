import { useState, useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { app, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function useNotifications(userId: string) {
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if the browser supports notifications
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
      return;
    }

    // Check notification permission status
    setNotificationPermission(Notification.permission);
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        const messaging = getMessaging(app);
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (token) {
          setFcmToken(token);
          // Save the token to the user's document in Firestore
          const userDoc = doc(db, "services", userId);
          await updateDoc(userDoc, {
            fcmToken: token,
          });

          toast({
            title: "Notifications Enabled",
            description: "You will now receive notifications for new offers.",
          });
        }
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not enable notifications. Please try again.",
      });
    }
  };

  useEffect(() => {
    if (notificationPermission === "granted") {
      const messaging = getMessaging(app);

      const unsubscribe = onMessage(messaging, (payload) => {
        // Handle foreground messages
        toast({
          title: payload.notification?.title || "New Notification",
          description: payload.notification?.body,
        });

        // Play a notification sound
        const audio = new Audio("/notification.mp3");
        audio.play().catch(console.error);
      });

      return () => unsubscribe();
    }
  }, [notificationPermission]);

  return {
    notificationPermission,
    requestNotificationPermission,
    fcmToken,
  };
}