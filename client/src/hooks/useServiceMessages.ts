import { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, doc, getDoc } from "firebase/firestore";
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

  const fetchMessages = async () => {
    if (!userId) return;

    try {
      const sentMessagesQuery = query(
        collection(db, "messages"),
        where("fromId", "==", userId),
      );

      const receivedMessagesQuery = query(
        collection(db, "messages"),
        where("toId", "==", userId),
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentMessagesQuery),
        getDocs(receivedMessagesQuery),
      ]);

      const loadedMessages: Message[] = [];
      const groupedMessages: { [key: string]: Message[] } = {};

      [sentSnapshot, receivedSnapshot].forEach((snapshot) => {
        snapshot.forEach((doc) => {
          const message = { id: doc.id, ...doc.data() } as Message;
          loadedMessages.push(message);

          if (!groupedMessages[message.requestId]) {
            groupedMessages[message.requestId] = [];
          }
          groupedMessages[message.requestId].push(message);
        });
      });

      const groups: MessageGroup[] = [];
      for (const [requestId, messages] of Object.entries(groupedMessages)) {
        try {
          const requestDoc = await getDoc(doc(db, "requests", requestId));
          if (requestDoc.exists()) {
            const requestData = requestDoc.data();
            messages.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );

            groups.push({
              requestId,
              requestTitle: requestData.title,
              lastMessage: messages[0],
              unreadCount: messages.filter(
                (m) => !m.read && m.toId === userId,
              ).length,
            });
          }
        } catch (error) {
          console.error(`Error fetching request ${requestId}:`, error);
        }
      }

      groups.sort(
        (a, b) =>
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime(),
      );

      setMessageGroups(groups);
      setMessages(loadedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-au putut încărca mesajele.",
      });
    }
  };

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
      await fetchMessages();

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

  const handleSelectConversation = (requestId: string, request: Request) => {
    setSelectedMessageRequest(request);
    setIsViewingConversation(true);
    localStorage.setItem("selectedMessageRequestId", requestId);
  };

  const handleBackToList = () => {
    setIsViewingConversation(false);
    setSelectedMessageRequest(null);
    localStorage.removeItem("selectedMessageRequestId");
  };

  return {
    messages,
    messageGroups,
    selectedMessageRequest,
    isViewingConversation,
    messageContent,
    sendingMessage,
    fetchMessages,
    sendMessage,
    handleSelectConversation,
    handleBackToList,
    setMessageContent,
    setSelectedMessageRequest,
  };
}
