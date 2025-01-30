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

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("requests");
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isCarDialogOpen, setIsCarDialogOpen] = useState(false);
  const [requestFormData, setRequestFormData] = useState<Partial<RequestFormData>>({});

  const { profile } = useProfile(user?.uid || "");
  const { requests, fetchRequests, addRequest, cancelRequest } = useRequests(user?.uid || "");
  const { messages, messageServices, fetchMessages, markMessageAsRead } = useMessages(user?.uid || "");
  const { cars, fetchCars } = useCars(user?.uid || "");

  useEffect(() => {
    if (user) {
      fetchRequests();
      fetchMessages();
      fetchCars();
    }
  }, [user, fetchRequests, fetchMessages, fetchCars]);

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

  const renderRequests = () => (
    <MyRequests
      requests={requests}
      cars={cars}
      onDelete={handleDeleteRequest}
      refreshRequests={fetchRequests}
    />
  );

  const renderOffers = () => (
    <ReceivedOffers
      requests={requests}
      cars={cars}
      refreshRequests={fetchRequests}
    />
  );

  const renderMessages = () => {
    const requestTitles = requests.reduce((acc, request) => {
      acc[request.id] = request.title;
      return acc;
    }, {} as Record<string, string>);

    return (
      <MessagesSection
        messages={messages}
        messageServices={messageServices}
        markMessageAsRead={markMessageAsRead}
        requestTitles={requestTitles}
      />
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "requests":
        return renderRequests();
      case "offers":
        return renderOffers();
      case "messages":
        return renderMessages();
      case "car":
        return <CarManagement />;
      case "profile":
        return <ProfileSection userId={user?.uid || ""} />;
      default:
        return null;
    }
  };

  if (!user?.emailVerified) {
    return <EmailVerificationView />;
  }

  return (
    <MainLayout>
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
              Cererile mele
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
              Oferte Primite
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
              variant={activeTab === "car" ? "default" : "ghost"}
              onClick={() => setActiveTab("car")}
              className={`flex items-center justify-start w-full sm:w-auto ${
                activeTab === "car"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <CarIcon className="w-4 h-4 mr-2" />
              Mașina Mea
            </Button>
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              onClick={() => setActiveTab("profile")}
              className={`flex items-center justify-start w-full sm:w-auto ${
                activeTab === "profile"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Cont
            </Button>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-auto">
            <Button
              onClick={() => setIsRequestDialogOpen(true)}
              className="w-full sm:w-auto bg-[#00aff5] hover:bg-[#0099d6] text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-semibold">Adaugă cerere</span>
            </Button>
          </div>
        </nav>

        {renderContent()}

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
      </div>
    </MainLayout>
  );
}