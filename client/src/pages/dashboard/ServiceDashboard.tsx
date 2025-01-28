import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageSquare, Calendar, Star, UserCog, Store, Clock, SendHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
}

export default function ServiceDashboard() {
  const { user } = useAuth();
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("requests");

  useEffect(() => {
    async function fetchServiceData() {
      if (!user) return;

      try {
        const serviceDoc = await getDoc(doc(db, "services", user.uid));
        if (serviceDoc.exists()) {
          setServiceData(serviceDoc.data() as ServiceData);
        }
      } catch (error) {
        console.error("Error fetching service data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchServiceData();
  }, [user]);

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Dashboard {serviceData.companyName}
            </CardTitle>
            <CardDescription>
              Gestionează cererile, programările și interacțiunile cu clienții
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 lg:grid-cols-7 gap-2">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Cereri Clienți</span>
            </TabsTrigger>
            <TabsTrigger value="offers" className="flex items-center gap-2">
              <SendHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Oferte Trimise</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Mesaje</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Programări</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Recenzii</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Cont</span>
            </TabsTrigger>
            <TabsTrigger value="public-profile" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Profil Public</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Cererile Clienților</CardTitle>
                <CardDescription>
                  Vezi și gestionează toate cererile primite de la clienți
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Lista cererilor va apărea aici</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offers">
            <Card>
              <CardHeader>
                <CardTitle>Oferte Trimise</CardTitle>
                <CardDescription>
                  Toate ofertele trimise către clienți și statusul lor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Lista ofertelor va apărea aici</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Mesaje</CardTitle>
                <CardDescription>
                  Conversațiile cu clienții tăi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Sistemul de mesaje va apărea aici</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Programări</CardTitle>
                <CardDescription>
                  Programările acceptate și detaliile acestora
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Lista programărilor va apărea aici</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Recenzii și Feedback</CardTitle>
                <CardDescription>
                  Evaluările primite de la clienți
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Lista recenziilor va apărea aici</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Informații Cont</CardTitle>
                <CardDescription>
                  Datele service-ului tău și opțiuni de modificare
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-700">
                        Informații Service
                      </h2>
                      <div className="mt-2 space-y-2">
                        <p>
                          <span className="font-medium">Nume Service:</span>{" "}
                          {serviceData.companyName}
                        </p>
                        <p>
                          <span className="font-medium">Reprezentant:</span>{" "}
                          {serviceData.representativeName}
                        </p>
                        <p>
                          <span className="font-medium">Email:</span> {serviceData.email}
                        </p>
                        <p>
                          <span className="font-medium">Telefon:</span>{" "}
                          {serviceData.phone}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-gray-700">
                        Date Juridice
                      </h2>
                      <div className="mt-2 space-y-2">
                        <p>
                          <span className="font-medium">CUI:</span> {serviceData.cui}
                        </p>
                        <p>
                          <span className="font-medium">Nr. Înregistrare:</span>{" "}
                          {serviceData.tradeRegNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-700">
                        Adresă și Locație
                      </h2>
                      <div className="mt-2 space-y-2">
                        <p>
                          <span className="font-medium">Adresă:</span>{" "}
                          {serviceData.address}
                        </p>
                        <p>
                          <span className="font-medium">Județ:</span>{" "}
                          {serviceData.county}
                        </p>
                        <p>
                          <span className="font-medium">Localitate:</span>{" "}
                          {serviceData.city}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="public-profile">
            <Card>
              <CardHeader>
                <CardTitle>Profil Public</CardTitle>
                <CardDescription>
                  Cum văd clienții service-ul tău
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Previzualizarea profilului public va apărea aici</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}