import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, MailOpen, MessageSquare, Calendar, User, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import romanianCitiesData from "../../../../attached_assets/municipii_orase_romania.json";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ServiceProfileSection } from "@/components/dashboard/ServiceProfileSection";
import { ClientRequests } from "@/components/dashboard/ClientRequests";
import { SentOffers } from "@/components/dashboard/SentOffers";
import { ServiceMessagesSection } from "@/components/dashboard/ServiceMessagesSection";
import { AppointmentsSection } from "@/components/dashboard/AppointmentsSection";
import { ReviewsSection } from "@/components/dashboard/ReviewsSection";
import { ServiceAccountSection } from "@/components/dashboard/ServiceAccountSection";
import { useServiceMessages } from "@/hooks/useServiceMessages";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import type { ServiceData, EditableField } from "@/types/service";

type TabType = "requests" | "offers" | "messages" | "appointments" | "reviews" | "account";

interface NavigationButtonProps {
  tab: TabType;
  activeTab: TabType;
  icon: React.ReactNode;
  label: string;
  onClick: (tab: TabType) => void;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  tab,
  activeTab,
  icon,
  label,
  onClick,
}) => (
  <Button
    variant={activeTab === tab ? "default" : "ghost"}
    onClick={() => onClick(tab)}
    className={`flex items-center justify-start w-full sm:w-auto ${
      activeTab === tab
        ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
        : "hover:text-[#00aff5]"
    }`}
  >
    {icon}
    {label}
  </Button>
);

export default function ServiceDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyNew, setShowOnlyNew] = useState(false);
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
    fetchMessages,
    sendMessage,
    handleSelectConversation,
    handleBackToList,
    setMessageContent,
    setSelectedMessageRequest,
  } = useServiceMessages(user?.uid || "");

  const {
    clientRequests,
    selectedRequest,
    requestClient,
    cars,
    viewedRequests,
    handleViewDetails,
    handleRejectRequest,
    markRequestAsViewed,
  } = useServiceRequests(user?.uid || "", serviceData);

  const filteredRequests = showOnlyNew
    ? clientRequests.filter((request) => !viewedRequests.has(request.id))
    : clientRequests;

  const fields: EditableField[] = [
    { label: "Nume Companie", key: "companyName", editable: true },
    { label: "Nume Reprezentant", key: "representativeName", editable: true },
    { label: "Email", key: "email", editable: false },
    { label: "Telefon", key: "phone", editable: true },
    { label: "CUI", key: "cui", editable: false },
    { label: "Nr. Înregistrare", key: "tradeRegNumber", editable: false },
    { label: "Adresă", key: "address", editable: true },
    {
      label: "Județ",
      key: "county",
      editable: true,
      type: "select",
      options: Object.keys(romanianCitiesData),
    },
    {
      label: "Oraș",
      key: "city",
      editable: true,
      type: "select",
      options: serviceData?.county ? romanianCitiesData[serviceData.county] : [],
    },
  ];

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

  const handleMessage = (request: any) => {
    markRequestAsViewed(request.id);
    setSelectedMessageRequest(request);
    localStorage.setItem("selectedMessageRequestId", request.id);
    setActiveTab("messages");
  };

  const handleSendOffer = async (request: any) => {
    markRequestAsViewed(request.id);
    toast({
      description: "Funcționalitatea de trimitere oferte va fi disponibilă în curând.",
    });
  };

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
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        <nav className="flex flex-col sm:flex-row gap-2 border-b pb-4 overflow-x-auto">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <NavigationButton
              tab="requests"
              activeTab={activeTab}
              icon={<FileText className="w-4 h-4 mr-2" />}
              label="Cereri"
              onClick={setActiveTab}
            />
            <NavigationButton
              tab="offers"
              activeTab={activeTab}
              icon={<MailOpen className="w-4 h-4 mr-2" />}
              label="Oferte"
              onClick={setActiveTab}
            />
            <NavigationButton
              tab="messages"
              activeTab={activeTab}
              icon={<MessageSquare className="w-4 h-4 mr-2" />}
              label="Mesaje"
              onClick={setActiveTab}
            />
            <NavigationButton
              tab="appointments"
              activeTab={activeTab}
              icon={<Calendar className="w-4 h-4 mr-2" />}
              label="Programări"
              onClick={setActiveTab}
            />
            <NavigationButton
              tab="reviews"
              activeTab={activeTab}
              icon={<Star className="w-4 h-4 mr-2" />}
              label="Recenzii"
              onClick={setActiveTab}
            />
            <NavigationButton
              tab="account"
              activeTab={activeTab}
              icon={<User className="w-4 h-4 mr-2" />}
              label="Cont"
              onClick={setActiveTab}
            />
          </div>
        </nav>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          {activeTab === "requests" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Cererile Clienților</h2>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-new"
                    checked={showOnlyNew}
                    onCheckedChange={setShowOnlyNew}
                  />
                  <Label htmlFor="show-new">Doar cereri noi</Label>
                </div>
              </div>
              <ClientRequests
                clientRequests={filteredRequests}
                viewedRequests={viewedRequests}
                onViewDetails={handleViewDetails}
                onMessage={handleMessage}
                onSendOffer={handleSendOffer}
                onRejectRequest={handleRejectRequest}
                selectedRequest={selectedRequest}
                requestClient={requestClient}
                cars={cars}
              />
            </div>
          )}
          {activeTab === "offers" && (
            <SentOffers
              requests={[]}
              cars={cars}
              refreshRequests={fetchMessages}
            />
          )}
          {activeTab === "messages" && (
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
              onViewRequestDetails={handleViewDetails}
              userId={user?.uid || ""}
            />
          )}
          {activeTab === "appointments" && <AppointmentsSection />}
          {activeTab === "reviews" && <ReviewsSection />}
          {activeTab === "account" && (
            <ServiceAccountSection
              userId={user?.uid || ""}
              serviceData={serviceData || ({} as ServiceData)}
              fields={fields}
              validationErrors={{}}
            />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}