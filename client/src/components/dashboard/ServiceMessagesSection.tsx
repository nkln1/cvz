import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  SendHorizontal,
  Loader2,
  Eye,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import type { Request, Message } from "@/types/service";

interface MessageGroup {
  requestId: string;
  requestTitle: string;
  lastMessage: Message;
  unreadCount: number;
  clientName?: string;
}

interface ServiceMessagesSectionProps {
  messageGroups: MessageGroup[];
  messages: Message[];
  selectedMessageRequest: Request | null;
  isViewingConversation: boolean;
  messageContent: string;
  sendingMessage: boolean;
  onMessageContentChange: (content: string) => void;
  onSendMessage: () => Promise<void>;
  onSelectConversation: (requestId: string) => void;
  onBackToList: () => void;
  onViewRequestDetails: (requestId: string) => void;
  userId: string;
}

export function ServiceMessagesSection({
  messageGroups,
  messages,
  selectedMessageRequest,
  isViewingConversation,
  messageContent,
  sendingMessage,
  onMessageContentChange,
  onSendMessage,
  onSelectConversation,
  onBackToList,
  onViewRequestDetails,
  userId,
}: ServiceMessagesSectionProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      const date = timestamp && typeof timestamp.toDate === 'function'
        ? timestamp.toDate()
        : new Date(timestamp);

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        return format(date, "HH:mm");
      } else if (days === 1) {
        return "Ieri " + format(date, "HH:mm");
      } else if (days < 7) {
        return format(date, "EEEE HH:mm");
      }
      return format(date, "dd.MM.yyyy HH:mm");
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (isScrolledToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isScrolledToBottom]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollHeight, scrollTop, clientHeight } = e.currentTarget;
    setIsScrolledToBottom(Math.abs(scrollHeight - scrollTop - clientHeight) < 10);
  };

  const renderMessagesList = () => (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-2">
        {messageGroups.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nu există conversații active
          </p>
        ) : (
          messageGroups.map((group) => (
            <motion.div
              key={group.requestId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onSelectConversation(group.requestId)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(group.clientName || group.requestTitle)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{group.clientName || "Client"}</h4>
                          <p className="text-sm text-muted-foreground">{group.requestTitle}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatTimestamp(group.lastMessage?.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {group.lastMessage?.content || 'No messages'}
                      </p>
                    </div>
                    {group.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        {group.unreadCount}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </ScrollArea>
  );

  const renderConversation = () => {
    const currentGroup = messageGroups.find(
      (g) => g.requestId === selectedMessageRequest?.id
    );

    const conversationMessages = messages
      .filter((msg) => msg.requestId === selectedMessageRequest?.id)
      .sort((a, b) => {
        const dateA = a.createdAt && typeof a.createdAt.toDate === 'function'
          ? a.createdAt.toDate().getTime()
          : new Date(a.createdAt).getTime();
        const dateB = b.createdAt && typeof b.createdAt.toDate === 'function'
          ? b.createdAt.toDate().getTime()
          : new Date(b.createdAt).getTime();
        return dateA - dateB;
      });

    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToList}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Înapoi
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {currentGroup?.clientName ? getInitials(currentGroup.clientName) : "??"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-sm">
                {currentGroup?.clientName || "Client"}
                <span className="text-muted-foreground ml-2 text-xs">
                  ({currentGroup?.requestTitle})
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                ID Cerere: {selectedMessageRequest?.id}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selectedMessageRequest && onViewRequestDetails(selectedMessageRequest.id)}
            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            Detalii cerere
          </Button>
        </div>

        <ScrollArea
          className="flex-1 pr-4"
          style={{ height: "calc(600px - 180px)" }}
          onScrollCapture={handleScroll}
        >
          <div className="space-y-4">
            <AnimatePresence>
              {conversationMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.fromId === userId ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] ${
                      message.fromId === userId
                        ? "bg-blue-500 text-white rounded-t-2xl rounded-l-2xl"
                        : "bg-gray-100 rounded-t-2xl rounded-r-2xl"
                    } p-3 relative`}
                  >
                    <div className="text-xs mb-1 font-medium">
                      {message.fromId === userId ? "Service" : currentGroup?.clientName || "Client"}
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${
                      message.fromId === userId ? "text-blue-100" : "text-gray-500"
                    }`}>
                      {formatTimestamp(message.createdAt)}
                      {message.fromId === userId && (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t pt-4">
          <div className="flex gap-2">
            <Textarea
              value={messageContent}
              onChange={(e) => onMessageContentChange(e.target.value)}
              placeholder="Scrie un mesaj..."
              className="flex-1 min-h-[80px] resize-none rounded-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (messageContent.trim()) {
                    onSendMessage();
                  }
                }
              }}
            />
            <Button
              onClick={onSendMessage}
              disabled={!messageContent.trim() || sendingMessage}
              className="bg-[#00aff5] hover:bg-[#0099d6] self-end h-10"
            >
              {sendingMessage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se trimite...
                </>
              ) : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  Trimite
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Apasă Enter pentru a trimite mesajul. Shift + Enter pentru linie nouă.
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-[#00aff5]/20">
      <CardHeader>
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Mesaje
        </CardTitle>
        <CardDescription>
          Comunicare directă cu clienții și gestionarea conversațiilor
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isViewingConversation ? renderConversation() : renderMessagesList()}
      </CardContent>
    </Card>
  );
}