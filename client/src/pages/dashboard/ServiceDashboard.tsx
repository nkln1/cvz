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
  Switch,
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
  const [editedData, setEditedData] = useState<ServiceData | null>(null);
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>(
    {},
  );
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [showOnlyNew, setShowOnlyNew] = useState(false);


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
          setEditedData(data);
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
    if (editedData) {
      const newData = { ...editedData, [field]: value };

      if (field === "county") {
        setAvailableCities(
          romanianCitiesData[value as keyof typeof romanianCitiesData] || [],
        );
        newData.city = "";
      }

      setEditedData(newData);
      validateField(field, value);
    }
  };

  const handleSave = async () => {
    if (!user || !editedData) return;

    let isValid = true;
    const newErrors: ValidationErrors = {};

    fields.forEach(({ key, editable }) => {
      if (editable && editingFields[key]) {
        try {
          const schema = z.object({
            [key]:
              serviceDataSchema.shape[
                key as keyof typeof serviceDataSchema.shape
              ],
          });
          schema.parse({ [key]: editedData[key] });
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

    setSaving(true);
    try {
      const serviceRef = doc(db, "services", user.uid);
      await updateDoc(serviceRef, editedData);
      setServiceData(editedData);
      setEditingFields({});
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
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(serviceData) !== JSON.stringify(editedData);

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
  }, [serviceData, sortField, sortDirection]);

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

  const renderRequestsContent = () => {
    const filteredRequests = clientRequests.filter((request) => {
      if (!searchQuery) return true;

      const searchLower = searchQuery.toLowerCase();
      return (
        (request.title?.toLowerCase() || "").includes(searchLower) ||
        (request.description?.toLowerCase() || "").includes(searchLower) ||
        (request.county?.toLowerCase() || "").includes(searchLower) ||
        (request.cities || []).some((city) =>
          (city?.toLowerCase() || "").includes(searchLower),
        ) ||
        (request.status?.toLowerCase() || "").includes(searchLower) ||
        (request.clientName?.toLowerCase() || "").includes(searchLower) ||
        (request.preferredDate &&
          format(new Date(request.preferredDate), "dd.MM.yyyy").includes(
            searchQuery,
          )) ||
        (request.createdAt &&
          format(new Date(request.createdAt), "dd.MM.yyyy").includes(
            searchQuery,
          ))
      );
    });

    const sortedRequests = [...filteredRequests].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const modifier = sortDirection === "asc" ? 1 : -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return aValue.localeCompare(bValue) * modifier;
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * modifier;
      }
      return 0;
    });

    const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRequests = sortedRequests.slice(
      startIndex,
      startIndex + itemsPerPage,
    );

    return (
      <TabsContent value="requests">
        <Card className="border-[#00aff5]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-[#00aff5] flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Cererile Clienților
              </CardTitle>
              <Input
                placeholder="Caută cereri..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-[300px]"
                startIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <CardDescription>
              Vezi și gestionează toate cererile primite de la clienți
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center space-x-2">
              <Switch
                id="show-new"
                checked={showOnlyNew}
                onCheckedChange={setShowOnlyNew}
              />
              <label htmlFor="show-new" className="text-sm text-muted-foreground">
                Doar oferte noi
              </label>
            </div>
            <div className="max-h-[600px] overflow-y-auto pr-2">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Titlu</TableHead>
                    <TableHead>
                      <button
                        onClick={() => {
                          setSortField("createdAt");
                          setSortDirection((prev) =>
                            prev === "asc" ? "desc" : "asc",
                          );
                        }}
                        className="flex items-center hover:text-[#00aff5]"
                      >
                        Data primirii
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => {
                          setSortField("preferredDate");
                          setSortDirection((prev) =>
                            prev === "asc" ? "desc" : "asc",
                          );
                        }}
                        className="flex items-center hover:text-[#00aff5]"
                      >
                        Data preferată
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead>Județ</TableHead>
                    <TableHead>Localități</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:not(:last-child)]:mb-2">
                  {paginatedRequests.map((request) => (
                    <Fragment key={request.id}>
                      <TableRow className="hover:bg-blue-50/80 transition-colors relative mb-2">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {!viewedRequests.has(request.id) && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                NEW
                              </span>
                            )}
                            <span
                              className={
                                !viewedRequests.has(request.id)
                                  ? "font-bold"
                                  : ""
                              }
                            >
                              {request.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(request.createdAt),
                            "dd.MM.yyyy HH:mm",
                          )}
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(request.preferredDate),
                            "dd.MM.yyyy",
                          )}
                        </TableCell>
                        <TableCell>{request.county}</TableCell>
                        <TableCell>{request.cities.join(", ")}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-sm ${
                              request.status === "Active"
                                ? "bg-yellow-100 text-yellow-800"
                                : request.status === "Rezolvat"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {request.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              Detalii
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMessage(request)}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Mesaj
                            </Button>
                            {request.status === "Active" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSendOffer(request)}
                                  className="text-green-500 hover:text-green-700 hover:bg-green-50 flex items-center gap-1"
                                >
                                  <SendHorizontal className="h-4 w-4" />
                                  Trimite ofertă
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRejectRequest(request.id)
                                  }
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center gap-1"
                                >
                                  <X className="h-4 w-4" />
                                  Respinge
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {selectedRequest?.id === request.id && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={7} className="p-0">
                            <div className="bg-gray-50 p-4 border-t border-b">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <h3 className="text-xs font-medium text-muted-foreground">
                                    Client
                                  </h3>
                                  <p className="text-sm mt-1">
                                    {request.clientName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {requestClient?.email}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="text-xs font-medium text-muted-foreground">
                                    Mașină
                                  </h3>
                                  <p className="text-sm mt-1">
                                    {request.car ? (
                                      <>
                                        {request.car.brand} {request.car.model}{" "}
                                        ({request.car.year})
                                        {request.car.licensePlate && (
                                          <span className="text-xs text-muted-foreground ml-1">
                                            Nr. {request.car.licensePlate}
                                          </span>
                                        )}
                                        {request.car.vin && (
                                          <span className="block text-xs text-muted-foreground">
                                            VIN: {request.car.vin}
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      "Detalii indisponibile"
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="text-xs font-medium text-muted-foreground">
                                    Data preferată
                                  </h3>
                                  <p className="text-sm mt-1">
                                    {format(
                                      new Date(request.preferredDate),
                                      "dd.MM.yyyy",
                                    )}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <h3 className="text-xs font-medium text-muted-foreground">
                                    Descriere
                                  </h3>
                                  <p className="text-sm mt-1 whitespace-pre-wrap">
                                    {request.description}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="text-xs font-medium text-muted-foreground">
                                    Locație
                                  </h3>
                                  <p className="text-sm mt-1">
                                    {request.cities.join(", ")} -{" "}
                                    {request.county}
                                  </p>
                                </div>
                              </div>
                            </div                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                  {paginatedRequests.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        {searchQuery
                          ? "Nu s-au găsit cereri care să corespundă căutării"
                          : "Nu există cereri active în zona ta"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                  Pagina {currentPage} din {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Următor
                  </Button>
                </div>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setCurrentPage(1);
                    setItemsPerPage(parseInt(value));
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selectează numărul de rezultate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 pe pagină</SelectItem>
                    <SelectItem value="10">10 pe pagină</SelectItem>
                    <SelectItem value="20">20 pe pagină</SelectItem>
                    <SelectItem value="50">50 pe pagină</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    );
  };

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
            <Clock className="w-4 h-4 mr-2" />
            Cereri Clienți
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
            <MessageSquare className="w-4 h-4 mr-2" />
            Mesaje
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
            <SendHorizontal className="w-4 h-4 mr-2" />
            Oferte Trimise
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
            <Calendar className="w-4 h-4 mr-2" />
            Programări
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
            <Star className="w-4 h-4 mr-2" />
            Recenzii
          </Button>
          <Button
            variant={activeTab === "account" ? "default" : "ghost"}
            onClick={() => setActiveTab("account")}
            className={`flex items-center justify-start ${
              activeTab === "account"
                ? "bg-[#00aff5] text-white hover:bg-[#0099d6]"
                : "hover:text-[#00aff5]"
            }`}
          >
            <UserCog className="w-4 h-4 mr-2" />
            Cont
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
            <Store className="w-4 h-4 mr-2" />
            Profil Public
          </Button>
        </nav>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          {renderRequestsContent()}
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
          {renderMessages()}
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
                            value={editedData?.[key]}
                            onValueChange={(value) => handleChange(key, value)}
                            disabled={!editable || !editingFields[key]}
                          >
                            <SelectTrigger
                              className={`${
                                !editable || !editingFields[key]
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
                            value={editedData?.[key] || ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                            disabled={!editable || !editingFields[key]}
                            className={`${
                              !editable || !editingFields[key]
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

                {hasChanges && (
                  <Button
                    onClick={handleSave}
                    disabled={
                      saving || Object.keys(validationErrors).length > 0
                    }
                    className="mt-6 bg-[#00aff5] hover:bg-[#0099d6] float-right"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvează
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
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
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}