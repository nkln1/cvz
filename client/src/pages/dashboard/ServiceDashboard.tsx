import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
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
  ChevronDown,
  ChevronUp,
  XCircle
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Update Request interface to include client name
interface Request {
  id: string;
  title: string;
  description: string;
  carId: string;
  preferredDate: string;
  county: string;
  cities: string[];
  status: "Active" | "Rezolvat" | "Anulat";
  createdAt: string;
  userId: string;
  clientName?: string; // Add client name
}

// Previous interfaces remain unchanged

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
      // First get all active requests for the county
      const requestsQuery = query(
        collection(db, "requests"),
        where("status", "==", "Active"),
        where("county", "==", serviceData.county)
      );

      const querySnapshot = await getDocs(requestsQuery);
      const allRequests: Request[] = [];

      for (const doc of querySnapshot.docs) {
        const requestData = doc.data();

        // Check if the service's city is included in the request's cities array
        if (requestData.cities && requestData.cities.includes(serviceData.city)) {
          // Fetch client name
          const userDoc = await getDoc(doc(db, "users", requestData.userId));
          const userData = userDoc.data();
          const clientName = userData ? userData.name : "Client necunoscut";

          allRequests.push({ 
            id: doc.id, 
            ...requestData,
            clientName 
          } as Request);
        }
      }

      console.log("Fetched requests:", allRequests); // Debug log
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

  // Add useEffect for fetching client requests
  useEffect(() => {
    if (serviceData) {
      fetchClientRequests();
    }
  }, [serviceData]);

  const handleMessageClick = (request: Request) => {
    // TODO: Implement messaging functionality
    toast({
      title: "Info",
      description: "Funcționalitatea de mesagerie va fi implementată în curând.",
    });
  };

  const handleSendOffer = (request: Request) => {
    // TODO: Implement send offer functionality
    toast({
      title: "Info",
      description: "Funcționalitatea de trimitere ofertă va fi implementată în curând.",
    });
  };

  const handleRejectRequest = (request: Request) => {
    // TODO: Implement reject functionality
    toast({
      title: "Info",
      description: "Funcționalitatea de respingere va fi implementată în curând.",
    });
  };

  // Modify the TabsContent for requests
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
          <div className="space-y-4">
            {clientRequests.map((request) => (
              <Collapsible key={request.id} className="border rounded-lg">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-5 gap-4 flex-1">
                      <div className="font-medium">{request.title}</div>
                      <div>{format(new Date(request.preferredDate), "dd.MM.yyyy")}</div>
                      <div>{request.county}</div>
                      <div>{request.cities.join(", ")}</div>
                      <div>
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
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleMessageClick(request)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Mesaj
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-500 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleSendOffer(request)}
                      >
                        <SendHorizontal className="h-4 w-4 mr-1" />
                        Trimite oferta
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRejectRequest(request)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Respinge oferta
                      </Button>
                      <CollapsibleTrigger className="p-2 hover:bg-gray-100 rounded-lg">
                        {open => (
                          open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="p-4 bg-gray-50 space-y-4 border-t">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">
                        Client
                      </h3>
                      <p>{request.clientName}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">
                        Descriere
                      </h3>
                      <p>{request.description}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">
                        Data preferată
                      </h3>
                      <p>{format(new Date(request.preferredDate), "dd.MM.yyyy")}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">
                        Locație
                      </h3>
                      <p>{request.cities.join(", ")}, {request.county}</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
            {clientRequests.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                Nu există cereri active în zona ta
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
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