import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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

// Validation schema
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
  const [activeTab, setActiveTab] = useState("account");
  const [availableCities, setAvailableCities] = useState<string[]>([]);

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
      [field]: !prev[field],
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
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 bg-gray-50">
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6">
            {/* Navigation Tabs */}
            <Card className="border-none shadow-lg">
              <CardContent className="p-0">
                <nav className="flex flex-col sm:flex-row gap-2 p-2">
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
              </CardContent>
            </Card>

            {/* Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsContent value="requests">
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-[#00aff5] flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Cererile Clienților
                    </CardTitle>
                    <CardDescription>
                      Vezi și gestionează toate cererile primite de la clienți
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">
                      Lista cererilor va apărea aici
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="offers">
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-[#00aff5] flex items-center gap-2">
                      <SendHorizontal className="h-5 w-5" />
                      Oferte Trimise
                    </CardTitle>
                    <CardDescription>
                      Urmărește și gestionează ofertele trimise către clienți
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">
                      Lista ofertelor va apărea aici
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="messages">
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-[#00aff5] flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Mesaje
                    </CardTitle>
                    <CardDescription>
                      Comunicare directă cu clienții și gestionarea conversațiilor
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">
                      Nu există mesaje noi.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="appointments">
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-[#00aff5] flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Programări
                    </CardTitle>
                    <CardDescription>
                      Gestionează programările și disponibilitatea serviciului
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">
                      Calendar și programări vor apărea aici
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="reviews">
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-[#00aff5] flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Recenzii
                    </CardTitle>
                    <CardDescription>
                      Vezi și răspunde la recenziile primite de la clienți
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">
                      Lista recenziilor va apărea aici
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="account">
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-[#00aff5] flex items-center gap-2">
                      <UserCog className="h-5 w-5" />
                      Cont
                    </CardTitle>
                    <CardDescription>
                      Gestionează informațiile contului și setările
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {fields.map(({ label, key, editable, type, options }) => (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                              {label}
                            </label>
                            {editable && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(key)}
                                className="h-6 w-6 p-0"
                              >
                                <Pen className="h-3.5 w-3.5 text-[#00aff5] hover:text-[#0099d6]" />
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
                                  } ${validationErrors[key] ? "border-red-500" : "border-gray-200 focus:border-[#00aff5] focus:ring-[#00aff5]"}`}
                                >
                                  <SelectValue placeholder={`Selectează ${label.toLowerCase()}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {options.map((option) => (
                                    <SelectItem
                                      key={option}
                                      value={option}
                                      className="hover:bg-[#00aff5]/10"
                                    >
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
                                } ${validationErrors[key] ? "border-red-500" : "border-gray-200 focus:border-[#00aff5] focus:ring-[#00aff5]"}`}
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
                      <div className="flex justify-end mt-6">
                        <Button
                          onClick={handleSave}
                          disabled={saving || Object.keys(validationErrors).length > 0}
                          className="bg-[#00aff5] hover:bg-[#0099d6] text-white transition-colors"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Se salvează...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Salvează
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="public-profile">
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-[#00aff5] flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Profil Public
                    </CardTitle>
                    <CardDescription>
                      Gestionează informațiile afișate public despre serviciul tău
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">
                      Informațiile profilului public vor apărea aici
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}