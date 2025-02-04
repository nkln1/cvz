import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  MailOpen,
  MessageSquare,
  SendHorizontal,
  User,
  Bell,
  BellOff,
  Loader2,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import romanianCitiesData from "../../../../attached_assets/municipii_orase_romania.json";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ServiceProfileSection } from "@/components/dashboard/ServiceProfileSection";
import { ClientRequests } from "@/components/dashboard/ClientRequests";
import { SentOffers } from "@/components/dashboard/SentOffers";
import { AcceptedOffers } from "@/components/dashboard/AcceptedOffers";
import { ServiceMessagesSection } from "@/components/dashboard/ServiceMessagesSection";
import { ServiceAccountSection } from "@/components/dashboard/ServiceAccountSection";
import { useServiceMessages } from "@/hooks/useServiceMessages";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { useNotifications } from "@/hooks/useNotifications";
import type { ServiceData, Request as ServiceRequest } from "@/types/service";

type TabType =
  | "requests"
  | "offers"
  | "accepted-offers"
  | "messages"
  | "account";

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
  const [, setLocation] = useLocation();
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
  const [refreshOffersCounter, setRefreshOffersCounter] = useState(0);
  const [newAcceptedOffersCount, setNewAcceptedOffersCount] = useState(0);
  const [refreshSentOffers, setRefreshSentOffers] = useState(0);
  const [lastOffersSnapshot, setLastOffersSnapshot] = useState<string>("");


  const {
    messages,
    messageGroups,
    selectedMessageRequest,
    isViewingConversation,
    messageContent,
    sendingMessage,
    unreadClientsCount,
    sendMessage,
    handleSelectConversation,
    handleBackToList,
    setMessageContent,
    setSelectedMessageRequest,
    markMessageAsRead,
  } = useServiceMessages(user?.uid || "");

  const {
    clientRequests,
    selectedRequest,
    cars,
    viewedRequests,
    handleViewDetails,
    handleRejectRequest,
    markRequestAsViewed,
  } = useServiceRequests(user?.uid || "", serviceData);

  const { notificationPermission, requestNotificationPermission } =
    useNotifications(user?.uid || "");

  const newRequestsCount = clientRequests.filter(
    (request) => !viewedRequests.has(request.id),
  ).length;

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    async function fetchServiceData() {
      if (!user) {
        console.log("No user found, redirecting to login");
        setLocation("/login");
        return;
      }

      console.log("Fetching service data for user:", user.uid);
      setLoading(true);

      try {
        const serviceRef = doc(db, "services", user.uid);
        const serviceDoc = await getDoc(serviceRef);

        if (serviceDoc.exists()) {
          const data = serviceDoc.data() as ServiceData;
          console.log("Service data fetched:", data);
          setServiceData(data);
        } else {
          console.error("No service document found for user:", user.uid);
          setError(
            "Nu s-au găsit date pentru acest service. Vă rugăm să vă autentificați din nou.",
          );
          setLocation("/login");
        }
      } catch (error) {
        console.error("Error fetching service data:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Eroare necunoscută";
        setError(`Nu am putut încărca datele serviciului: ${errorMessage}`);
        toast({
          variant: "destructive",
          title: "Eroare",
          description:
            "Nu am putut încărca datele serviciului. Vă rugăm să încercați din nou.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchServiceData();
  }, [user, toast, setLocation]);

  useEffect(() => {
    const checkOffersUpdates = async () => {
      if (!user) return;

      try {
        // Get viewed offers
        const viewedOffersRef = doc(db, `users/${user.uid}/metadata/viewedAcceptedOffers`);
        const viewedOffersDoc = await getDoc(viewedOffersRef);
        const viewedOfferIds = viewedOffersDoc.exists()
          ? new Set(viewedOffersDoc.data().offerIds || [])
          : new Set();

        // Query all offers for the service
        const offersRef = collection(db, "offers");
        const q = query(
          offersRef,
          where("serviceId", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);

        // Create a snapshot string of current offers state
        const currentSnapshot = JSON.stringify(querySnapshot.docs.map(doc => ({
          id: doc.id,
          status: doc.data().status,
          updatedAt: doc.data().updatedAt?.toMillis()
        })));

        // Only update if the offers have changed
        if (currentSnapshot !== lastOffersSnapshot) {
          // Count new accepted offers
          const newAcceptedOffersCount = querySnapshot.docs.filter(
            doc => doc.data().status === "Accepted" && !viewedOfferIds.has(doc.id)
          ).length;

          setNewAcceptedOffersCount(newAcceptedOffersCount);
          setRefreshSentOffers(prev => prev + 1);
          setLastOffersSnapshot(currentSnapshot);
        }
      } catch (error) {
        console.error("Error checking offers updates:", error);
      }
    };

    // Initial check
    checkOffersUpdates();

    // Set up periodic checks every 5 seconds
    const interval = setInterval(checkOffersUpdates, 5000);

    return () => clearInterval(interval);
  }, [user, lastOffersSnapshot]);

  const switchToMessagesAndOpenConversation = (request: ServiceRequest) => {
    setActiveTab("messages");
    if (request) {
      handleSelectConversation(request.id);
    }
  };

  const switchToRequestsAndShowDetails = (requestId: string) => {
    setActiveTab("requests");
    const request = clientRequests.find((req) => req.id === requestId);
    if (request) {
      handleViewDetails(request);
    }
  };

  const handleSendOffer = async (request: ServiceRequest, formData: any) => {
    if (!user) return;

    try {
      console.log("Creating new offer:", { request, formData });
      const newOffer = {
        requestId: request.id,
        serviceId: user.uid,
        clientId: request.userId,
        status: "Pending",
        createdAt: new Date(),
        title: formData.title,
        details: formData.details,
        availableDate: formData.availableDate,
        price: formData.price,
        notes: formData.notes || "",
      };

      const offersRef = collection(db, "offers");
      const docRef = await addDoc(offersRef, newOffer);
      console.log("Offer created with ID:", docRef.id);

      // Update the request to mark that it has received an offer
      const requestRef = doc(db, "requests", request.id);
      await updateDoc(requestRef, {
        hasReceivedOffer: true
      });

      toast({
        title: "Succes",
        description: "Oferta a fost trimisă cu succes!",
      });

      setRefreshOffersCounter((prev) => prev + 1);
      setActiveTab("offers");
    } catch (error) {
      console.error("Error sending offer:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut trimite oferta. Vă rugăm să încercați din nou.",
      });
    }
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-4 md:space-y-6 max-w-[1400px]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold">Service Dashboard</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation(`/service/${user?.uid}`)}
              className="flex items-center gap-2 text-[#00aff5] hover:text-[#0099d6]"
            >
              <Building2 className="h-4 w-4" />
              Vezi Profil Public
            </Button>
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
        </div>

        <nav className="flex flex-col sm:flex-row gap-2 border-b pb-4 overflow-x-auto scrollbar-hide">
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full">
            <NavigationButton
              tab="requests"
              activeTab={activeTab}
              icon={<FileText className="w-4 h-4 mr-2 flex-shrink-0" />}
              label="Cereri"
              onClick={setActiveTab}
              notificationCount={newRequestsCount}
            />
            <NavigationButton
              tab="offers"
              activeTab={activeTab}
              icon={<MailOpen className="w-4 h-4 mr-2 flex-shrink-0" />}
              label="Oferte trimise"
              onClick={setActiveTab}
            />
            <NavigationButton
              tab="accepted-offers"
              activeTab={activeTab}
              icon={<SendHorizontal className="w-4 h-4 mr-2 flex-shrink-0" />}
              label="Oferte acceptate"
              onClick={setActiveTab}
              notificationCount={newAcceptedOffersCount}
            />
            <NavigationButton
              tab="messages"
              activeTab={activeTab}
              icon={<MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />}
              label="Mesaje"
              onClick={setActiveTab}
              notificationCount={unreadClientsCount}
            />
            <NavigationButton
              tab="account"
              activeTab={activeTab}
              icon={<User className="w-4 h-4 mr-2 flex-shrink-0" />}
              label="Cont"
              onClick={setActiveTab}
            />
          </div>
        </nav>

        {activeTab === "requests" && (
          <ClientRequests
            clientRequests={clientRequests}
            viewedRequests={viewedRequests}
            onViewDetails={handleViewDetails}
            onMessage={switchToMessagesAndOpenConversation}
            onSendOffer={handleSendOffer}
            onRejectRequest={handleRejectRequest}
            selectedRequest={selectedRequest}
            cars={cars}
          />
        )}
        {activeTab === "offers" && (
          <SentOffers
            requests={clientRequests}
            cars={cars}
            refreshRequests={async () => {
              setRefreshOffersCounter((prev) => prev + 1);
            }}
            refreshCounter={refreshSentOffers}
          />
        )}
        {activeTab === "accepted-offers" && (
          <AcceptedOffers
            requests={clientRequests}
            cars={cars}
            refreshRequests={async () => {
              setRefreshOffersCounter((prev) => prev + 1);
            }}
            refreshCounter={refreshSentOffers}
            onMessageService={(serviceId, requestId) => switchToMessagesAndOpenConversation({ id: requestId } as ServiceRequest)}
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
            onViewRequestDetails={switchToRequestsAndShowDetails}
            userId={user?.uid || ""}
            serviceName={serviceData?.companyName || "Service Auto"}
            markMessageAsRead={markMessageAsRead}
          />
        )}
        {activeTab === "account" && (
          <ServiceAccountSection
            userId={user?.uid || ""}
            serviceData={serviceData || ({} as ServiceData)}
            fields={[
              { label: "Nume Companie", key: "companyName", editable: true },
              {
                label: "Nume Reprezentant",
                key: "representativeName",
                editable: true,
              },
              { label: "Email", key: "email", editable: false },
              { label: "Telefon", key: "phone", editable: true },
              { label: "CUI", key: "cui", editable: false },
              {
                label: "Nr. Înregistrare",
                key: "tradeRegNumber",
                editable: false,
              },
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
                options: serviceData?.county
                  ? romanianCitiesData[
                      serviceData.county as keyof typeof romanianCitiesData
                    ]
                  : [],
              },
            ]}
            validationErrors={{}}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}