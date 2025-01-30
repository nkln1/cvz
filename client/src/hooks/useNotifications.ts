import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function useNotifications(userId: string) {
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
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
      console.log("Requesting notification permission...");
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      console.log("Permission granted:", permission);

      if (permission === "granted") {
        // Update user preferences in Firestore
        const userDoc = doc(db, "services", userId);
        await updateDoc(userDoc, {
          notificationsEnabled: true
        });

        toast({
          title: "Notifications Enabled",
          description: "You will now receive notifications for new messages and updates.",
        });
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

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (notificationPermission === "granted") {
      try {
        new Notification(title, options);
      } catch (error) {
        console.error("Error showing notification:", error);
      }
    }
  };

  return {
    notificationPermission,
    requestNotificationPermission,
    showNotification,
    isRegistering,
  };
}