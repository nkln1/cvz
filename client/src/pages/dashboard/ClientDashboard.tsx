import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  MailOpen,
  FileText,
  MessageSquare,
  Pencil,
  Phone,
  MapPin,
  AlertTriangle,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MainLayout from "@/components/layout/MainLayout";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { romanianCounties, getCitiesForCounty } from "@/lib/romaniaData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import CarManagement from "./CarManagement";

// Mock data for requests and offers
const mockRequests = [
  {
    id: "REQ-001",
    date: "2024-01-26",
    status: "În așteptare",
    service: "Schimb ulei",
  },
  {
    id: "REQ-002",
    date: "2024-01-25",
    status: "Acceptat",
    service: "Schimb plăcuțe frână",
  },
];

const mockOffers = [
  {
    id: "OFF-001",
    serviceId: "SRV-001",
    serviceName: "Auto Service Pro",
    price: 250,
    availability: "2024-01-28",
    requestId: "REQ-001",
  },
  {
    id: "OFF-002",
    serviceId: "SRV-002",
    serviceName: "MasterMech Auto",
    price: 280,
    availability: "2024-01-27",
    requestId: "REQ-001",
  },
];

type TabType = "requests" | "offers" | "messages" | "profile" | "car";

interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  county?: string;
  city?: string;
}

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("requests");
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>({});
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
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
        setEditedProfile(userData);
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

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      await updateDoc(doc(db, "clients", user.uid), editedProfile);
      setUserProfile(editedProfile);
      setIsEditing(false);
      toast({
        title: "Succes",
        description: "Profilul a fost actualizat cu succes!",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-a putut actualiza profilul.",
      });
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "county") {
      setSelectedCounty(value);
      setEditedProfile((prev) => ({
        ...prev,
        county: value,
        city: "", // Reset city when county changes
      }));
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;

    setIsResendingVerification(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: "Email trimis",
        description: "Un nou email de verificare a fost trimis. Te rugăm să îți verifici căsuța de email.",
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut trimite emailul de verificare. Te rugăm să încerci din nou mai târziu.",
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const renderProfile = () => (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <User className="h-5 w-5" />
          Profilul Meu
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#00aff5]">Nume</label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    value={editedProfile.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Nume complet"
                    className="border-gray-300 focus:border-[#00aff5] focus:ring-[#00aff5]"
                  />
                ) : (
                  <p className="text-gray-900">{userProfile.name || "Nespecificat"}</p>
                )}
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEditClick}
                    className="h-8 w-8 hover:text-[#00aff5]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#00aff5]">Email</label>
              <p className="text-gray-900">{userProfile.email}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#00aff5]">Telefon</label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    value={editedProfile.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Număr de telefon"
                    className="border-gray-300 focus:border-[#00aff5] focus:ring-[#00aff5]"
                  />
                ) : (
                  <p className="text-gray-900">{userProfile.phone || "Nespecificat"}</p>
                )}
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEditClick}
                    className="h-8 w-8 hover:text-[#00aff5]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#00aff5]">Județ</label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Select
                    value={editedProfile.county || ""}
                    onValueChange={(value) => handleInputChange("county", value)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-[#00aff5] focus:ring-[#00aff5]">
                      <SelectValue placeholder="Selectează județul" />
                    </SelectTrigger>
                    <SelectContent>
                      {romanianCounties.map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-gray-900">{userProfile.county || "Nespecificat"}</p>
                )}
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEditClick}
                    className="h-8 w-8 hover:text-[#00aff5]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#00aff5]">Localitate</label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Select
                    value={editedProfile.city || ""}
                    onValueChange={(value) => handleInputChange("city", value)}
                    disabled={!selectedCounty}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-[#00aff5] focus:ring-[#00aff5]">
                      <SelectValue placeholder="Selectează localitatea" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCounty &&
                        getCitiesForCounty(selectedCounty).map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-gray-900">{userProfile.city || "Nespecificat"}</p>
                )}
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEditClick}
                    className="h-8 w-8 hover:text-[#00aff5]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedProfile(userProfile);
                }}
                className="hover:bg-gray-100"
              >
                Anulează
              </Button>
              <Button onClick={handleSave} className="bg-[#00aff5] hover:bg-[#0099d6]">
                Salvează
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderRequests = () => (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Cererile Mele
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Serviciu</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockRequests.map((request) => (
              <TableRow key={request.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{request.id}</TableCell>
                <TableCell>{request.date}</TableCell>
                <TableCell>{request.service}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      request.status === "În așteptare"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {request.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
        <div className="grid gap-4">
          {mockOffers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[#00aff5]">{offer.serviceName}</h3>
                    <p className="text-sm text-gray-600">
                      Pentru cererea: {offer.requestId}
                    </p>
                    <p className="text-sm text-gray-600">
                      Disponibilitate: {offer.availability}
                    </p>
                    <p className="font-medium text-lg">{offer.price} RON</p>
                  </div>
                  <Button className="bg-[#00aff5] hover:bg-[#0099d6]">
                    Acceptă Oferta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderMessages = () => (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Mesaje
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-gray-600">Nu există mesaje noi.</p>
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

  if (!user?.emailVerified) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Email neverificat</AlertTitle>
            <AlertDescription>
              Te rugăm să îți confirmi adresa de email pentru a avea acces la toate funcționalitățile.
              Verifică-ți căsuța de email pentru linkul de confirmare.
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleResendVerification}
            disabled={isResendingVerification}
            className="w-full max-w-md mx-auto block"
          >
            {isResendingVerification ? "Se trimite..." : "Retrimite email de verificare"}
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <nav className="flex gap-2 border-b pb-4">
          <Button
            variant={activeTab === "requests" ? "default" : "ghost"}
            onClick={() => setActiveTab("requests")}
            className={`${
              activeTab === "requests"
                ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                : "hover:text-[#00aff5]"
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Cererile Mele
          </Button>
          <Button
            variant={activeTab === "offers" ? "default" : "ghost"}
            onClick={() => setActiveTab("offers")}
            className={`${
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
            className={`${
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
            className={`${
              activeTab === "car"
                ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                : "hover:text-[#00aff5]"
            }`}
          >
            <Car className="w-4 h-4 mr-2" />
            Mașina
          </Button>
          <Button
            variant={activeTab === "profile" ? "default" : "ghost"}
            onClick={() => setActiveTab("profile")}
            className={`${
              activeTab === "profile"
                ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                : "hover:text-[#00aff5]"
            }`}
          >
            <User className="w-4 h-4 mr-2" />
            Cont
          </Button>
        </nav>

        {renderContent()}
      </div>
    </MainLayout>
  );
}