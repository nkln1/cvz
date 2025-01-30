import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  MailOpen,
  FileText,
  MessageSquare,
  Phone,
  MapPin,
  AlertTriangle,
  Car as CarIcon,
  Plus,
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
import { doc, getDoc, addDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import type { UserProfile, Request, Message, RequestFormData, TabType } from "@/types/dashboard";


export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("requests");
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isCarDialogOpen, setIsCarDialogOpen] = useState(false);
  const [requestFormData, setRequestFormData] = useState<Partial<RequestFormData>>({});
  const [requests, setRequests] = useState<Request[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageServices, setMessageServices] = useState<{ [key: string]: any }>({});
  const [isResendingVerification, setIsResendingVerification] = useState(false);


  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchRequests();
      fetchCars();
      fetchMessages();
    }
  }, [user]);

  useEffect(() => {
    if (userProfile.county) {
      setSelectedCounty(userProfile.county);
    }
  }, [userProfile.county]);

  const fetchUserProfile = async () => {
    if (!user?.uid) return;

    try {
      const userDoc = await getDoc(doc(db, "clients", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        setUserProfile(userData);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-au putut încărca datele profilului.",
      });
    }
  };

  const fetchRequests = async () => {
    if (!user?.uid) return;

    try {
      const requestsQuery = query(
        collection(db, "requests"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(requestsQuery);
      const loadedRequests: Request[] = [];
      querySnapshot.forEach((doc) => {
        loadedRequests.push({ id: doc.id, ...doc.data() } as Request);
      });
      setRequests(loadedRequests);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-au putut încărca cererile.",
      });
    }
  };

  const fetchCars = async () => {
    if (!user?.uid) return;

    try {
      const carsQuery = query(
        collection(db, "cars"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(carsQuery);
      const loadedCars: Car[] = [];
      querySnapshot.forEach((doc) => {
        loadedCars.push({ id: doc.id, ...doc.data() } as Car);
      });
      setCars(loadedCars);
    } catch (error) {
      console.error("Error loading cars:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-au putut încărca mașinile.",
      });
    }
  };

  const fetchMessages = async () => {
    if (!user?.uid) return;

    try {
      const messagesQuery = query(
        collection(db, "messages"),
        where("toId", "==", user.uid)
      );
      const querySnapshot = await getDocs(messagesQuery);
      const loadedMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        loadedMessages.push({ id: doc.id, ...doc.data() } as Message);
      });

      loadedMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMessages(loadedMessages);

      const uniqueServiceIds = [...new Set(loadedMessages.map(m => m.fromId))];
      const serviceDetails: { [key: string]: any } = {};

      for (const serviceId of uniqueServiceIds) {
        const serviceDoc = await getDoc(doc(db, "services", serviceId));
        if (serviceDoc.exists()) {
          serviceDetails[serviceId] = serviceDoc.data();
        }
      }

      setMessageServices(serviceDetails);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-au putut încărca mesajele.",
      });
    }
  };

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

  const handleDeleteRequest = async (requestId: string) => {
    if (!user?.uid) return;

    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        status: "Anulat",
        updatedAt: new Date().toISOString(),
      });

      await fetchRequests();

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

  const renderProfile = () => (
    <ProfileSection
      userProfile={userProfile}
      userId={user?.uid || ""}
      onProfileUpdate={setUserProfile}
    />
  );

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
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="solved">Rezolvate</TabsTrigger>
            <TabsTrigger value="canceled">Anulate</TabsTrigger>
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
          refreshRequests={fetchRequests}
          hideDeleteButton={true}
        />
      </CardContent>
    </Card>
  );

  const markMessageAsRead = async (messageId: string) => {
    try {
      const messageRef = doc(db, "messages", messageId);
      await updateDoc(messageRef, {
        read: true
      });

      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

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
        return renderProfile();
      default:
        return null;
    }
  };

  const handleRequestSubmit = async (data: RequestFormData) => {
    if (!user) return;

    try {
      const requestData = {
        ...data,
        userId: user.uid,
        clientName: userProfile.name || "Client necunoscut",
        status: "Active",
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "requests"), requestData);

      toast({
        title: "Success",
        description: "Cererea ta a fost adăugată cu succes!",
      });

      fetchRequests();

      setRequestFormData({});
      setIsRequestDialogOpen(false);
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Nu s-a putut adăuga cererea. Te rugăm să încerci din nou.",
      });
    }
  };

  if (!user?.emailVerified) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <Alert variant="destructive" className="mb-6">
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
            className="w-full max-w-md mx-auto block"
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