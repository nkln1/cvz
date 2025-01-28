import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageSquare, Calendar, Star, UserCog, Store, Clock, SendHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="mb-6 border-[#00aff5]/20">
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
            <TabsList className="grid grid-cols-2 lg:grid-cols-7 gap-2 bg-white">
              <TabsTrigger 
                value="requests" 
                className="flex items-center gap-2 data-[state=active]:text-[#00aff5] data-[state=active]:border-[#00aff5] transition-colors duration-200 hover:text-[#00aff5]"
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Cereri Clienți</span>
              </TabsTrigger>
              <TabsTrigger 
                value="offers" 
                className="flex items-center gap-2 data-[state=active]:text-[#00aff5] data-[state=active]:border-[#00aff5] transition-colors duration-200 hover:text-[#00aff5]"
              >
                <SendHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Oferte Trimise</span>
              </TabsTrigger>
              <TabsTrigger 
                value="messages" 
                className="flex items-center gap-2 data-[state=active]:text-[#00aff5] data-[state=active]:border-[#00aff5] transition-colors duration-200 hover:text-[#00aff5]"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Mesaje</span>
              </TabsTrigger>
              <TabsTrigger 
                value="appointments" 
                className="flex items-center gap-2 data-[state=active]:text-[#00aff5] data-[state=active]:border-[#00aff5] transition-colors duration-200 hover:text-[#00aff5]"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Programări</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="flex items-center gap-2 data-[state=active]:text-[#00aff5] data-[state=active]:border-[#00aff5] transition-colors duration-200 hover:text-[#00aff5]"
              >
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Recenzii</span>
              </TabsTrigger>
              <TabsTrigger 
                value="account" 
                className="flex items-center gap-2 data-[state=active]:text-[#00aff5] data-[state=active]:border-[#00aff5] transition-colors duration-200 hover:text-[#00aff5]"
              >
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Cont</span>
              </TabsTrigger>
              <TabsTrigger 
                value="public-profile" 
                className="flex items-center gap-2 data-[state=active]:text-[#00aff5] data-[state=active]:border-[#00aff5] transition-colors duration-200 hover:text-[#00aff5]"
              >
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Profil Public</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests">
              <Card className="border-[#00aff5]/20">
                <CardHeader>
                  <CardTitle>Cererile Clienților</CardTitle>
                  <CardDescription>
                    Vezi și gestionează toate cererile primite de la clienți
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Lista cererilor va apărea aici</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="offers">
              <Card className="border-[#00aff5]/20">
                <CardHeader>
                  <CardTitle>Oferte Trimise</CardTitle>
                  <CardDescription>
                    Toate ofertele trimise către clienți și statusul lor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Lista ofertelor va apărea aici</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card className="border-[#00aff5]/20">
                <CardHeader>
                  <CardTitle>Mesaje</CardTitle>
                  <CardDescription>
                    Conversațiile cu clienții tăi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Sistemul de mesaje va apărea aici</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appointments">
              <Card className="border-[#00aff5]/20">
                <CardHeader>
                  <CardTitle>Programări</CardTitle>
                  <CardDescription>
                    Programările acceptate și detaliile acestora
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Lista programărilor va apărea aici</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <Card className="border-[#00aff5]/20">
                <CardHeader>
                  <CardTitle>Recenzii și Feedback</CardTitle>
                  <CardDescription>
                    Evaluările primite de la clienți
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Lista recenziilor va apărea aici</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <Card className="border-[#00aff5]/20">
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
              <Card className="border-[#00aff5]/20">
                <CardHeader>
                  <CardTitle>Profil Public</CardTitle>
                  <CardDescription>
                    Cum văd clienții service-ul tău
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Previzualizarea profilului public va apărea aici</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
}