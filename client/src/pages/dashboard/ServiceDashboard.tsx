import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
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

  if (!serviceData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error loading service data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="mx-auto max-w-7xl">
        <div className="border-b bg-white">
          <div className="px-4 py-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                <TabsTrigger value="requests" className="rounded-md px-3 py-1 text-sm font-medium">
                  Cereri
                </TabsTrigger>
                <TabsTrigger value="offers" className="rounded-md px-3 py-1 text-sm font-medium">
                  Oferte
                </TabsTrigger>
                <TabsTrigger value="messages" className="rounded-md px-3 py-1 text-sm font-medium">
                  Mesaje
                </TabsTrigger>
                <TabsTrigger value="appointments" className="rounded-md px-3 py-1 text-sm font-medium">
                  Programări
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-md px-3 py-1 text-sm font-medium">
                  Recenzii
                </TabsTrigger>
                <TabsTrigger value="account" className="rounded-md px-3 py-1 text-sm font-medium">
                  Cont
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <main className="px-4 py-8">
          <TabsContent value="requests">
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
          </TabsContent>
          <TabsContent value="offers">
            <SentOffers
              requests={[]}
              cars={cars}
              refreshRequests={fetchMessages}
            />
          </TabsContent>
          <TabsContent value="messages">
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
          </TabsContent>
          <TabsContent value="appointments">
            <AppointmentsSection />
          </TabsContent>
          <TabsContent value="reviews">
            <ReviewsSection />
          </TabsContent>
          <TabsContent value="account">
            <ServiceAccountSection
              userId={user?.uid || ""}
              serviceData={serviceData}
              fields={fields}
              validationErrors={{}}
            />
          </TabsContent>
        </main>
      </div>
      <Footer />
    </div>
  );
}