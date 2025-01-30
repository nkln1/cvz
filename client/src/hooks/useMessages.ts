import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/dashboard';

export const useMessages = (userId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageServices, setMessageServices] = useState<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const messagesQuery = query(
        collection(db, "messages"),
        where("toId", "==", userId)
      );
      const querySnapshot = await getDocs(messagesQuery);
      const loadedMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        loadedMessages.push({ id: doc.id, ...doc.data() } as Message);
      });

      loadedMessages.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setMessages(loadedMessages);

      const uniqueServiceIds = Array.from(new Set(loadedMessages.map(m => m.fromId)));
      const serviceDetails: { [key: string]: any } = {};

      for (const serviceId of uniqueServiceIds) {
        const serviceDoc = await getDoc(doc(db, "services", serviceId));
        if (serviceDoc.exists()) {
          serviceDetails[serviceId] = serviceDoc.data();
        }
      }

      setMessageServices(serviceDetails);
    } catch (error) {
      const errorMessage = "Nu s-au putut încărca mesajele.";
      console.error("Error loading messages:", error);
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      const messageRef = doc(db, "messages", messageId);
      await updateDoc(messageRef, {
        read: true
      });

      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
      return true;
    } catch (error) {
      console.error("Error marking message as read:", error);
      return false;
    }
  }, []);

  return {
    messages,
    messageServices,
    isLoading,
    error,
    fetchMessages,
    markMessageAsRead,
  };
};
