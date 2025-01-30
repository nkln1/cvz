import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  MailOpen,
  FileText,
  MessageSquare,
  CarIcon,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import CarManagement from "./CarManagement";
import { RequestForm } from "@/components/dashboard/RequestForm";
import { format } from "date-fns";
import { RequestsTable } from "@/components/dashboard/RequestsTable";
import { ProfileSection } from "@/components/dashboard/ProfileSection";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import type { RequestFormData, TabType, Car } from "@/types/dashboard";
import { useProfile } from "@/hooks/useProfile";
import { useRequests } from "@/hooks/useRequests";
import { useMessages } from "@/hooks/useMessages";
import { useCars } from "@/hooks/useCars";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("requests");
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isCarDialogOpen, setIsCarDialogOpen] = useState(false);
  const [requestFormData, setRequestFormData] = useState<Partial<RequestFormData>>({});
  const [isResendingVerification, setIsResendingVerification] = useState(false);

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

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;

    setIsResendingVerification(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: "Email trimis",
        description:
          "Un nou email de verificare a fost trimis. Te rugăm să îți verifici căsuța de email.",
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description:
          "Nu s-a putut trimite emailul de verificare. Te rugăm să încerci din nou mai târziu.",
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

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
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Cererile mele
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4 bg-slate-100 p-1">
            <TabsTrigger 
              value="active"
              className="data-[state=active]:bg-[#00aff5] data-[state=active]:text-white transition-colors"
            >
              Active
            </TabsTrigger>
            <TabsTrigger 
              value="solved"
              className="data-[state=active]:bg-[#00aff5] data-[state=active]:text-white transition-colors"
            >
              Rezolvate
            </TabsTrigger>
            <TabsTrigger 
              value="canceled"
              className="data-[state=active]:bg-[#00aff5] data-[state=active]:text-white transition-colors"
            >
              Anulate
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <RequestsTable
              requests={requests.filter((req) => req.status === "Active")}
              cars={cars}
              onDelete={handleDeleteRequest}
              refreshRequests={fetchRequests}
            />
          </TabsContent>
          <TabsContent value="solved">
            <RequestsTable
              requests={requests.filter((req) => req.status === "Rezolvat")}
              cars={cars}
              onDelete={handleDeleteRequest}
              refreshRequests={fetchRequests}
            />
          </TabsContent>
          <TabsContent value="canceled">
            <RequestsTable
              requests={requests.filter((req) => req.status === "Anulat")}
              cars={cars}
              onDelete={handleDeleteRequest}
              refreshRequests={fetchRequests}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  const renderOffers = () => (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <MailOpen className="h-5 w-5" />
          Oferte Primite
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <RequestsTable
          requests={requests}
          cars={cars}
          hideDeleteButton={true}
          refreshRequests={fetchRequests}
        />
      </CardContent>
    </Card>
  );

  const renderMessages = () => (
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
                const request = requests.find(r => r.id === message.requestId);

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
                              Pentru cererea: {request?.title || 'Cerere service'}
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
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Email neverificat</AlertTitle>
            <AlertDescription>
              Te rugăm să îți confirmi adresa de email pentru a avea acces la
              toate funcționalitățile. Verifică-ți căsuța de email pentru
              linkul de confirmare.
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleResendVerification}
            disabled={isResendingVerification}
            className="w-full max-w-md mx-auto block mt-4"
          >
            {isResendingVerification
              ? "Se trimite..."
              : "Retrimite email de verificare"}
          </Button>
        </div>
      </MainLayout>
    );
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