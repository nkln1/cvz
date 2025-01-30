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
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Message, MessageGroup, Request } from "@/types/service";

export function useServiceMessages(userId: string) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([]);
  const [selectedMessageRequest, setSelectedMessageRequest] = useState<Request | null>(null);
  const [isViewingConversation, setIsViewingConversation] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!userId) return;

    let unsubscribes: Unsubscribe[] = [];
    console.log("Setting up message listeners for user:", userId);

    try {
      // Subscribe to sent messages
      const sentQuery = query(
        collection(db, "messages"),
        where("fromId", "==", userId),
        orderBy("createdAt", "desc")
      );

      // Subscribe to received messages
      const receivedQuery = query(
        collection(db, "messages"),
        where("toId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const unsubscribeSent = onSnapshot(sentQuery, async (snapshot) => {
        console.log("Received sent messages update:", snapshot.docs.length, "messages");
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message));
        await processMessages(newMessages);
      });

      const unsubscribeReceived = onSnapshot(receivedQuery, async (snapshot) => {
        console.log("Received received messages update:", snapshot.docs.length, "messages");
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message));
        await processMessages(newMessages);
      });

      unsubscribes = [unsubscribeSent, unsubscribeReceived];
    } catch (error) {
      console.error("Error setting up message subscriptions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load messages. Please try again.",
      });
    }

    return () => {
      console.log("Cleaning up message listeners");
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [userId, toast]);

  const processMessages = async (newMessages: Message[]) => {
    try {
      console.log("Processing", newMessages.length, "messages");
      // Update messages state
      setMessages(prev => {
        const combined = [...prev];
        newMessages.forEach(message => {
          const index = combined.findIndex(m => m.id === message.id);
          if (index === -1) {
            combined.push(message);
          } else {
            combined[index] = message;
          }
        });
        return combined.sort((a, b) => {
          const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
      });

      // Process message groups
      const requestIds = Array.from(new Set(newMessages.map(m => m.requestId)));
      const groupPromises = requestIds.map(async (requestId) => {
        const requestDoc = await getDoc(doc(db, "requests", requestId));
        if (!requestDoc.exists()) return null;

        const requestData = requestDoc.data();
        const requestMessages = newMessages.filter(m => m.requestId === requestId);
        requestMessages.sort((a, b) => {
          const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });

        return {
          requestId,
          requestTitle: requestData.title,
          lastMessage: requestMessages[0],
          unreadCount: requestMessages.filter(m => !m.read && m.toId === userId).length,
        } as MessageGroup;
      });

      const groups = (await Promise.all(groupPromises)).filter((group): group is MessageGroup => group !== null);

      setMessageGroups(prev => {
        const combined = [...prev];
        groups.forEach(group => {
          const index = combined.findIndex(g => g.requestId === group.requestId);
          if (index === -1) {
            combined.push(group);
          } else {
            combined[index] = group;
          }
        });
        return combined.sort((a, b) => {
          const dateA = a.lastMessage.createdAt instanceof Timestamp ? a.lastMessage.createdAt.toDate() : new Date(a.lastMessage.createdAt);
          const dateB = b.lastMessage.createdAt instanceof Timestamp ? b.lastMessage.createdAt.toDate() : new Date(b.lastMessage.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error processing messages:", error);
      setIsLoading(false);
    }
  };

  const handleSelectConversation = useCallback(async (requestId: string) => {
    try {
      console.log("Selecting conversation for request:", requestId);
      const requestDoc = await getDoc(doc(db, "requests", requestId));
      if (requestDoc.exists()) {
        const requestData = requestDoc.data();
        setSelectedMessageRequest({ id: requestId, ...requestData } as Request);
        setIsViewingConversation(true);
        localStorage.setItem("selectedMessageRequestId", requestId);

        // Send initial message if this is a new conversation
        const conversationMessages = messages.filter(m => m.requestId === requestId);
        if (conversationMessages.length === 0) {
          console.log("Sending initial message for new conversation");
          const initialMessage = {
            requestId,
            fromId: userId,
            toId: requestData.userId,
            content: `Bună ziua! Sunt reprezentantul service-ului auto și am primit cererea dumneavoastră pentru ${requestData.title}. Cum vă pot ajuta?`,
            createdAt: serverTimestamp(),
            read: false,
          };

          await addDoc(collection(db, "messages"), initialMessage);
        }
      }
    } catch (error) {
      console.error("Error fetching request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load conversation. Please try again.",
      });
    }
  }, [messages, userId, toast]);

  const handleBackToList = () => {
    setIsViewingConversation(false);
    setSelectedMessageRequest(null);
    localStorage.removeItem("selectedMessageRequestId");
  };

  const sendMessage = async () => {
    if (!userId || !messageContent.trim() || !selectedMessageRequest) return;

    setSendingMessage(true);
    try {
      console.log("Sending message to request:", selectedMessageRequest.id);
      const messageRef = collection(db, "messages");
      const newMessage = {
        requestId: selectedMessageRequest.id,
        fromId: userId,
        toId: selectedMessageRequest.userId,
        content: messageContent.trim(),
        createdAt: serverTimestamp(),
        read: false,
      };

      await addDoc(messageRef, newMessage);
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
  };
}