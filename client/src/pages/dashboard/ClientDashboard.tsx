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
  Car as CarIcon,
  Plus,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainLayout from "@/components/layout/MainLayout";
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { romanianCounties, getCitiesForCounty } from "@/lib/romaniaData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import CarManagement from "./CarManagement";
import { RequestForm } from "@/components/dashboard/RequestForm";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type Car } from "./CarManagement";
import { RequestsTable } from "@/components/dashboard/RequestsTable";


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
}

type TabType = "requests" | "offers" | "messages" | "profile" | "car";

interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  county?: string;
  city?: string;
}

interface RequestFormData {
  title: string;
  description: string;
  carId: string;
  preferredDate: string;
  county: string;
  cities: string[];
}

const renderRequestsTable = (
  filteredRequests: Request[],
  cars: Car[],
  onDelete: (id: string) => Promise<void>,
  refreshRequests: () => Promise<void>
) => {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const { toast } = useToast();

  const handleDelete = async (requestId: string) => {
    try {
      await onDelete(requestId);
      toast({
        title: "Success",
        description: "Cererea a fost ștearsă cu succes.",
      });
      await refreshRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-a putut șterge cererea. Încercați din nou.",
      });
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titlu</TableHead>
            <TableHead>Mașină</TableHead>
            <TableHead>Data preferată</TableHead>
            <TableHead>Locație</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRequests.map((request) => (
            <TableRow key={request.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">{request.title}</TableCell>
              <TableCell>
                {cars.find((car) => car.id === request.carId)?.brand}{" "}
                {cars.find((car) => car.id === request.carId)?.model}
              </TableCell>
              <TableCell>
                {format(new Date(request.preferredDate), "dd.MM.yyyy")}
              </TableCell>
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
                    size="icon"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowViewDialog(true);
                    }}
                    className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {request.status !== "Anulat" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDeleteDialog(true);
                      }}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filteredRequests.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                Nu există cereri în această categorie.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anulați această cerere?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune nu poate fi anulată. Cererea va fi marcată ca
              Anulat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && handleDelete(selectedRequest.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Anulează
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalii Cerere</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Titlu
                </h3>
                <p>{selectedRequest.title}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Descriere
                </h3>
                <p>{selectedRequest.description}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Mașină
                </h3>
                <p>
                  {cars.find((car) => car.id === selectedRequest.carId)?.brand}{" "}
                  {cars.find((car) => car.id === selectedRequest.carId)?.model}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Data preferată
                </h3>
                <p>
                  {format(
                    new Date(selectedRequest.preferredDate),
                    "dd.MM.yyyy"
                  )}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Locație
                </h3>
                <p>{selectedRequest.cities.join(", ")}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Status
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    selectedRequest.status === "Active"
                      ? "bg-yellow-100 text-yellow-800"
                      : selectedRequest.status === "Rezolvat"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedRequest.status}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("requests");
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>({});
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isCarDialogOpen, setIsCarDialogOpen] = useState(false);
  const [requestFormData, setRequestFormData] = useState<Partial<RequestFormData>>({});
  const [requests, setRequests] = useState<Request[]>([]);
  const [cars, setCars] = useState<Car[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchRequests();
      fetchCars();
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

  const fetchRequests = async () => {
    if (!user?.uid) return;

    try {
      const requestsQuery = query(
        collection(db, "requests"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(requestsQuery);
      const loadedRequests: Request[] = [];
      querySnapshot.forEach((doc) => {
        loadedRequests.push({ id: doc.id, ...doc.data() } as Request);
      });
      setRequests(loadedRequests);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-au putut încărca cererile.",
      });
    }
  };

  const fetchCars = async () => {
    if (!user?.uid) return;

    try {
      const carsQuery = query(
        collection(db, "cars"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(carsQuery);
      const loadedCars: Car[] = [];
      querySnapshot.forEach((doc) => {
        loadedCars.push({ id: doc.id, ...doc.data() } as Car);
      });
      setCars(loadedCars);
    } catch (error) {
      console.error("Error loading cars:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-au putut încărca mașinile.",
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
        city: "",
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
        description:
          "Un nou email de verificare a fost trimis. Te rugăm să îți verifici căsuța de email.",
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description:
          "Nu s-a putut trimite emailul de verificare. Te rugăm să încerci din nou mai târziu.",
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!user?.uid) return;

    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        status: "Anulat",
        updatedAt: new Date().toISOString(),
      });

      await fetchRequests();

      toast({
        title: "Success",
        description: "Cererea a fost anulată cu succes.",
      });
    } catch (error) {
      console.error("Error updating request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-a putut anula cererea. Te rugăm să încerci din nou.",
      });
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
                    onChange={(e) =>
                      handleInputChange("name", e.target.value)
                    }
                    placeholder="Nume complet"
                    className="border-gray-300 focus:border-[#00aff5] focus:ring-[#00aff5]"
                  />
                ) : (
                  <p className="text-gray-900">
                    {userProfile.name || "Nespecificat"}
                  </p>
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
                    onChange={(e) =>
                      handleInputChange("phone", e.target.value)
                    }
                    placeholder="Număr de telefon"
                    className="border-gray-300 focus:border-[#00aff5] focus:ring-[#00aff5]"
                  />
                ) : (
                  <p className="text-gray-900">
                    {userProfile.phone || "Nespecificat"}
                  </p>
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
                    onValueChange={(value) =>
                      handleInputChange("county", value)
                    }
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
                  <p className="text-gray-900">
                    {userProfile.county || "Nespecificat"}
                  </p>
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
                    onValueChange={(value) =>
                      handleInputChange("city", value)
                    }
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
                  <p className="text-gray-900">
                    {userProfile.city || "Nespecificat"}
                  </p>
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
          Cererile mele
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="solved">Rezolvate</TabsTrigger>
            <TabsTrigger value="canceled">Anulate</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <RequestsTable
              requests={requests.filter((req) => req.status === "Active")}
              cars={cars}
              onDelete={handleDeleteRequest}
              refreshRequests={fetchRequests}
            />
          </TabsContent>
          <TabsContent value="solved">
            <RequestsTable
              requests={requests.filter((req) => req.status === "Rezolvat")}
              cars={cars}
              onDelete={handleDeleteRequest}
              refreshRequests={fetchRequests}
            />
          </TabsContent>
          <TabsContent value="canceled">
            <RequestsTable
              requests={requests.filter((req) => req.status === "Anulat")}
              cars={cars}
              onDelete={handleDeleteRequest}
              refreshRequests={fetchRequests}
            />
          </TabsContent>
        </Tabs>
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
          <p>No offers yet</p>
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

  const handleRequestSubmit = async (data: RequestFormData) => {
    if (!user) return;

    try {
      const requestData = {
        ...data,
        userId: user.uid,
        status: "Active",
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "requests"), requestData);

      toast({
        title: "Success",
        description: "Cererea ta a fost adăugată cu succes!",
      });

      fetchRequests();

      setRequestFormData({});
      setIsRequestDialogOpen(false);
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Nu s-a putut adăuga cererea. Te rugăm să încerci din nou.",
      });
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
              Te rugăm să îți confirmi adresa de email pentru a avea acces la
              toate funcționalitățile. Verifică-ți căsuța de email pentru
              linkul de confirmare.
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleResendVerification}
            disabled={isResendingVerification}
            className="w-full max-w-md mx-auto block"
          >
            {isResendingVerification
              ? "Se trimite..."
              : "Retrimite email de verificare"}
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Mobile-optimized navigation */}
        <nav className="flex flex-col sm:flex-row gap-2 border-b pb-4 overflow-x-auto shadow-lg">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant={activeTab === "requests" ? "default" : "ghost"}
              onClick={() => setActiveTab("requests")}
              className={`flex items-center justify-start w-full sm:w-auto ${
                activeTab === "requests"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Cererile mele
            </Button>
            <Button
              variant={activeTab === "offers" ? "default" : "ghost"}
              onClick={() => setActiveTab("offers")}
              className={`flex items-center justify-start w-full sm:w-auto ${
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
              className={`flex items-center justify-start w-full sm:w-auto ${
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
              className={`flex items-center justify-start w-full sm:w-auto ${
                activeTab === "car"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <CarIcon className="w-4 h-4 mr-2" />
              Mașina Mea
            </Button>
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              onClick={() => setActiveTab("profile")}
              className={`flex items-center justify-start w-full sm:w-auto ${
                activeTab === "profile"
                  ? "bg-[#00aff5] hover:bg-[#0099d6] text-white"
                  : "hover:text-[#00aff5]"
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Cont
            </Button>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-auto">
            <Button
              onClick={() => setIsRequestDialogOpen(true)}
              className="w-full sm:w-auto bg-[#00aff5] hover:bg-[#0099d6] text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-semibold">Adaugă cerere</span>
            </Button>
          </div>
        </nav>

        {/* Profile section mobile optimization */}
        {activeTab === "profile" && (
          <Card className="shadow-lg">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="text-[#00aff5] flex items-center gap-2">
                <User className="h-5 w-5" />
                Profilul Meu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#00aff5]">Nume</label>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <Input
                          value={editedProfile.name || ""}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          placeholder="Nume complet"
                          className="border-gray-300 focus:border-[#00aff5] focus:ring-[#00aff5]"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {userProfile.name || "Nespecificat"}
                        </p>
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
                    <label className="text-sm font-medium text-[#00aff5]">Telefon</label>                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <Input
                          value={editedProfile.phone || ""}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          placeholder="Număr de telefon"
                          className="border-gray-300 focus:border-[#00aff5] focus:ring-[#00aff5]"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {userProfile.phone || "Nespecificat"}
                        </p>
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
                          onValueChange={(value) =>
                            handleInputChange("county", value)
                          }
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
                        <p className="text-gray-900">
                          {userProfile.county || "Nespecificat"}
                        </p>
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
                          onValueChange={(value) =>
                            handleInputChange("city", value)
                          }
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
                        <p className="text-gray-900">
                          {userProfile.city || "Nespecificat"}
                        </p>
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
        )}

        {/* Requests section mobile optimization */}
        {activeTab === "requests" && (
          <Card className="shadow-lg overflow-hidden">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="text-[#00aff5] flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Cererile mele
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-4">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="solved">Rezolvate</TabsTrigger>
                  <TabsTrigger value="canceled">Anulate</TabsTrigger>
                </TabsList>
                <div className="overflow-x-auto">
                  <TabsContent value="active">
                    <RequestsTable
                      requests={requests.filter((req) => req.status === "Active")}
                      cars={cars}
                      onDelete={handleDeleteRequest}
                      refreshRequests={fetchRequests}
                    />
                  </TabsContent>
                  <TabsContent value="solved">
                    <RequestsTable
                      requests={requests.filter((req) => req.status === "Rezolvat")}
                      cars={cars}
                      onDelete={handleDeleteRequest}
                      refreshRequests={fetchRequests}
                    />
                  </TabsContent>
                  <TabsContent value="canceled">
                    <RequestsTable
                      requests={requests.filter((req) => req.status === "Anulat")}
                      cars={cars}
                      onDelete={handleDeleteRequest}
                      refreshRequests={fetchRequests}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Rest of the component remains unchanged */}
        {activeTab === "offers" && renderOffers()}
        {activeTab === "messages" && renderMessages()}
        {activeTab === "car" && <CarManagement />}
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Adaugă o cerere nouă</DialogTitle>
            </DialogHeader>
            <RequestForm
              onSubmit={handleRequestSubmit}
              onCancel={() => {
                setRequestFormData({});
                setIsRequestDialogOpen(false);
              }}
              onAddCar={(currentFormData) => {
                setRequestFormData(currentFormData);
                setIsRequestDialogOpen(false);
                setIsCarDialogOpen(true);
              }}
              initialData={requestFormData}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isCarDialogOpen} onOpenChange={setIsCarDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adaugă o mașină nouă</DialogTitle>
            </DialogHeader>
            <CarManagement
              isDialog={true}
              onBackClick={() => {
                setIsCarDialogOpen(false);
                setIsRequestDialogOpen(true);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}