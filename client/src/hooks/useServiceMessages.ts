import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
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

      for (const requestId of requestIds) {
        const requestDoc = await getDoc(doc(db, "requests", requestId));
        if (!requestDoc.exists()) continue;

        const requestData = requestDoc.data();
        const requestMessages = currentMessages.filter(
          (m) => m.requestId === requestId,
        );

        // Sort messages by timestamp
        requestMessages.sort((a, b) => {
          const aTime = (a.createdAt as Timestamp).toMillis();
          const bTime = (b.createdAt as Timestamp).toMillis();
          return bTime - aTime;
        });

        groups.push({
          requestId,
          requestTitle: requestData.title || "Untitled Request",
          lastMessage: requestMessages[0],
          unreadCount: requestMessages.filter(
            (m) => !m.read && m.toId === userId,
          ).length,
        });
      }

      // Sort groups by latest message
      groups.sort((a, b) => {
        const aTime = (a.lastMessage.createdAt as Timestamp).toMillis();
        const bTime = (b.lastMessage.createdAt as Timestamp).toMillis();
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
          setSelectedMessageRequest({
            id: requestId,
            ...requestData,
          } as Request);
          setIsViewingConversation(true);

          // Initialize conversation if needed
          const conversationMessages = messages.filter(
            (m) => m.requestId === requestId,
          );
          if (conversationMessages.length === 0) {
            const initialMessage = {
              requestId,
              fromId: userId,
              toId: requestData.userId,
              content: `Bună ziua! Sunt reprezentantul service-ului auto și am primit cererea dumneavoastră pentru ${requestData.title}. Cum vă pot ajuta?`,
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
    [messages, userId, toast],
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
    sendMessage,
    handleSelectConversation,
    handleBackToList,
    setMessageContent,
    setSelectedMessageRequest,
  };
}
