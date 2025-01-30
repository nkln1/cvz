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

  useEffect(() => {
    if (!userId) {
      console.log("No userId provided");
      return;
    }

    console.log("Setting up message listener for user:", userId);
    setIsLoading(true);

    const unsubscribeMessages = onSnapshot(
      query(
        collection(db, "messages"),
        where("participants", "array-contains", userId),
        orderBy("createdAt", "desc")
      ),
      async (snapshot) => {
        try {
          const newMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Message));

          console.log("Fetched messages:", newMessages);
          console.log("Message createdAt values:", newMessages.map(msg => msg.createdAt));

          const requestIds = Array.from(new Set(newMessages.map(m => m.requestId)));
          console.log("Found request IDs:", requestIds);

          const groupsPromises = requestIds.map(async (requestId) => {
            try {
              const requestDoc = await getDoc(doc(db, "requests", requestId));
              if (!requestDoc.exists()) {
                console.log("Request document not found:", requestId);
                return null;
              }

              const requestData = requestDoc.data();
              const requestMessages = newMessages.filter(m => m.requestId === requestId);

              return {
                requestId,
                requestTitle: requestData.title || "Untitled Request",
                lastMessage: requestMessages[0],
                unreadCount: requestMessages.filter(m => !m.read && m.toId === userId).length,
              } as MessageGroup;
            } catch (error) {
              console.error("Error processing request:", requestId, error);
              return null;
            }
          });

          const groups = (await Promise.all(groupsPromises)).filter((group): group is MessageGroup => group !== null);
          console.log("Message groups:", groups);

          setMessages(newMessages);
          setMessageGroups(groups);
          setIsLoading(false);
        } catch (error) {
          console.error("Error processing messages snapshot:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not process messages. Please try again.",
          });
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Error in messages listener:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load messages. Please refresh the page.",
        });
        setIsLoading(false);
      }
    );

    return () => {
      console.log("Cleaning up message listener");
      unsubscribeMessages();
    };
  }, [userId, toast]);

  const handleSelectConversation = useCallback(async (requestId: string) => {
    if (!userId) return;

    try {
      console.log("Selecting conversation for request:", requestId);
      const requestDoc = await getDoc(doc(db, "requests", requestId));

      if (!requestDoc.exists()) {
        throw new Error("Request not found");
      }

      const requestData = requestDoc.data();
      console.log("Request data:", requestData);

      setSelectedMessageRequest({ id: requestId, ...requestData } as Request);
      setIsViewingConversation(true);

      console.log("Selected conversation updated:", { id: requestId, ...requestData });

      const conversationMessages = messages.filter(m => m.requestId === requestId);
      console.log("Conversation messages:", conversationMessages);

      if (conversationMessages.length === 0) {
        console.log("Creating new conversation");
        const initialMessage = {
          requestId,
          fromId: userId,
          toId: requestData.userId,
          participants: [userId, requestData.userId],
          content: `Bună ziua! Sunt reprezentantul service-ului auto și am primit cererea dumneavoastră pentru ${requestData.title}. Cum vă pot ajuta?`,
          createdAt: serverTimestamp(),
          read: false,
        };

        await addDoc(collection(db, "messages"), initialMessage);
      }
    } catch (error) {
      console.error("Error selecting conversation:", error);
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
  };

  const sendMessage = async () => {
    if (!userId || !messageContent.trim() || !selectedMessageRequest) {
      return;
    }

    setSendingMessage(true);
    try {
      console.log("Sending message to request:", selectedMessageRequest.id);
      const messageData = {
        requestId: selectedMessageRequest.id,
        fromId: userId,
        toId: selectedMessageRequest.userId,
        participants: [userId, selectedMessageRequest.userId],
        content: messageContent.trim(),
        createdAt: serverTimestamp(),
        read: false,
      };

      console.log("Message data to send:", messageData);

      await addDoc(collection(db, "messages"), messageData);
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