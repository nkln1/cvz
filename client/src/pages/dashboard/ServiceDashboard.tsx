import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
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
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
                <CardTitle>Cererile Clienților</CardTitle>
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
            {/* Similar structure for other tabs */}
          </TabsContent>
          {/* Add remaining tab contents here */}
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
