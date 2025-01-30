import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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

export default function ServiceDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.pathname.endsWith("/service-dashboard")) {
      localStorage.setItem("activeTab", "requests");
      return "requests";
    }
    return localStorage.getItem("activeTab") || "requests";
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
      if (!user) return;

      try {
        const serviceDoc = await getDoc(doc(db, "services", user.uid));
        if (serviceDoc.exists()) {
          setServiceData(serviceDoc.data() as ServiceData);
        }
      } catch (error) {
        console.error("Error fetching service data:", error);
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
      description:
        "Funcționalitatea de trimitere oferte va fi disponibilă în curând.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00aff5]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        <nav className="flex flex-col sm:flex-row gap-2 border-b pb-4 overflow-x-auto">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant={activeTab === "requests" ? "default" : "ghost"}
              onClick={() => setActiveTab("requests")}
              className={`flex items-center justify-start w-full sm:w-auto ${
                activeTab === "requests"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Cereri
            </Button>
            <Button
              variant={activeTab === "offers" ? "default" : "ghost"}
              onClick={() => setActiveTab("offers")}
              className={`flex items-center justify-start w-full sm:w-auto ${
                activeTab === "offers"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <MailOpen className="w-4 h-4 mr-2" />
              Oferte
            </Button>
            <Button
              variant={activeTab === "messages" ? "default" : "ghost"}
              onClick={() => setActiveTab("messages")}
              className={`flex items-center justify-start w-full sm:w-auto ${
                activeTab === "messages"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Mesaje
            </Button>
            <Button
              variant={activeTab === "appointments" ? "default" : "ghost"}
              onClick={() => setActiveTab("appointments")}
              className={`flex items-center justify-start w-full sm:w-auto ${
                activeTab === "appointments"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Programări
            </Button>
            <Button
              variant={activeTab === "reviews" ? "default" : "ghost"}
              onClick={() => setActiveTab("reviews")}
              className={`flex items-center justify-start w-full sm:w-auto ${
                activeTab === "reviews"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <Star className="w-4 h-4 mr-2" />
              Recenzii
            </Button>
            <Button
              variant={activeTab === "account" ? "default" : "ghost"}
              onClick={() => setActiveTab("account")}
              className={`flex items-center justify-start w-full sm:w-auto ${
                activeTab === "account"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Cont
            </Button>
          </div>
        </nav>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          {activeTab === "requests" && (
            <ClientRequests
              clientRequests={clientRequests}
              viewedRequests={viewedRequests}
              onViewDetails={handleViewDetails}
              onMessage={handleMessage}
              onSendOffer={handleSendOffer}
              onRejectRequest={handleRejectRequest}
              selectedRequest={selectedRequest}
              requestClient={requestClient}
              cars={cars}
            />
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
              serviceData={serviceData}
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