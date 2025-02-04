import { useState, useCallback, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@/types/dashboard";

interface MessageGroup {
  requestId: string;
  requestTitle: string;
  lastMessage: Message;
  unreadCount: number;
}

export const useMessages = (userId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([]);
  const [messageServices, setMessageServices] = useState<{
    [key: string]: any;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessageRequest, setSelectedMessageRequest] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isViewingConversation, setIsViewingConversation] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unreadServiceCount, setUnreadServiceCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      console.log("No userId provided for messages query");
      return;
    }

    console.log("Starting messages query for userId:", userId);
    const messagesQuery = query(
      collection(db, "messages"),
      where("participants", "array-contains", userId),
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      try {
        const loadedMessages: Message[] = [];
        snapshot.forEach((doc) => {
          const messageData = doc.data();
          console.log("Loaded message:", { id: doc.id, ...messageData });
          loadedMessages.push({ id: doc.id, ...messageData } as Message);
        });

        console.log("Total messages loaded:", loadedMessages.length);

        const groups: { [key: string]: MessageGroup } = {};
        const unreadServices = new Set<string>();

        loadedMessages.forEach((message) => {
          if (!groups[message.requestId]) {
            groups[message.requestId] = {
              requestId: message.requestId,
              requestTitle: message.requestTitle || "Untitled Request",
              lastMessage: message,
              unreadCount: 0,
            };
          }
          
          if (message.toId === userId && !message.read) {
            groups[message.requestId].unreadCount++;
            unreadServices.add(message.requestId);
          }
            if (
              new Date(message.createdAt) >
              new Date(groups[message.requestId].lastMessage.createdAt)
            ) {
              groups[message.requestId].lastMessage = message;
            }
          }
        });

        setUnreadServiceCount(unreadServices.size);
        setMessages(loadedMessages);
        setMessageGroups(
          Object.values(groups).sort(
            (a, b) =>
              new Date(b.lastMessage.createdAt).getTime() -
              new Date(a.lastMessage.createdAt).getTime(),
          ),
        );

        // Fetch service details for all unique service IDs
        const uniqueServiceIds = Array.from(
          new Set(loadedMessages.map((m) => m.fromId)),
        );

        const serviceDetails: { [key: string]: any } = {};
        for (const serviceId of uniqueServiceIds) {
          const serviceDoc = await getDoc(doc(db, "services", serviceId));
          if (serviceDoc.exists()) {
            serviceDetails[serviceId] = serviceDoc.data();
          }
        }

        setMessageServices(serviceDetails);
      } catch (error) {
        console.error("Error in messages listener:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load messages. Please refresh the page.",
        });
      }
    });

    return () => unsubscribe();
  }, [userId, toast]);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      const messageRef = doc(db, "messages", messageId);
      await updateDoc(messageRef, {
        read: true,
      });

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, read: true } : msg,
        ),
      );
      return true;
    } catch (error) {
      console.error("Error marking message as read:", error);
      return false;
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!messageContent.trim() || !userId || !selectedMessageRequest || !selectedServiceId) {
      console.log("Missing required fields for sending message:", {
        content: !!messageContent.trim(),
        userId,
        selectedMessageRequest,
        selectedServiceId,
      });
      return;
    }

    setSendingMessage(true);
    try {
      const messageData = {
        content: messageContent.trim(),
        fromId: userId,
        toId: selectedServiceId,
        requestId: selectedMessageRequest,
        createdAt: Timestamp.now(),
        read: false,
        participants: [userId, selectedServiceId],
      };
      console.log("Sending message:", messageData);

      await addDoc(collection(db, "messages"), messageData);

      setMessageContent("");
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send message. Please try again.",
      });
    } finally {
      setSendingMessage(false);
    }
  }, [userId, messageContent, selectedMessageRequest, selectedServiceId, toast]);

  const handleSelectConversation = async (requestId: string, serviceId?: string) => {
    console.log("Selecting conversation:", { requestId, serviceId });
    setSelectedMessageRequest(requestId);
    if (serviceId) {
      setSelectedServiceId(serviceId);
    }
    setIsViewingConversation(true);
  };

  const handleBackToList = () => {
    console.log("Going back to messages list");
    setSelectedMessageRequest(null);
    setSelectedServiceId(null);
    setIsViewingConversation(false);
    setMessageContent("");
  };

  return {
    messages,
    messageGroups,
    messageServices,
    isLoading,
    error,
    selectedMessageRequest,
    selectedServiceId,
    isViewingConversation,
    messageContent,
    sendingMessage,
    unreadServiceCount,
    setMessageContent,
    markMessageAsRead,
    sendMessage,
    handleSelectConversation,
    handleBackToList,
  };
};