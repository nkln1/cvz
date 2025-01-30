export interface Message {
  id: string;
  requestId: string;
  fromId: string;
  toId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface MessageGroup {
  requestId: string;
  requestTitle: string;
  lastMessage: Message;
  unreadCount: number;
}

export interface MessageListProps {
  messages: Message[];
  messageGroups: MessageGroup[];
  onMarkAsRead: (messageId: string) => Promise<void>;
  selectedMessageRequest: Request | null;
  setSelectedMessageRequest: (request: Request | null) => void;
  setActiveTab: (tab: string) => void;
  setIsViewingConversation: (isViewing: boolean) => void;
}

export interface Request {
  id: string;
  title: string;
  description: string;
  carId: string;
  preferredDate: string;
  county: string;
  cities: string[];
  status: "Active" | "Rezolvat" | "Anulat";
  createdAt: string;
  userId: string;
  clientName?: string;
}
