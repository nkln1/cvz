import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { MessageListProps } from "./types";
import { ArrowLeft } from "lucide-react";

export function MessageList({
  messages,
  messageGroups,
  onMarkAsRead,
  selectedMessageRequest,
  setSelectedMessageRequest,
  setActiveTab,
  setIsViewingConversation
}: MessageListProps) {
  const handleBack = () => {
    setSelectedMessageRequest(null);
    setIsViewingConversation(false);
    localStorage.removeItem("selectedMessageRequestId");
  };

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <p className="text-gray-600 text-center py-4">Nu există mesaje.</p>
      ) : (
        <div className="space-y-4">
          {selectedMessageRequest ? (
            <div>
              <Button
                variant="ghost"
                onClick={handleBack}
                className="mb-4 text-[#00aff5] hover:text-[#0099d6] hover:bg-blue-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Înapoi la lista de mesaje
              </Button>
              <div className="space-y-4">
                {messages
                  .filter((m) => m.requestId === selectedMessageRequest.id)
                  .map((message) => (
                    <Card
                      key={message.id}
                      className={`transition-colors ${
                        !message.read ? "bg-blue-50" : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-start">
                            <p className="text-sm text-muted-foreground">
                              Pentru cererea: {selectedMessageRequest.title}
                            </p>
                            <span className="text-sm text-muted-foreground">
                              {format(
                                new Date(message.createdAt),
                                "dd.MM.yyyy HH:mm"
                              )}
                            </span>
                          </div>
                          <p className="text-sm mt-2">{message.content}</p>
                          {!message.read && (
                            <Button
                              variant="ghost"
                              className="self-end mt-2"
                              onClick={() => onMarkAsRead(message.id)}
                            >
                              Marchează ca citit
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ) : (
            messageGroups.map((group) => (
              <Card
                key={group.requestId}
                className={`transition-colors cursor-pointer hover:bg-gray-50 ${
                  group.unreadCount > 0 ? "bg-blue-50" : ""
                }`}
                onClick={() => {
                  setSelectedMessageRequest({
                    id: group.requestId,
                    title: group.requestTitle,
                  } as Request);
                  setIsViewingConversation(true);
                  localStorage.setItem(
                    "selectedMessageRequestId",
                    group.requestId
                  );
                }}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{group.requestTitle}</h4>
                      <p className="text-sm text-muted-foreground">
                        {group.lastMessage.content}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-muted-foreground">
                        {format(
                          new Date(group.lastMessage.createdAt),
                          "dd.MM.yyyy HH:mm"
                        )}
                      </span>
                      {group.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full mt-1">
                          {group.unreadCount} necitite
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
