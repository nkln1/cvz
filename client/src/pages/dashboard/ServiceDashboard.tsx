import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { useToast } from "@/components/ui/use-toast";

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
}

export default function ServiceDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [editedData, setEditedData] = useState<ServiceData | null>(null);
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("requests");

  const fields: EditableField[] = [
    { label: "Nume Companie", key: "companyName", editable: true },
    { label: "Nume Reprezentant", key: "representativeName", editable: true },
    { label: "Email", key: "email", editable: false },
    { label: "Telefon", key: "phone", editable: true },
    { label: "CUI", key: "cui", editable: false },
    { label: "Nr. Înregistrare", key: "tradeRegNumber", editable: false },
    { label: "Adresă", key: "address", editable: true },
    { label: "Județ", key: "county", editable: true },
    { label: "Oraș", key: "city", editable: true },
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

  const handleEdit = (field: keyof ServiceData) => {
    setEditingFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleChange = (field: keyof ServiceData, value: string) => {
    if (editedData) {
      setEditedData({ ...editedData, [field]: value });
    }
  };

  const handleSave = async () => {
    if (!user || !editedData) return;

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
                <p className="text-muted-foreground">
                  Lista cererilor va apărea aici
                </p>
              </CardContent>
            </Card>
          </TabsContent>

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
                  {fields.map(({ label, key, editable }) => (
                    <div key={key} className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700">{label}</label>
                        {editable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(key)}
                            className="h-6 w-6 p-0 absolute right-2 top-7"
                          >
                            <Pen className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                          </Button>
                        )}
                      </div>
                      <Input
                        value={editedData?.[key] || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        disabled={!editable || !editingFields[key]}
                        className={`${
                          !editable ? "bg-gray-50" : ""
                        } pr-8`}
                      />
                    </div>
                  ))}
                </div>

                {hasChanges && (
                  <Button
                    onClick={handleSave}
                    disabled={saving}
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