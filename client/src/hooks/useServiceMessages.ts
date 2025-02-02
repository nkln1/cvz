import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  orderBy,
  Unsubscribe,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Message, MessageGroup, Request } from "@/types/service";

export function useServiceMessages(userId: string) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([]);
  const [selectedMessageRequest, setSelectedMessageRequest] =
    useState<Request | null>(null);
  const [isViewingConversation, setIsViewingConversation] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadClientsCount, setUnreadClientsCount] = useState(0);

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
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    let unsubscribe: Unsubscribe | undefined;
    console.log("Setting up message listeners for user:", userId);

    try {
      const messagesQuery = query(
        collection(db, "messages"),
        where("participants", "array-contains", userId),
      );

      unsubscribe = onSnapshot(messagesQuery, {
        next: async (snapshot) => {
          console.log(
            "Received messages update:",
            snapshot.docs.length,
            "messages",
          );
          const newMessages = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as Message,
          );

          setMessages(newMessages);
          await processMessageGroups(newMessages);
        },
        error: (error) => {
          console.error("Error in messages subscription:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load messages. Please try again.",
          });
        },
      });
    } catch (error) {
      console.error("Error setting up message subscriptions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load messages. Please try again.",
      });
    }

    return () => {
      if (unsubscribe) {
        console.log("Cleaning up message listener");
        unsubscribe();
      }
    };
  }, [userId, toast]);

  const processMessageGroups = async (currentMessages: Message[]) => {
    try {
      const requestIds = Array.from(
        new Set(currentMessages.map((m) => m.requestId)),
      );
      const groups: MessageGroup[] = [];
      const unreadClients = new Set<string>();

      for (const requestId of requestIds) {
        const requestDoc = await getDoc(doc(db, "requests", requestId));
        if (!requestDoc.exists()) continue;

        const requestData = requestDoc.data();
        const clientDoc = await getDoc(doc(db, "users", requestData.userId));
        const clientName =
          requestData.clientName ||
          (clientDoc.exists()
            ? clientDoc.data().numeComplet ||
              clientDoc.data().name ||
              `${clientDoc.data().nume || ""} ${clientDoc.data().prenume || ""}`.trim()
            : "Client necunoscut");

        const requestMessages = currentMessages.filter(
          (m) => m.requestId === requestId,
        );

        requestMessages.sort((a, b) => {
          const aTime = (a.createdAt as unknown as Timestamp).toMillis();
          const bTime = (b.createdAt as unknown as Timestamp).toMillis();
          return bTime - aTime;
        });

        const unreadCount = requestMessages.filter(
          (m) => !m.read && m.toId === userId,
        ).length;

        if (unreadCount > 0) {
          unreadClients.add(requestData.userId);
        }

        groups.push({
          requestId,
          requestTitle: requestData.title || "Untitled Request",
          lastMessage: requestMessages[0],
          unreadCount,
          clientName,
        });
      }

      setUnreadClientsCount(unreadClients.size);

      // Sort groups by latest message
      groups.sort((a, b) => {
        const aTime = (
          a.lastMessage.createdAt as unknown as Timestamp
        ).toMillis();
        const bTime = (
          b.lastMessage.createdAt as unknown as Timestamp
        ).toMillis();
        return bTime - aTime;
      });

      setMessageGroups(groups);
      setIsLoading(false);
    } catch (error) {
      console.error("Error processing message groups:", error);
      setIsLoading(false);
    }
  };

  const handleSelectConversation = useCallback(
    async (requestId: string) => {
      try {
        console.log("Selecting conversation for request:", requestId);
        const requestDoc = await getDoc(doc(db, "requests", requestId));

        if (requestDoc.exists()) {
          const requestData = requestDoc.data();
          const clientDoc = await getDoc(doc(db, "users", requestData.userId));
          const clientName =
            requestData.clientName ||
            (clientDoc.exists()
              ? clientDoc.data().numeComplet ||
                clientDoc.data().name ||
                `${clientDoc.data().nume || ""} ${clientDoc.data().prenume || ""}`.trim()
              : "Client necunoscut");

          setSelectedMessageRequest({
            id: requestId,
            ...requestData,
            clientName,
          } as Request);
          setIsViewingConversation(true);

          // Get all unread messages in this conversation and mark them as read
          const unreadMessages = messages.filter(
            (m) => m.requestId === requestId && m.toId === userId && !m.read,
          );

          // Mark all unread messages as read
          for (const message of unreadMessages) {
            await markMessageAsRead(message.id);
          }

          // Check if this is a new conversation that needs initialization
          const existingMessages = messages.filter(
            (m) => m.requestId === requestId,
          );

          if (existingMessages.length === 0) {
            const initialMessage = {
              requestId,
              fromId: userId,
              toId: requestData.userId,
              content: `Bună ziua! Sunt reprezentantul service-ului auto și am primit cererea dumneavoastră pentru ${requestData.title}.`,
              createdAt: serverTimestamp(),
              read: false,
              participants: [userId, requestData.userId],
            };

            await addDoc(collection(db, "messages"), initialMessage);
          }
        }
      } catch (error) {
        console.error("Error selecting conversation:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load conversation. Please try again.",
        });
      }
    },
    [messages, userId, toast, markMessageAsRead],
  );

  const handleBackToList = () => {
    setIsViewingConversation(false);
    setSelectedMessageRequest(null);
  };

  const sendMessage = async () => {
    if (!messageContent.trim() || !selectedMessageRequest) return;

    setSendingMessage(true);
    try {
      const newMessage = {
        requestId: selectedMessageRequest.id,
        fromId: userId,
        toId: selectedMessageRequest.userId,
        content: messageContent.trim(),
        createdAt: serverTimestamp(),
        read: false,
        participants: [userId, selectedMessageRequest.userId],
      };

      await addDoc(collection(db, "messages"), newMessage);
      setMessageContent("");

      toast({
        title: "Success",
        description: "Message sent successfully.",
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
  };

  return {
    messages,
    messageGroups,
    selectedMessageRequest,
    isViewingConversation,
    messageContent,
    sendingMessage,
    isLoading,
    unreadClientsCount,
    sendMessage,
    handleSelectConversation,
    handleBackToList,
    setMessageContent,
    setSelectedMessageRequest,
    markMessageAsRead,
  };
}
