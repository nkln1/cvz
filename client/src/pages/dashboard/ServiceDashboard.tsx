import { useAuth } from "@/context/AuthContext";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  doc as docRef,
  addDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState, Fragment } from "react";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  MessageSquare,
  Calendar,
  UserCog,
  Store,
  Clock,
  SendHorizontal,
  Pen,
  Save,
  Eye,
  X,
  ArrowLeft,
  ArrowUpDown,
  Search,
  Star,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import romanianCitiesData from "../../../../attached_assets/municipii_orase_romania.json";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ServiceProfileSection } from "@/components/dashboard/ServiceProfileSection";
import { ClientRequests } from "@/components/dashboard/ClientRequests";

interface Car {
  id: string;
  brand: string;
  model: string;
  year: string;
  vin?: string;
  licensePlate?: string;
}

interface Request {
  id: string;
  title: string;
  description: string;
  carId: string;
  car?: Car;
  preferredDate: string;
  county: string;
  cities: string[];
  status: "Active" | "Rezolvat" | "Anulat";
  createdAt: string;
  userId: string;
  clientName: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  numeComplet?: string;
  nume?: string;
  prenume?: string;
}

interface Message {
  id: string;
  requestId: string;
  fromId: string;
  toId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface MessageGroup {
  requestId: string;
  requestTitle: string;
  lastMessage: Message;
  unreadCount: number;
}

const serviceDataSchema = z.object({
  companyName: z
    .string()
    .min(3, "Numele companiei trebuie să aibă cel puțin 3 caractere"),
  representativeName: z
    .string()
    .min(3, "Numele reprezentantului trebuie să aibă cel puțin 3 caractere"),
  email: z.string().email("Adresa de email nu este validă"),
  phone: z
    .string()
    .regex(
      /^(\+4|)?(07[0-8]{1}[0-9]{1}|02[0-9]{2}|03[0-9]{2}){1}?(\s|\.|\-)?([0-9]{3}(\s|\.|\-|)){2}$/,
      "Numărul de telefon nu este valid",
    ),
  cui: z.string(),
  tradeRegNumber: z.string(),
  address: z.string().min(5, "Adresa trebuie să aibă cel puțin 5 caractere"),
  county: z.string().min(2, "Selectați județul"),
  city: z.string().min(2, "Selectați orașul"),
});

interface ServiceData {
  companyName: string;
  representativeName: string;
  email: string;
  phone: string;
  cui: string;
  tradeRegNumber: string;
  address: string;
  county: string;
  city: string;
  [key: string]: string;
}

interface EditableField {
  label: string;
  key: keyof ServiceData;
  editable: boolean;
  type?: "text" | "select";
  options?: string[];
}

interface ValidationErrors {
  [key: string]: string;
}

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
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [clientRequests, setClientRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [requestClient, setRequestClient] = useState<User | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedMessageRequest, setSelectedMessageRequest] =
    useState<Request | null>(() => {
      const savedRequestId = localStorage.getItem("selectedMessageRequestId");
      return null;
    });
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([]);
  const [isViewingConversation, setIsViewingConversation] = useState(false);
  const [viewedRequests, setViewedRequests] = useState<Set<string>>(() => {
    const savedViewedRequests = localStorage.getItem("viewedRequests");
    return new Set(savedViewedRequests ? JSON.parse(savedViewedRequests) : []);
  });
  const [sortField, setSortField] = useState<keyof Request>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [cars, setCars] = useState<Record<string, Car>>({});


  const romanianCounties = Object.keys(romanianCitiesData);

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
      options: romanianCounties,
    },
    {
      label: "Oraș",
      key: "city",
      editable: true,
      type: "select",
      options: availableCities,
    },
  ];

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    const savedViewedRequests = localStorage.getItem("viewedRequests");
    if (savedViewedRequests) {
      setViewedRequests(new Set(JSON.parse(savedViewedRequests)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("viewedRequests", JSON.stringify([...viewedRequests]));
  }, [viewedRequests]);

  useEffect(() => {
    async function fetchServiceData() {
      if (!user) return;

      try {
        const serviceDoc = await getDoc(doc(db, "services", user.uid));
        if (serviceDoc.exists()) {
          const data = serviceDoc.data() as ServiceData;
          setServiceData(data);
          if (data.county) {
            setAvailableCities(
              romanianCitiesData[
                data.county as keyof typeof romanianCitiesData
              ] || [],
            );
          }
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

  const validateField = (field: keyof ServiceData, value: string) => {
    try {
      const schema = z.object({
        [field]:
          serviceDataSchema.shape[
            field as keyof typeof serviceDataSchema.shape
          ],
      });
      schema.parse({ [field]: value });
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors[0]?.message;
        setValidationErrors((prev) => ({
          ...prev,
          [field]: fieldError,
        }));
        return false;
      }
      return false;
    }
  };

  const handleEdit = (field: keyof ServiceData) => {
    setEditingFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleChange = (field: keyof ServiceData, value: string) => {
    if (serviceData) {
      const newData = { ...serviceData, [field]: value };

      if (field === "county") {
        setAvailableCities(
          romanianCitiesData[value as keyof typeof romanianCitiesData] || [],
        );
        newData.city = "";
      }

      setServiceData(newData);
      validateField(field, value);
    }
  };

  const handleSave = async () => {
    if (!user || !serviceData) return;

    let isValid = true;
    const newErrors: ValidationErrors = {};

    fields.forEach(({ key, editable }) => {
      if (editable) {
        try {
          const schema = z.object({
            [key]:
              serviceDataSchema.shape[
                key as keyof typeof serviceDataSchema.shape
              ],
          });
          schema.parse({ [key]: serviceData[key] });
        } catch (error) {
          if (error instanceof z.ZodError) {
            isValid = false;
            newErrors[key] = error.errors[0]?.message || `${key} is invalid`;
          }
        }
      }
    });

    setValidationErrors(newErrors);

    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Eroare de validare",
        description: "Verificați câmpurile cu erori și încercați din nou.",
      });
      return;
    }

    setLoading(true);
    try {
      const serviceRef = doc(db, "services", user.uid);
      await updateDoc(serviceRef, serviceData);
      toast({
        title: "Succes",
        description: "Datele au fost actualizate cu succes.",
      });
    } catch (error) {
      console.error("Error updating service data:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description:
          "Nu am putut actualiza datele. Vă rugăm încercați din nou.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientRequests = async () => {
    if (!user || !serviceData) return;

    try {
      let requestsQuery = query(
        collection(db, "requests"),
        where("status", "==", "Active"),
        where("county", "==", serviceData.county),
        where("cities", "array-contains", serviceData.city),
      );

      const querySnapshot = await getDocs(requestsQuery);
      const allRequests: Request[] = [];
      const allCars: Record<string, Car> = {};

      for (const doc of querySnapshot.docs) {
        const requestData = doc.data() as Request;
        const carDoc = await getDoc(docRef(db, "cars", requestData.carId));
        const carData = carDoc.exists() ? (carDoc.data() as Car) : undefined;

        allRequests.push({
          id: doc.id,
          ...requestData,
          car: carData,
        } as Request);
        if (carData) allCars[requestData.carId] = carData;
      }

      allRequests.sort((a, b) => {
        if (sortField === "createdAt") {
          return sortDirection === "desc"
            ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortField === "preferredDate") {
          return sortDirection === "desc"
            ? new Date(b.preferredDate).getTime() - new Date(a.preferredDate).getTime()
            : new Date(a.preferredDate).getTime() - new Date(b.preferredDate).getTime();
        }
        return 0;
      });

      setClientRequests(allRequests);
      setCars(allCars);
    } catch (error) {
      console.error("Error fetching client requests:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-au putut încărca cererile clienților.",
      });
    }
  };

  const fetchRequestClient = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: userDoc.id,
          name: userData.name || "",
          email: userData.email || "",
        } as User;
      }
      return null;
    } catch (error) {
      console.error("Error fetching client details:", error);
      return null;
    }
  };

  const markRequestAsViewed = (requestId: string) => {
    setViewedRequests((prev) => {
      const newSet = new Set(prev);
      newSet.add(requestId);
      return newSet;
    });
    localStorage.setItem(
      "viewedRequests",
      JSON.stringify([...viewedRequests, requestId]),
    );
  };

  const handleViewDetails = async (request: Request) => {
    markRequestAsViewed(request.id);
    if (selectedRequest?.id === request.id) {
      setSelectedRequest(null);
      setRequestClient(null);
    } else {
      setSelectedRequest(request);
      const client = await fetchRequestClient(request.userId);
      setRequestClient(client);
    }
  };

  useEffect(() => {
    if (serviceData) {
      fetchClientRequests();
    }
  }, [serviceData, sortField, sortDirection, itemsPerPage]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        status: "Rezolvat",
      });
      await fetchClientRequests();
      toast({
        title: "Succes",
        description: "Cererea a fost acceptată cu succes.",
      });
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut accepta cererea. Încercați din nou.",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    markRequestAsViewed(requestId);
    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        status: "Anulat",
      });
      await fetchClientRequests();
      toast({
        title: "Succes",
        description: "Cererea a fost respinsă.",
      });
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut respinge cererea. Încercați din nou.",
      });
    }
  };

  const handleMessage = (request: Request) => {
    markRequestAsViewed(request.id);
    setSelectedMessageRequest(request);
    localStorage.setItem("selectedMessageRequestId", request.id);
    setActiveTab("messages");
  };

  const handleSendOffer = async (request: Request) => {
    markRequestAsViewed(request.id);
    toast({
      description:
        "Funcționalitatea de trimitere oferte va fi disponibilă în curând.",
    });
  };

  const sendMessage = async () => {
    if (!user || !messageContent.trim() || !selectedMessageRequest) return;

    setSendingMessage(true);
    try {
      const messageRef = collection(db, "messages");
      const newMessage = {
        requestId: selectedMessageRequest.id,
        fromId: user.uid,
        toId: selectedMessageRequest.userId,
        content: messageContent.trim(),
        createdAt: new Date().toISOString(),
        read: false,
      };

      await addDoc(messageRef, newMessage);
      await fetchMessages();

      toast({
        title: "Succes",
        description: "Mesajul a fost trimis cu succes.",
      });

      setMessageContent("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut trimite mesajul. Încercați din nou.",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const fetchMessages = async () => {
    if (!user?.uid) return;

    try {
      const sentMessagesQuery = query(
        collection(db, "messages"),
        where("fromId", "==", user.uid),
      );

      const receivedMessagesQuery = query(
        collection(db, "messages"),
        where("toId", "==", user.uid),
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentMessagesQuery),
        getDocs(receivedMessagesQuery),
      ]);

      const loadedMessages: Message[] = [];
      const groupedMessages: { [key: string]: Message[] } = {};

      [sentSnapshot, receivedSnapshot].forEach((snapshot) => {
        snapshot.forEach((doc) => {
          const message = { id: doc.id, ...doc.data() } as Message;
          loadedMessages.push(message);

          if (!groupedMessages[message.requestId]) {
            groupedMessages[message.requestId] = [];
          }
          groupedMessages[message.requestId].push(message);
        });
      });

      const groups: MessageGroup[] = [];
      for (const [requestId, messages] of Object.entries(groupedMessages)) {
        try {
          const requestDoc = await getDoc(doc(db, "requests", requestId));
          if (requestDoc.exists()) {
            const requestData = requestDoc.data();
            messages.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );

            groups.push({
              requestId,
              requestTitle: requestData.title,
              lastMessage: messages[0],
              unreadCount: messages.filter(
                (m) => !m.read && m.toId === user.uid,
              ).length,
            });
          }
        } catch (error) {
          console.error(`Error fetching request ${requestId}:`, error);
        }
      }

      groups.sort(
        (a, b) =>
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime(),
      );

      setMessageGroups(groups);
      setMessages(loadedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-au putut încărca mesajele.",
      });
    }
  };

  useEffect(() => {
    if (user) {
      const savedRequestId = localStorage.getItem("selectedMessageRequestId");
      if (savedRequestId) {
        const loadSavedRequest = async () => {
          try {
            const requestDoc = await getDoc(
              doc(db, "requests", savedRequestId),
            );
            if (requestDoc.exists()) {
              setSelectedMessageRequest({
                id: requestDoc.id,
                ...requestDoc.data(),
              } as Request);
              if (!localStorage.getItem("activeTab")) {
                setActiveTab("messages");
              }
            }
          } catch (error) {
            console.error("Error loading saved request:", error);
          }
        };
        loadSavedRequest();
      }
      fetchMessages();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "messages" && selectedMessageRequest) {
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedMessageRequest]);

  const renderRequestsContent = () => (
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
  );

  const renderMessagesList = () => (
    <div className="space-y-4">
      {messageGroups.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          Nu există conversații active
        </p>
      ) : (
        messageGroups.map((group) => (
          <Card
            key={group.requestId}
            className="cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div
                  className="flex-1"
                  onClick={() => handleSelectConversation(group.requestId)}
                >
                  <h4 className="font-medium">{group.requestTitle}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {group.lastMessage.content}
                  </p>
                </div>
                <div className="flex flex-col items-end ml-4">
                  <span className="text-xs text-muted-foreground">
                    {format(
                      new Date(group.lastMessage.createdAt),
                      "dd.MM.yyyy HH:mm",
                    )}
                  </span>
                  {group.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full mt-1">
                      {group.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderConversation = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi
          </Button>
          <h3 className="font-medium">{selectedMessageRequest?.title}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            handleViewRequestDetails(selectedMessageRequest?.id || "")
          }
          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
        >
          <Eye className="h-4 w-4" />
          Detalii cerere
        </Button>
      </div>
      <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
        {messages
          .filter((msg) => msg.requestId === selectedMessageRequest?.id)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          )
          .map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg max-w-[80%] ${
                message.fromId === user?.uid
                  ? "ml-auto bg-blue-500 text-white"
                  : "bg-gray-100"
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-70">
                {format(new Date(message.createdAt), "dd.MM.yyyy HH:mm")}
              </span>
            </div>
          ))}
      </div>
      <div className="flex gap-2">
        <Textarea
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="Scrie un mesaj..."
          className="flex-1"
        />
        <Button
          onClick={sendMessage}
          disabled={!messageContent.trim() || sendingMessage}
          className="bg-[#00aff5] hover:bg-[#0099d6]"
        >
          {sendingMessage ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Se trimite...
            </>
          ) : (
            <>
              <SendHorizontal className="mr-2 h-4 w-4" />
              Trimite
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const handleViewRequestDetails = (requestId: string) => {
    const request = clientRequests.find((r) => r.id === requestId);
    if (request) {
      setSelectedRequest(request);
      setActiveTab("requests");
      fetchRequestClient(request.userId).then((client) => {
        setRequestClient(client);
      });
    }
  };

  const renderMessages = () => (
    <TabsContent value="messages">
      <Card className="border-[#00aff5]/20">
        <CardHeader>
          <CardTitle className="text-[#00aff5] flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mesaje
          </CardTitle>
          <CardDescription>
            Comunicare directă cu clienții și gestionarea conversațiilor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isViewingConversation ? renderConversation() : renderMessagesList()}
        </CardContent>
      </Card>
    </TabsContent>
  );

  const handleSelectConversation = (requestId: string) => {
    const request = clientRequests.find((r) => r.id === requestId);
    if (request) {
      setSelectedMessageRequest(request);
      setIsViewingConversation(true);
      localStorage.setItem("selectedMessageRequestId", requestId);
    }
  };
  const handleBackToList = () => {
    setIsViewingConversation(false);
    setSelectedMessageRequest(null);
    localStorage.removeItem("selectedMessageRequestId");
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

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <ServiceProfileSection
            userId={user?.uid || ""}
            serviceData={serviceData}
            setServiceData={setServiceData}
            romanianCities={romanianCitiesData}
          />
        );
      case "requests":
        return renderRequestsContent();
      case "offers":
        return (
          <TabsContent value="offers">
            <Card className="border-[#00aff5]/20">
              <CardHeader>
                <CardTitle className="text-[#00aff5] flex items-center gap-2">
                  <SendHorizontal className="h-5 w-5" />
                  Oferte Trimise
                </CardTitle>
                <CardDescription>
                  Urmărește și gestionează ofertele trimise către clienți
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Lista ofertelor va apărea aici
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        );
      case "messages":
        return renderMessages();
      case "appointments":
        return (
          <TabsContent value="appointments">
            <Card className="border-[#00aff5]/20">
              <CardHeader>
                <CardTitle className="text-[#00aff5] flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Programări
                </CardTitle>
                <CardDescription>
                  Gestionează programările și disponibilitatea serviciului
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Calendar și programări vor apărea aici
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        );
      case "reviews":
        return (
          <TabsContent value="reviews">
            <Card className="border-[#00aff5]/20">
              <CardHeader>
                <CardTitle className="text-[#00aff5] flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Recenzii
                </CardTitle>
                <CardDescription>
                  Vezi și răspunde la recenziile primite de la clienți
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Lista recenziilor va apărea aici
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        );
      case "account":
        return (
          <TabsContent value="account">
            <Card className="border-[#00aff5]/20">
              <CardHeader>
                <CardTitle className="text-[#00aff5] flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Cont
                </CardTitle>
                <CardDescription>
                  Gestionează informațiile contului și setările
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fields.map(({ label, key, editable, type, options }) => (
                    <div key={key} className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700">
                          {label}
                        </label>
                        {editable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(key)}
                            className="h-6 w-6 p-0 absolute right-2 top-0"
                          >
                            <Pen className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {type === "select" && options ? (
                          <Select
                            value={serviceData?.[key]}
                            onValueChange={(value) => handleChange(key, value)}
                            disabled={!editable}
                          >
                            <SelectTrigger
                              className={`${
                                !editable
                                  ? "bg-gray-50"
                                  : "bg-white"
                              } ${validationErrors[key] ? "border-red-500" : ""}`}
                            >
                              <SelectValue
                                placeholder={`Selectează ${label.toLowerCase()}`}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={serviceData?.[key] || ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                            disabled={!editable}
                            className={`${
                              !editable
                                ? "bg-gray-50"
                                : "bg-white"
                            } ${validationErrors[key] ? "border-red-500" : ""} pr-8`}
                          />
                        )}
                        {validationErrors[key] && (
                          <p className="text-xs text-red-500 mt-1">
                            {validationErrors[key]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleSave}
                  disabled={loading || Object.keys(validationErrors).length > 0}
                  className="mt-6 bg-[#00aff5] hover:bg-[#0099d6] float-right"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvează
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        );
      case "public-profile":
        return (
          <TabsContent value="public-profile">
            <Card className="border-[#00aff5]/20">
              <CardHeader>
                <CardTitle className="text-[#00aff5] flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Profil Public
                </CardTitle>
                <CardDescription>
                  Gestionează informațiile afișate public despre serviciul tău
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Informațiile profilului public vor apărea aici
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        <nav className="flex flex-col sm:flex-row gap-2 border-b pb-4 overflow-x-auto">
          <Button
            variant={activeTab === "requests" ? "default" : "ghost"}
            onClick={() => setActiveTab("requests")}
            className={`flex items-center justify-start ${
              activeTab === "requests"
                ? "bg-[#00aff5] text-white hover:bg-[#0099d6]"
                : "hover:text-[#00aff5]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Cereri Clienți
              {clientRequests.filter(req => !viewedRequests.has(req.id)).length > 0 && (
                <Badge variant="secondary" className="bg-white text-[#00aff5]">
                  {clientRequests.filter(req => !viewedRequests.has(req.id)).length}
                </Badge>
              )}
            </div>
          </Button>
          <Button
            variant={activeTab === "offers" ? "default" : "ghost"}
            onClick={() => setActiveTab("offers")}
            className={`flex items-center justify-start ${
              activeTab === "offers"
                ? "bg-[#00aff5] text-white hover:bg-[#0099d6]"
                : "hover:text-[#00aff5]"
            }`}
          >
            <div className="flex items-center gap-2">
              <SendHorizontal className="w-4 h-4" />
              Oferte
            </div>
          </Button>
          <Button
            variant={activeTab === "messages" ? "default" : "ghost"}
            onClick={() => setActiveTab("messages")}
            className={`flex items-center justify-start ${
              activeTab === "messages"
                ? "bg-[#00aff5] text-white hover:bg-[#0099d6]"
                : "hover:text-[#00aff5]"
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Mesaje
            </div>
          </Button>
          <Button
            variant={activeTab === "appointments" ? "default" : "ghost"}
            onClick={() => setActiveTab("appointments")}
            className={`flex items-center justify-start ${
              activeTab === "appointments"
                ? "bg-[#00aff5] text-white hover:bg-[#0099d6]"
                : "hover:text-[#00aff5]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Programări
            </div>
          </Button>
          <Button
            variant={activeTab === "reviews" ? "default" : "ghost"}
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center justify-start ${
              activeTab === "reviews"
                ? "bg-[#00aff5] text-white hover:bg-[#0099d6]"
                : "hover:text-[#00aff5]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Recenzii
            </div>
          </Button>
          <Button
            variant={activeTab === "account" ? "default" : "ghost"}
            onClick={() => setActiveTab("profile")}
            className={`flex items-center justify-start ${
              activeTab === "account"
                ? "bg-[#00aff5] text-white hover:bg-[#0099d6]"
                : "hover:text-[#00aff5]"
            }`}
          >
            <div className="flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              Profil
            </div>
          </Button>
          <Button
            variant={activeTab === "public-profile" ? "default" : "ghost"}
            onClick={() => setActiveTab("public-profile")}
            className={`flex items-center justify-start ${
              activeTab === "public-profile"
                ? "bg-[#00aff5] text-white hover:bg-[#0099d6]"
                : "hover:text-[#00aff5]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Profil Public
            </div>
          </Button>
        </nav>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {renderContent()}
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}