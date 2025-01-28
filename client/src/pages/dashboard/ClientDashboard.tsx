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
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainLayout from "@/components/layout/MainLayout";
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import CarManagement from "./CarManagement";
import { RequestForm } from "@/components/dashboard/RequestForm";

// ... keep all other interfaces and types ...

interface RequestWithCar extends Request {
  carDetails?: {
    brand: string;
    model: string;
    year: number;
  };
}

const renderRequestsTable = (
  filteredRequests: RequestWithCar[],
  onView: (request: RequestWithCar) => void,
  onDelete: (requestId: string) => void
) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Titlu</TableHead>
        <TableHead>Mașina</TableHead>
        <TableHead>Data</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Acțiuni</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {filteredRequests.map((request) => (
        <TableRow key={request.id} className="hover:bg-gray-50">
          <TableCell className="font-medium">{request.title}</TableCell>
          <TableCell>
            {request.carDetails
              ? `${request.carDetails.brand} ${request.carDetails.model} (${request.carDetails.year})`
              : "Se încarcă..."}
          </TableCell>
          <TableCell>{format(new Date(request.preferredDate), "dd.MM.yyyy")}</TableCell>
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
          <TableCell className="text-right space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(request)}
              className="inline-flex items-center"
            >
              <Eye className="h-4 w-4 mr-1" />
              Vizualizare
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(request.id)}
              className="inline-flex items-center text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Șterge
            </Button>
          </TableCell>
        </TableRow>
      ))}
      {filteredRequests.length === 0 && (
        <TableRow>
          <TableCell colSpan={5} className="text-center text-muted-foreground">
            Nu există cereri în această categorie.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
);

export default function ClientDashboard() {
  // ... keep existing state variables ...
  const [requests, setRequests] = useState<RequestWithCar[]>([]);
  const [viewingRequest, setViewingRequest] = useState<RequestWithCar | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // ... keep existing useEffect and other functions ...

  const fetchRequests = async () => {
    if (!user?.uid) return;

    try {
      const requestsQuery = query(
        collection(db, "requests"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(requestsQuery);
      const loadedRequests: RequestWithCar[] = [];

      for (const doc of querySnapshot.docs) {
        const requestData = { id: doc.id, ...doc.data() } as RequestWithCar;

        // Fetch car details for each request
        if (requestData.carId) {
          const carDoc = await getDoc(doc(db, "cars", requestData.carId));
          if (carDoc.exists()) {
            const carData = carDoc.data();
            requestData.carDetails = {
              brand: carData.brand,
              model: carData.model,
              year: carData.year,
            };
          }
        }

        loadedRequests.push(requestData);
      }

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

  const handleViewRequest = (request: RequestWithCar) => {
    setViewingRequest(request);
    setIsViewDialogOpen(true);
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!user?.uid) return;

    try {
      await deleteDoc(doc(db, "requests", requestId));

      toast({
        title: "Success",
        description: "Cererea a fost ștearsă cu succes!",
      });

      // Refresh the requests list
      fetchRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-a putut șterge cererea. Te rugăm să încerci din nou.",
      });
    }
  };

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
            {renderRequestsTable(
              requests.filter((req) => req.status === "Active"),
              handleViewRequest,
              handleDeleteRequest
            )}
          </TabsContent>
          <TabsContent value="solved">
            {renderRequestsTable(
              requests.filter((req) => req.status === "Rezolvat"),
              handleViewRequest,
              handleDeleteRequest
            )}
          </TabsContent>
          <TabsContent value="canceled">
            {renderRequestsTable(
              requests.filter((req) => req.status === "Anulat"),
              handleViewRequest,
              handleDeleteRequest
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  // ... keep other render functions ...

  return (
    <MainLayout>
      {/* ... keep existing JSX ... */}

      {/* Add View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalii Cerere</DialogTitle>
          </DialogHeader>
          {viewingRequest && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{viewingRequest.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(viewingRequest.preferredDate), "dd.MM.yyyy")}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Descriere:</h4>
                <p className="text-sm mt-1">{viewingRequest.description}</p>
              </div>
              <div>
                <h4 className="font-medium">Mașina:</h4>
                <p className="text-sm mt-1">
                  {viewingRequest.carDetails
                    ? `${viewingRequest.carDetails.brand} ${viewingRequest.carDetails.model} (${viewingRequest.carDetails.year})`
                    : "Informații indisponibile"}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Locație:</h4>
                <p className="text-sm mt-1">{`${viewingRequest.city}, ${viewingRequest.county}`}</p>
              </div>
              <div>
                <h4 className="font-medium">Status:</h4>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-sm mt-1 ${
                    viewingRequest.status === "Active"
                      ? "bg-yellow-100 text-yellow-800"
                      : viewingRequest.status === "Rezolvat"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {viewingRequest.status}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ... keep other dialogs ... */}
    </MainLayout>
  );
}