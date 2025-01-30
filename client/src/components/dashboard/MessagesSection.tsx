import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";
import type { Message } from "@/types/dashboard";

interface MessagesSectionProps {
  messages: Message[];
  messageServices: Record<string, { companyName: string }>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  requestTitles: Record<string, string>;
}

export function MessagesSection({
  messages,
  messageServices,
  markMessageAsRead,
  requestTitles,
}: MessagesSectionProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Mesaje
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-gray-600 text-center py-4">Nu există mesaje noi.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const service = messageServices[message.fromId];
                const requestTitle = requestTitles[message.requestId];

                return (
                  <Card
                    key={message.id}
                    className={`transition-colors ${
                      !message.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">
                              {service?.companyName || 'Service Auto'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Pentru cererea: {requestTitle || 'Cerere service'}
                            </p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(message.createdAt), "dd.MM.yyyy HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm mt-2">{message.content}</p>
                        {!message.read && (
                          <Button
                            variant="ghost"
                            className="self-end mt-2"
                            onClick={() => markMessageAsRead(message.id)}
                          >
                            Marchează ca citit
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MessagesSection;
