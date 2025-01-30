import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  MailOpen,
  MessageSquare,
  Calendar,
  Star,
  User,
  Bell,
  BellOff,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import romanianCitiesData from "../../../../attached_assets/municipii_orase_romania.json";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ServiceMessagesSection } from "@/components/dashboard/ServiceMessagesSection";
import { useServiceMessages } from "@/hooks/useServiceMessages";
import { useNotifications } from "@/hooks/useNotifications";
import type { ServiceData } from "@/types/service";

type TabType = "requests" | "offers" | "messages" | "appointments" | "reviews" | "account";

interface NavigationButtonProps {
  tab: TabType;
  activeTab: TabType;
  icon: React.ReactNode;
  label: string;
  onClick: (tab: TabType) => void;
  notificationCount?: number;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  tab,
  activeTab,
  icon,
  label,
  onClick,
  notificationCount,
}) => (
  <Button
    variant={activeTab === tab ? "default" : "ghost"}
    onClick={() => onClick(tab)}
    className={`flex items-center justify-start w-full sm:w-auto h-auto py-2 px-3 ${
      activeTab === tab
        ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
        : "hover:text-[#00aff5]"
    }`}
  >
    {icon}
    <span className="flex items-center gap-2 text-sm">
      {label}
      {notificationCount && notificationCount > 0 && (
        <Badge
          variant="secondary"
          className="bg-[#00aff5] text-white text-xs px-2 py-0.5 rounded-full"
        >
          {notificationCount}
        </Badge>
      )}
    </span>
  </Button>
);

export default function ServiceDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (window.location.pathname.endsWith("/service-dashboard")) {
      localStorage.setItem("activeTab", "requests");
      return "requests";
    }
    return (localStorage.getItem("activeTab") as TabType) || "requests";
  });

  const {
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
  } = useServiceMessages(user?.uid || "");

  const { notificationPermission, requestNotificationPermission } = useNotifications(user?.uid || "");

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    async function fetchServiceData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const serviceDoc = await getDoc(doc(db, "services", user.uid));
        if (serviceDoc.exists()) {
          setServiceData(serviceDoc.data() as ServiceData);
        } else {
          setError("Nu s-au găsit date pentru acest service");
        }
      } catch (error) {
        console.error("Error fetching service data:", error);
        setError("Nu am putut încărca datele serviciului");
        toast({
          variant: "destructive",
          title: "Eroare",
          description: "Nu am putut încărca datele serviciului.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchServiceData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00aff5]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Încearcă din nou
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-4 md:space-y-6 max-w-[1400px]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold">Service Dashboard</h1>
          {notificationPermission !== "granted" ? (
            <Button
              variant="outline"
              onClick={requestNotificationPermission}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <BellOff className="w-4 h-4" />
              Enable Notifications
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="w-4 h-4" />
              Notifications enabled
            </div>
          )}
        </div>

        <nav className="flex flex-col sm:flex-row gap-2 border-b pb-4 overflow-x-auto scrollbar-hide">
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full">
            <NavigationButton
              tab="messages"
              activeTab={activeTab}
              icon={<MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />}
              label="Mesaje"
              onClick={setActiveTab}
            />
          </div>
        </nav>

        <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6">
          <ServiceMessagesSection
            messageGroups={messageGroups}
            messages={messages}
            selectedMessageRequest={selectedMessageRequest}
            isViewingConversation={isViewingConversation}
            messageContent={messageContent}
            sendingMessage={sendingMessage}
            onMessageContentChange={setMessageContent}
            onSendMessage={sendMessage}
            onSelectConversation={handleSelectConversation}
            onBackToList={handleBackToList}
            onViewRequestDetails={(requestId: string) => {
              toast({
                description: "Vizualizare detalii cerere va fi disponibilă în curând.",
              });
            }}
            userId={user?.uid || ""}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}