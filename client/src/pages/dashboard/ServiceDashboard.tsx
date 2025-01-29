import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, doc as docRef, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState, Fragment } from "react";
import { z } from "zod";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Star,
  UserCog,
  Store,
  Clock,
  SendHorizontal,
  Pen,
  Save,
  Eye,
  X,
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
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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


const serviceDataSchema = z.object({
  companyName: z.string().min(3, "Numele companiei trebuie să aibă cel puțin 3 caractere"),
  representativeName: z.string().min(3, "Numele reprezentantului trebuie să aibă cel puțin 3 caractere"),
  email: z.string().email("Adresa de email nu este validă"),
  phone: z.string().regex(/^(\+4|)?(07[0-8]{1}[0-9]{1}|02[0-9]{2}|03[0-9]{2}){1}?(\s|\.|\-)?([0-9]{3}(\s|\.|\-|)){2}$/, "Numărul de telefon nu este valid"),
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
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("requests");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [clientRequests, setClientRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [requestClient, setRequestClient] = useState<User | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedMessageRequest, setSelectedMessageRequest] = useState<Request | null>(null);

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
    async function fetchServiceData() {
      if (!user) return;

      try {
        const serviceDoc = await getDoc(doc(db, "services", user.uid));
        if (serviceDoc.exists()) {
          const data = serviceDoc.data() as ServiceData;
          setServiceData(data);
          setEditedData(data);
          // Set available cities based on the current county
          if (data.county) {
            setAvailableCities(romanianCitiesData[data.county as keyof typeof romanianCitiesData] || []);
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
      const schema = z.object({ [field]: serviceDataSchema.shape[field as keyof typeof serviceDataSchema.shape] });
      schema.parse({ [field]: value });
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors[0]?.message;
        setValidationErrors(prev => ({
          ...prev,
          [field]: fieldError,
        }));
        return false;
      }
      return false;
    }
  };

  const handleEdit = (field: keyof ServiceData) => {
    setEditingFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleChange = (field: keyof ServiceData, value: string) => {
    if (editedData) {
      const newData = { ...editedData, [field]: value };

      // Handle county change to update city options
      if (field === 'county') {
        setAvailableCities(romanianCitiesData[value as keyof typeof romanianCitiesData] || []);
        newData.city = ''; // Reset city when county changes
      }

      setEditedData(newData);
      validateField(field, value);
    }
  };

  const handleSave = async () => {
    if (!user || !editedData) return;

    // Validate all editable fields before saving
    let isValid = true;
    const newErrors: ValidationErrors = {};

    fields.forEach(({ key, editable }) => {
      if (editable && editingFields[key]) {
        try {
          const schema = z.object({ [key]: serviceDataSchema.shape[key as keyof typeof serviceDataSchema.shape] });
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
        description: "Nu am putut actualiza datele. Vă rugăm încercați din nou.",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(serviceData) !== JSON.stringify(editedData);

  const fetchClientRequests = async () => {
    if (!user || !serviceData) return;

    try {
      const requestsQuery = query(
        collection(db, "requests"),
        where("status", "==", "Active"),
        where("county", "==", serviceData.county),
        where("cities", "array-contains", serviceData.city)
      );

      const querySnapshot = await getDocs(requestsQuery);
      const allRequests: Request[] = [];

      for (const doc of querySnapshot.docs) {
        const requestData = doc.data();
        // Fetch car details
        const carDoc = await getDoc(docRef(db, "cars", requestData.carId));
        const carData = carDoc.exists() ? carDoc.data() as Car : undefined;

        allRequests.push({
          id: doc.id,
          ...requestData,
          car: carData
        } as Request);
      }

      setClientRequests(allRequests);
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
          name: userData.name || '',
          email: userData.email || '',
        } as User;
      }
      return null;
    } catch (error) {
      console.error("Error fetching client details:", error);
      return null;
    }
  };

  const handleViewDetails = async (request: Request) => {
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
  }, [serviceData]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        status: "Rezolvat"
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
    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        status: "Anulat"
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
    setSelectedMessageRequest(request);
    setMessageDialogOpen(true);
  };

  const handleSendOffer = async (request: Request) => {
    // To be implemented when offer functionality is ready
    toast({
      description: "Funcționalitatea de trimitere oferte va fi disponibilă în curând.",
    });
  };

  const sendMessage = async (request: Request) => {
    if (!user || !messageContent.trim()) return;

    setSendingMessage(true);
    try {
      const messageRef = collection(db, "messages");
      const newMessage = {
        requestId: request.id,
        fromId: user.uid,
        toId: request.userId,
        content: messageContent.trim(),
        createdAt: new Date().toISOString(),
        read: false,
      };

      await addDoc(messageRef, newMessage);

      toast({
        title: "Succes",
        description: "Mesajul a fost trimis cu succes.",
      });

      setMessageContent("");
      setMessageDialogOpen(false);
      setSelectedMessageRequest(null);
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


  const renderRequestsContent = () => (
    <TabsContent value="requests">
      <Card className="border-[#00aff5]/20">
        <CardHeader>
          <CardTitle className="text-[#00aff5] flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cererile Clienților
          </CardTitle>
          <CardDescription>
            Vezi și gestionează toate cererile primite de la clienți
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titlu</TableHead>
                <TableHead>Data preferată</TableHead>
                <TableHead>Județ</TableHead>
                <TableHead>Localități</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientRequests.map((request) => (
                <Fragment key={request.id}>
                  <TableRow className="hover:bg-gray-50">
                    <TableCell className="font-medium">{request.title}</TableCell>
                    <TableCell>
                      {format(new Date(request.preferredDate), "dd.MM.yyyy")}
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
                              onClick={() => handleRejectRequest(request.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center gap-1"
                            >
                              <X className="h-4 w-4" />
                              Respinge
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(request)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Detalii
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {selectedRequest?.id === request.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <div className="bg-gray-50 p-4 border-t border-b">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <h3 className="text-xs font-medium text-muted-foreground">
                                Client
                              </h3>
                              <p className="text-sm mt-1">
                                {requestClient?.name || "Nume indisponibil"}
                              </p>
                              <p className="text-xs text-muted-foreground">{requestClient?.email}</p>
                            </div>
                            <div>
                              <h3 className="text-xs font-medium text-muted-foreground">
                                Mașină
                              </h3>
                              <p className="text-sm mt-1">
                                {request.car ? (
                                  <>
                                    {request.car.brand} {request.car.model} ({request.car.year})
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
                                {format(new Date(request.preferredDate), "dd.MM.yyyy")}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <h3 className="text-xs font-medium text-muted-foreground">
                                Descriere
                              </h3>
                              <p className="text-sm mt-1 whitespace-pre-wrap">{request.description}</p>
                            </div>
                            <div>
                              <h3 className="text-xs font-medium text-muted-foreground">
                                Locație
                              </h3>
                              <p className="text-sm mt-1">
                                {request.cities.join(", ")} - {request.county}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
              {clientRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nu există cereri active în zona ta
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );

  const MessageDialog = () => (
    <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trimite mesaj</DialogTitle>
          <DialogDescription>
            {selectedMessageRequest && (
              <span className="text-sm text-muted-foreground">
                Pentru cererea: {selectedMessageRequest.title}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder="Scrie mesajul tău aici..."
            className="min-h-[100px]"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setMessageDialogOpen(false);
                setMessageContent("");
                setSelectedMessageRequest(null);
              }}
            >
              Anulează
            </Button>
            <Button
              onClick={() => selectedMessageRequest && sendMessage(selectedMessageRequest)}
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
      </DialogContent>
    </Dialog>
  );

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                <p className="text-muted-foreground">
                  Nu există mesaje noi.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
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
                        <label className="text-sm font-medium text-gray-700">{label}</label>
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
                        {type === 'select' && options ? (
                          <Select
                            value={editedData?.[key]}
                            onValueChange={(value) => handleChange(key, value)}
                            disabled={!editable || !editingFields[key]}
                          >
                            <SelectTrigger
                              className={`${
                                !editable || !editingFields[key] ? "bg-gray-50" : "bg-white"
                              } ${validationErrors[key] ? "border-red-500" : ""}`}
                            >
                              <SelectValue placeholder={`Selectează ${label.toLowerCase()}`} />
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
                              !editable || !editingFields[key] ? "bg-gray-50" : "bg-white"
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
                    disabled={saving || Object.keys(validationErrors).length > 0}
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