import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  SendHorizontal,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import type { Message, Request } from "@/types/dashboard";

interface MessagesSectionProps {
  messages: Message[];
  messageGroups: {
    requestId: string;
    requestTitle: string;
    lastMessage: Message;
    unreadCount: number;
  }[];
  messageServices: Record<string, { companyName: string }>;
  selectedMessageRequest: string | null;
  isViewingConversation: boolean;
  messageContent: string;
  sendingMessage: boolean;
  userId: string;
  userName: string;
  onMessageContentChange: (content: string) => void;
  onSendMessage: (content: string, toId: string, requestId: string, requestTitle: string) => Promise<void>;
  onSelectConversation: (requestId: string) => void;
  onBackToList: () => void;
  markMessageAsRead: (messageId: string) => Promise<void>;
  requests: Request[];
}

export function MessagesSection({
  messages,
  messageGroups,
  messageServices,
  selectedMessageRequest,
  isViewingConversation,
  messageContent,
  sendingMessage,
  userId,
  userName,
  onMessageContentChange,
  onSendMessage,
  onSelectConversation,
  onBackToList,
  markMessageAsRead,
  requests,
}: MessagesSectionProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const formatMessageDate = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      const date = timestamp && typeof timestamp.toDate === 'function'
        ? timestamp.toDate()
        : new Date(timestamp);

      if (isToday(date)) {
        return "Astăzi";
      } else if (isYesterday(date)) {
        return "Ieri";
      }
      return format(date, "dd.MM.yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      const date = timestamp && typeof timestamp.toDate === 'function'
        ? timestamp.toDate()
        : new Date(timestamp);

      return format(date, "HH:mm");
    } catch (error) {
      console.error("Error formatting time:", error);
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

  const handleViewDetails = () => {
    if (selectedMessageRequest) {
      const request = requests.find(r => r.id === selectedMessageRequest);
      if (request) {
        setSelectedRequest(request);
        setIsDetailsDialogOpen(true);
      }
    }
  };


  const renderMessagesList = () => (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-2">
        {messageGroups.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nu există conversații active
          </p>
        ) : (
          messageGroups.map((group) => {
            const serviceId = group.lastMessage.fromId === userId
              ? group.lastMessage.toId
              : group.lastMessage.fromId;
            const serviceName = messageServices[serviceId]?.companyName || "Service Auto";

            return (
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
                          {getInitials(serviceName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium truncate">{serviceName}</h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {formatMessageDate(group.lastMessage?.createdAt)} {formatMessageTime(group.lastMessage?.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
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
            );
          })
        )}
      </div>
    </ScrollArea>
  );

  const renderConversation = () => {
    if (!selectedMessageRequest) return null;

    const conversationMessages = messages
      .filter((msg) => msg.requestId === selectedMessageRequest)
      .sort((a, b) => {
        const dateA = a.createdAt && typeof a.createdAt.toDate === 'function'
          ? a.createdAt.toDate().getTime()
          : new Date(a.createdAt).getTime();
        const dateB = b.createdAt && typeof b.createdAt.toDate === 'function'
          ? b.createdAt.toDate().getTime()
          : new Date(b.createdAt).getTime();
        return dateA - dateB;
      });

    let currentDate: Date | null = null;

    const renderMessage = (message: Message) => {
      if (message.toId === userId && !message.read) {
        markMessageAsRead(message.id);
      }

      const serviceId = message.fromId === userId
        ? message.toId
        : message.fromId;
      const serviceName = messageServices[serviceId]?.companyName || "Service Auto";

      return (
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
              {message.fromId === userId ? userName : serviceName}
            </div>
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            <div className={`flex items-center gap-1 mt-1 text-xs ${
              message.fromId === userId ? "text-blue-100" : "text-gray-500"
            }`}>
              {formatMessageTime(message.createdAt)}
              {message.fromId === userId && (
                <CheckCircle2 className="h-3 w-3" />
              )}
            </div>
          </div>
        </motion.div>
      );
    };


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
                {getInitials(serviceName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-sm">{serviceName}</h3>
              <p className="text-xs text-muted-foreground">
                {currentGroup?.requestTitle || ''}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewDetails}
            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
          >
            <Eye className="h-4 w-4 mr-1" />
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
              {conversationMessages.map((message, index) => {
                const messageDate = message.createdAt && typeof message.createdAt.toDate === 'function'
                  ? message.createdAt.toDate()
                  : new Date(message.createdAt);

                const showDateSeparator = !currentDate || !isSameDay(currentDate, messageDate);

                if (showDateSeparator) {
                  currentDate = messageDate;
                  return (
                    <div key={`date-${message.id}`}>
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                          {formatMessageDate(message.createdAt)}
                        </div>
                      </div>
                      {renderMessage(message)}
                    </div>
                  );
                }

                return renderMessage(message);
              })}
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
                  if (messageContent.trim() && currentGroup) {
                    const serviceId = conversationMessages[0]?.fromId === userId
                      ? conversationMessages[0]?.toId
                      : conversationMessages[0]?.fromId;
                    onSendMessage(
                      messageContent,
                      serviceId,
                      currentGroup.requestId,
                      currentGroup.requestTitle
                    );
                  }
                }
              }}
            />
            <Button
              onClick={() => {
                if (currentGroup) {
                  const serviceId = conversationMessages[0]?.fromId === userId
                    ? conversationMessages[0]?.toId
                    : conversationMessages[0]?.fromId;
                  onSendMessage(
                    messageContent,
                    serviceId,
                    currentGroup.requestId,
                    currentGroup.requestTitle
                  );
                }
              }}
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

  const currentGroup = messageGroups.find(g => g.requestId === selectedMessageRequest);
  const serviceName = currentGroup ? (messageServices[currentGroup.lastMessage.fromId === userId ? currentGroup.lastMessage.toId : currentGroup.lastMessage.fromId]?.companyName || "Service Auto") : "Service Auto";

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#00aff5] flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mesaje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isViewingConversation ? renderConversation() : renderMessagesList()}
        </CardContent>
      </Card>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalii Cerere</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="border-b pb-3">
                  <h4 className="font-medium text-sm mb-2">Informații Generale</h4>
                  <div className="grid gap-2">
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">Titlu</h5>
                      <p className="text-sm">{selectedRequest.title}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">Descriere</h5>
                      <p className="text-sm whitespace-pre-wrap">{selectedRequest.description}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">Status</h5>
                      <p className="text-sm">{selectedRequest.status}</p>
                    </div>
                  </div>
                </div>

                <div className="border-b pb-3">
                  <h4 className="font-medium text-sm mb-2">Detalii Mașină</h4>
                  <div className="grid gap-2">
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">Marca și Model</h5>
                      <p className="text-sm">{selectedRequest.car?.make} {selectedRequest.car?.model}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">An Fabricație</h5>
                      <p className="text-sm">{selectedRequest.car?.year || 'N/A'}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">Număr Înmatriculare</h5>
                      <p className="text-sm">{selectedRequest.car?.licensePlate || 'N/A'}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">Combustibil</h5>
                      <p className="text-sm">{selectedRequest.car?.fuelType || 'N/A'}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">Kilometraj</h5>
                      <p className="text-sm">{selectedRequest.car?.mileage ? `${selectedRequest.car.mileage} km` : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-b pb-3">
                  <h4 className="font-medium text-sm mb-2">Locație</h4>
                  <div className="grid gap-2">
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">Județ</h5>
                      <p className="text-sm">{selectedRequest.location?.county || 'N/A'}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">Localitate</h5>
                      <p className="text-sm">{selectedRequest.location?.city || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-b pb-3">
                  <h4 className="font-medium text-sm mb-2">Programare</h4>
                  <div className="grid gap-2">
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">Data Preferată</h5>
                      <p className="text-sm">
                        {selectedRequest.preferredDate ? format(
                          typeof selectedRequest.preferredDate.toDate === 'function'
                            ? selectedRequest.preferredDate.toDate()
                            : new Date(selectedRequest.preferredDate),
                          "dd.MM.yyyy"
                        ) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">Data Creării</h5>
                      <p className="text-sm">
                        {selectedRequest.createdAt ? format(
                          typeof selectedRequest.createdAt.toDate === 'function'
                            ? selectedRequest.createdAt.toDate()
                            : new Date(selectedRequest.createdAt),
                          "dd.MM.yyyy HH:mm"
                        ) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default MessagesSection;