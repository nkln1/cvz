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
  orderBy 
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

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!userId) return;

    // Create query for both sent and received messages
    const sentMessagesQuery = query(
      collection(db, "messages"),
      where("fromId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const receivedMessagesQuery = query(
      collection(db, "messages"),
      where("toId", "==", userId),
      orderBy("createdAt", "desc")
    );

    // Subscribe to both queries
    const unsubscribeSent = onSnapshot(sentMessagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      updateMessages(newMessages, "sent");
    });

    const unsubscribeReceived = onSnapshot(receivedMessagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      updateMessages(newMessages, "received");
    });

    return () => {
      unsubscribeSent();
      unsubscribeReceived();
    };
  }, [userId]);

  const updateMessages = useCallback(async (newMessages: Message[], type: 'sent' | 'received') => {
    setMessages(prev => {
      // Combine messages, removing duplicates
      const combined = [...prev];
      newMessages.forEach(message => {
        const index = combined.findIndex(m => m.id === message.id);
        if (index === -1) {
          combined.push(message);
        } else {
          combined[index] = message;
        }
      });

      // Sort by date
      return combined.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    // Update message groups
    const groupedMessages: { [key: string]: Message[] } = {};
    newMessages.forEach(message => {
      if (!groupedMessages[message.requestId]) {
        groupedMessages[message.requestId] = [];
      }
      groupedMessages[message.requestId].push(message);
    });

    // Fetch request data for each group
    const groups: MessageGroup[] = [];
    for (const [requestId, messages] of Object.entries(groupedMessages)) {
      try {
        const requestDoc = await getDoc(doc(db, "requests", requestId));
        if (requestDoc.exists()) {
          const requestData = requestDoc.data();
          messages.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          groups.push({
            requestId,
            requestTitle: requestData.title,
            lastMessage: messages[0],
            unreadCount: messages.filter(m => !m.read && m.toId === userId).length,
          });
        }
      } catch (error) {
        console.error(`Error fetching request ${requestId}:`, error);
      }
    }

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
      return combined.sort((a, b) =>
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime()
      );
    });
  }, [userId]);

  const sendMessage = async () => {
    if (!userId || !messageContent.trim() || !selectedMessageRequest) return;

    setSendingMessage(true);
    try {
      const messageRef = collection(db, "messages");
      const newMessage = {
        requestId: selectedMessageRequest.id,
        fromId: userId,
        toId: selectedMessageRequest.userId,
        content: messageContent.trim(),
        createdAt: new Date().toISOString(),
        read: false,
      };

      await addDoc(messageRef, newMessage);

      toast({
        title: "Succes",
        description: "Mesajul a fost trimis cu succes.",
      });

      setMessageContent("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut trimite mesajul. Încercați din nou.",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSelectConversation = useCallback(async (requestId: string) => {
    try {
      const requestDoc = await getDoc(doc(db, "requests", requestId));
      if (requestDoc.exists()) {
        setSelectedMessageRequest({ id: requestId, ...requestDoc.data() } as Request);
        setIsViewingConversation(true);
        localStorage.setItem("selectedMessageRequestId", requestId);
      }
    } catch (error) {
      console.error("Error fetching request:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut încărca conversația. Încercați din nou.",
      });
    }
  }, [toast]);

  const handleBackToList = () => {
    setIsViewingConversation(false);
    setSelectedMessageRequest(null);
    localStorage.removeItem("selectedMessageRequestId");
  };

  const fetchMessages = useCallback(async () => {
    if (!userId) return;
    try {
      const sentMessagesQuery = query(
        collection(db, "messages"),
        where("fromId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const receivedMessagesQuery = query(
        collection(db, "messages"),
        where("toId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentMessagesQuery),
        getDocs(receivedMessagesQuery)
      ]);

      const sentMessages = sentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      const receivedMessages = receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));

      updateMessages(sentMessages, "sent");
      updateMessages(receivedMessages, "received");
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-au putut încărca mesajele. Încercați din nou.",
      });
    }
  }, [userId, toast, updateMessages]);

  return {
    messages,
    messageGroups,
    selectedMessageRequest,
    isViewingConversation,
    messageContent,
    sendingMessage,
    sendMessage,
    handleSelectConversation,
    handleBackToList,
    setMessageContent,
    setSelectedMessageRequest,
    fetchMessages,
  };
}