import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  MailOpen,
  FileText,
  MessageSquare,
  CarIcon,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CarManagement from "@/components/dashboard/CarManagement";
import { RequestForm } from "@/components/dashboard/RequestForm";
import { ProfileSection } from "@/components/dashboard/ProfileSection";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import type { RequestFormData, TabType } from "@/types/dashboard";
import { useProfile } from "@/hooks/useProfile";
import { useRequests } from "@/hooks/useRequests";
import { useMessages } from "@/hooks/useMessages";
import { useCars } from "@/hooks/useCars";
import { ReceivedOffers } from "@/components/dashboard/ReceivedOffers";
import { MessagesSection } from "@/components/dashboard/MessagesSection";
import { MyRequests } from "@/components/dashboard/MyRequests";
import { EmailVerificationView } from "@/components/dashboard/EmailVerificationView";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("requests");
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isCarDialogOpen, setIsCarDialogOpen] = useState(false);
  const [requestFormData, setRequestFormData] = useState<Partial<RequestFormData>>({});
  const [newOffersCount, setNewOffersCount] = useState(0);
  const [viewedOffers, setViewedOffers] = useState<Set<string>>(new Set());

  const { profile } = useProfile(user?.uid || "");
  const { requests, fetchRequests, addRequest, cancelRequest } = useRequests(user?.uid || "");
  const { 
    messages,
    messageGroups,
    messageServices,
    messageContent,
    sendingMessage,
    selectedMessageRequest,
    isViewingConversation,
    unreadServiceCount,
    setMessageContent,
    sendMessage,
    markMessageAsRead,
    handleSelectConversation,
    handleBackToList,
  } = useMessages(user?.uid || "");
  const { cars, fetchCars } = useCars(user?.uid || "");

  const handleMessageService = (serviceId: string, requestId: string) => {
    console.log("Opening message with service:", serviceId, "for request:", requestId);
    setActiveTab("messages");
    handleSelectConversation(requestId, serviceId);
  };

  useEffect(() => {
    const fetchViewedOffers = async () => {
      if (!user) return;

      try {
        const viewedOffersRef = doc(db, `users/${user.uid}/metadata/viewedOffers`);
        const viewedOffersDoc = await getDoc(viewedOffersRef);
        if (viewedOffersDoc.exists()) {
          setViewedOffers(new Set(viewedOffersDoc.data().offerIds || []));
        }
      } catch (error) {
        console.error("Error fetching viewed offers:", error);
      }
    };

    const fetchNewOffersCount = async () => {
      if (!user) return;

      try {
        const offersRef = collection(db, "offers");
        const q = query(offersRef, where("clientId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const unviewedCount = querySnapshot.docs.filter(doc => !viewedOffers.has(doc.id)).length;
        setNewOffersCount(unviewedCount);
      } catch (error) {
        console.error("Error fetching new offers count:", error);
      }
    };

    fetchViewedOffers();
    fetchNewOffersCount();
  }, [user, viewedOffers]);

  useEffect(() => {
    if (user) {
      fetchRequests();
      fetchCars();
    }
  }, [user, fetchRequests, fetchCars]);

  const handleRequestSubmit = async (data: RequestFormData) => {
    if (!user) return;

    const success = await addRequest(data, profile.name || "Client necunoscut");
    if (success) {
      setRequestFormData({});
      setIsRequestDialogOpen(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!user?.uid) return;

    try {
      await cancelRequest(requestId);
      toast({
        title: "Success",
        description: "Cererea a fost anulată cu succes.",
      });
    } catch (error) {
      console.error("Error updating request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-a putut anula cererea. Te rugăm să încerci din nou.",
      });
    }
  };

  if (!user?.emailVerified) {
    return <EmailVerificationView />;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-4 md:space-y-6 max-w-[1400px]">
        <nav className="flex flex-col lg:flex-row gap-4 border-b pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-row gap-2 w-full">
            <Button
              variant={activeTab === "requests" ? "default" : "ghost"}
              onClick={() => setActiveTab("requests")}
              className={`flex items-center justify-start h-auto py-2 px-3 ${
                activeTab === "requests"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-sm">Cererile mele</span>
            </Button>
            <Button
              variant={activeTab === "offers" ? "default" : "ghost"}
              onClick={() => setActiveTab("offers")}
              className={`flex items-center justify-start h-auto py-2 px-3 ${
                activeTab === "offers"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <MailOpen className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-sm flex items-center gap-2">
                Oferte Primite
                {newOffersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-[#00aff5] text-white text-xs px-2 py-0.5 rounded-full"
                  >
                    {newOffersCount}
                  </Badge>
                )}
              </span>
            </Button>
            <Button
              variant={activeTab === "messages" ? "default" : "ghost"}
              onClick={() => setActiveTab("messages")}
              className={`flex items-center justify-start h-auto py-2 px-3 ${
                activeTab === "messages"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-sm flex items-center gap-2">
                Mesaje
                {unreadServiceCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-[#00aff5] text-white text-xs px-2 py-0.5 rounded-full"
                  >
                    {unreadServiceCount}
                  </Badge>
                )}
              </span>
            </Button>
            <Button
              variant={activeTab === "car" ? "default" : "ghost"}
              onClick={() => setActiveTab("car")}
              className={`flex items-center justify-start h-auto py-2 px-3 ${
                activeTab === "car"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <CarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-sm">Mașina Mea</span>
            </Button>
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              onClick={() => setActiveTab("profile")}
              className={`flex items-center justify-start h-auto py-2 px-3 ${
                activeTab === "profile"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <User className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-sm">Cont</span>
            </Button>
          </div>
          <div className="w-full lg:w-auto">
            <Button
              onClick={() => setIsRequestDialogOpen(true)}
              className="w-full lg:w-auto bg-[#00aff5] hover:bg-[#0099d6] text-white h-auto py-2 px-3"
            >
              <Plus className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="font-semibold text-sm">Adaugă cerere</span>
            </Button>
          </div>
        </nav>

        <div className="p-0 sm:p-0">
          {activeTab === "requests" && (
            <MyRequests
              requests={requests}
              cars={cars}
              onDelete={handleDeleteRequest}
              refreshRequests={fetchRequests}
            />
          )}
          {activeTab === "offers" && (
            <ReceivedOffers
              cars={cars}
              onMessageService={handleMessageService}
            />
          )}
          {activeTab === "messages" && (
            <MessagesSection
              messages={messages}
              messageGroups={messageGroups}
              messageServices={messageServices}
              selectedMessageRequest={selectedMessageRequest}
              isViewingConversation={isViewingConversation}
              messageContent={messageContent}
              sendingMessage={sendingMessage}
              userId={user?.uid || ""}
              userName={profile?.name || "Client"}
              onMessageContentChange={setMessageContent}
              onSendMessage={sendMessage}
              onSelectConversation={handleSelectConversation}
              onBackToList={handleBackToList}
              markMessageAsRead={markMessageAsRead}
              requests={requests}
            />
          )}
          {activeTab === "car" && <CarManagement />}
          {activeTab === "profile" && <ProfileSection userId={user?.uid || ""} />}
        </div>
      </div>

      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adaugă o cerere nouă</DialogTitle>
          </DialogHeader>
          <RequestForm
            onSubmit={handleRequestSubmit}
            onCancel={() => {
              setRequestFormData({});
              setIsRequestDialogOpen(false);
            }}
            onAddCar={(currentFormData) => {
              setRequestFormData(currentFormData);
              setIsRequestDialogOpen(false);
              setIsCarDialogOpen(true);
            }}
            initialData={requestFormData}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCarDialogOpen} onOpenChange={setIsCarDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adaugă o mașină nouă</DialogTitle>
          </DialogHeader>
          <CarManagement
            isDialog={true}
            onBackClick={() => {
              setIsCarDialogOpen(false);
              setIsRequestDialogOpen(true);
            }}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}