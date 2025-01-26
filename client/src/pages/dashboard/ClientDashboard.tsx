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

// Mock data for requests and offers remain unchanged...
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

type TabType = "requests" | "offers" | "messages" | "profile";

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

  const renderProfile = () => (
    <Card>
      <CardHeader>
        <CardTitle>Profilul Meu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Nume</label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    value={editedProfile.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Nume complet"
                  />
                ) : (
                  <p className="text-gray-900">{userProfile.name || "Nespecificat"}</p>
                )}
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEditClick}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{userProfile.email}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Telefon</label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    value={editedProfile.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Număr de telefon"
                  />
                ) : (
                  <p className="text-gray-900">{userProfile.phone || "Nespecificat"}</p>
                )}
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEditClick}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Județ</label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Select
                    value={editedProfile.county || ""}
                    onValueChange={(value) => handleInputChange("county", value)}
                  >
                    <SelectTrigger>
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
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Localitate</label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Select
                    value={editedProfile.city || ""}
                    onValueChange={(value) => handleInputChange("city", value)}
                    disabled={!selectedCounty}
                  >
                    <SelectTrigger>
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
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                setEditedProfile(userProfile);
              }}>
                Anulează
              </Button>
              <Button onClick={handleSave}>
                Salvează
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "requests":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Cererile Mele</CardTitle>
            </CardHeader>
            <CardContent>
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
                    <TableRow key={request.id}>
                      <TableCell>{request.id}</TableCell>
                      <TableCell>{request.date}</TableCell>
                      <TableCell>{request.service}</TableCell>
                      <TableCell>{request.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case "offers":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Oferte Primite</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {mockOffers.map((offer) => (
                  <Card key={offer.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{offer.serviceName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Pentru cererea: {offer.requestId}
                          </p>
                          <p className="text-sm">
                            Disponibilitate: {offer.availability}
                          </p>
                          <p className="font-medium mt-2">{offer.price} RON</p>
                        </div>
                        <Button>Acceptă Oferta</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "profile":
        return renderProfile();

      case "messages":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Mesaje</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Nu există mesaje noi.</p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4 space-y-4">
        {/* Navigation */}
        <nav className="flex gap-2 border-b pb-4">
          <Button
            variant={activeTab === "requests" ? "default" : "ghost"}
            onClick={() => setActiveTab("requests")}
          >
            <FileText className="w-4 h-4 mr-2" />
            Cererile Mele
          </Button>
          <Button
            variant={activeTab === "offers" ? "default" : "ghost"}
            onClick={() => setActiveTab("offers")}
          >
            <MailOpen className="w-4 h-4 mr-2" />
            Oferte Primite
          </Button>
          <Button
            variant={activeTab === "messages" ? "default" : "ghost"}
            onClick={() => setActiveTab("messages")}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Mesaje
          </Button>
          <Button
            variant={activeTab === "profile" ? "default" : "ghost"}
            onClick={() => setActiveTab("profile")}
          >
            <User className="w-4 h-4 mr-2" />
            Cont
          </Button>
        </nav>

        {/* Main Content */}
        {renderContent()}
      </div>
    </MainLayout>
  );
}