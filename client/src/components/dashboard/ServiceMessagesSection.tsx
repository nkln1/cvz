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
import { MessageSquare, SendHorizontal, Loader2, Eye, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Request, Message } from "@/types/service";

interface MessageGroup {
  requestId: string;
  requestTitle: string;
  lastMessage: Message;
  unreadCount: number;
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
  const { toast } = useToast();

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      // Handle Firebase Timestamp
      if (timestamp && typeof timestamp.toDate === 'function') {
        return format(timestamp.toDate(), "dd.MM.yyyy HH:mm");
      }

      // Handle string timestamps
      if (typeof timestamp === 'string') {
        return format(new Date(timestamp), "dd.MM.yyyy HH:mm");
      }

      // Handle Date objects
      if (timestamp instanceof Date) {
        return format(timestamp, "dd.MM.yyyy HH:mm");
      }
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }

    return "";
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
    <div className="space-y-4">
      {messageGroups.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          Nu există conversații active
        </p>
      ) : (
        messageGroups.map((group) => (
          <Card
            key={group.requestId}
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => onSelectConversation(group.requestId)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium">{group.requestTitle}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {group.lastMessage?.content || 'No messages'}
                  </p>
                </div>
                <div className="flex flex-col items-end ml-4">
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(group.lastMessage?.createdAt)}
                  </span>
                  {group.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full mt-1">
                      {group.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderConversation = () => {
    const conversationMessages = messages.filter(
      (msg) => msg.requestId === selectedMessageRequest?.id
    ).sort((a, b) => {
      const dateA = a.createdAt && typeof a.createdAt.toDate === 'function' 
        ? a.createdAt.toDate().getTime() 
        : new Date(a.createdAt).getTime();
      const dateB = b.createdAt && typeof b.createdAt.toDate === 'function'
        ? b.createdAt.toDate().getTime()
        : new Date(b.createdAt).getTime();
      return dateA - dateB;
    });

    return (
      <div className="space-y-4">
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
            <h3 className="font-medium">{selectedMessageRequest?.title}</h3>
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
        <div
          className="space-y-4 max-h-[400px] overflow-y-auto mb-4 p-4"
          onScroll={handleScroll}
        >
          {conversationMessages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg max-w-[80%] ${
                message.fromId === userId
                  ? "ml-auto bg-blue-500 text-white"
                  : "bg-gray-100"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              <span className="text-xs opacity-70 block mt-1">
                {formatTimestamp(message.createdAt)}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <Textarea
            value={messageContent}
            onChange={(e) => onMessageContentChange(e.target.value)}
            placeholder="Scrie un mesaj..."
            className="flex-1"
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
            className="bg-[#00aff5] hover:bg-[#0099d6]"
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