import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SendHorizontal, Clock, User, Car, Calendar, CreditCard, FileText, Loader2, Eye } from "lucide-react";
import type { Request, Car as CarType } from "@/types/dashboard";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface SentOffersProps {
  requests: Request[];
  cars: Record<string, CarType>;
  refreshRequests: () => Promise<void>;
  refreshCounter: number;
}

interface Offer {
  id: string;
  requestId: string;
  title: string;
  details: string;
  availableDate: string;
  price: number;
  notes?: string;
  status: string;
  createdAt: Date;
  serviceId: string;
}

export function SentOffers({ requests, cars, refreshRequests, refreshCounter }: SentOffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchOffers = async () => {
      if (!user) {
        console.log("No user found, skipping fetch");
        return;
      }

      try {
        console.log("Starting to fetch offers, serviceId:", user.uid);
        setLoading(true);
        const offersRef = collection(db, "offers");
        const q = query(
          offersRef,
          where("serviceId", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);
        console.log("Query snapshot size:", querySnapshot.size);
        const fetchedOffers: Offer[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("Processing offer document:", { id: doc.id, ...data });
          fetchedOffers.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Offer);
        });

        fetchedOffers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        console.log("Final processed offers:", fetchedOffers);
        setOffers(fetchedOffers);
      } catch (error) {
        console.error("Error in fetchOffers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [user, refreshCounter]);

  const renderOfferDetails = (offer: Offer) => {
    const request = requests.find((r) => r.id === offer.requestId);
    const car = request ? cars[request.carId] : null;

    return (
      <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <DialogContent className="max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{offer.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full max-h-[60vh]">
            <div className="space-y-6 p-4">
              {/* Request Details Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-3">Detalii Cerere Inițială</h4>
                {request ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Titlu Cerere:</p>
                      <p className="text-sm">{request.title}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Descriere:</p>
                      <p className="text-sm whitespace-pre-wrap">{request.description}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Data Preferată:</p>
                      <p className="text-sm">{format(new Date(request.preferredDate), "dd.MM.yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Locație:</p>
                      <p className="text-sm">{request.county} - {request.cities.join(", ")}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Detaliile cererii nu sunt disponibile momentan.
                  </p>
                )}
              </div>

              {/* Separator between request and offer */}
              <Separator className="my-4" />

              {/* Offer Details Section */}
              <div>
                <h4 className="text-sm font-medium mb-2">Detalii Ofertă</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{offer.details}</p>
              </div>

              {request && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Client</h4>
                  <p className="text-sm text-muted-foreground">{request.clientName}</p>
                </div>
              )}

              {car && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Mașină</h4>
                  <p className="text-sm text-muted-foreground">
                    {car.brand} {car.model} ({car.year})
                    {car.licensePlate && (
                      <span className="block text-xs">Nr. {car.licensePlate}</span>
                    )}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Data Disponibilă</h4>
                  <p className="text-sm text-muted-foreground">{offer.availableDate}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Preț</h4>
                  <p className="text-sm text-muted-foreground">{offer.price} RON</p>
                </div>
              </div>

              {offer.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Observații</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{offer.notes}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  };

  const filterOffers = (offers: Offer[]) => {
    if (!searchTerm) return offers;

    const searchLower = searchTerm.toLowerCase();
    return offers.filter(offer =>
      offer.title.toLowerCase().includes(searchLower) ||
      offer.details.toLowerCase().includes(searchLower) ||
      offer.price.toString().includes(searchLower) ||
      offer.availableDate.toLowerCase().includes(searchLower)
    );
  };


  const pendingOffers = filterOffers(offers.filter(offer => offer.status === "Pending"));
  const acceptedOffers = filterOffers(offers.filter(offer => offer.status === "Accepted"));
  const rejectedOffers = filterOffers(offers.filter(offer => offer.status === "Rejected"));

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-6 flex justify-center items-center min-h-[200px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[#00aff5]" />
            <p className="text-muted-foreground">Se încarcă ofertele...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderOfferBox = (offer: Offer) => {
    const request = requests.find((r) => r.id === offer.requestId);
    const car = request ? cars[request.carId] : null;

    return (
      <div
        key={offer.id}
        className="bg-white rounded-lg border-2 hover:border-[#00aff5]/30 transition-all duration-200 h-[320px] flex flex-col overflow-hidden"
      >
        {/* Header with title and status */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold line-clamp-1">{offer.title}</h3>
            <Badge
              variant="secondary"
              className={`${
                offer.status === "Pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : offer.status === "Accepted"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              } ml-2 flex-shrink-0`}
            >
              {offer.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {format(offer.createdAt, "dd.MM.yyyy HH:mm")}
            </p>
            {car && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Car className="w-4 h-4 mr-1" />
                <span className="font-medium">{car.licensePlate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-grow">
          <div className="space-y-3">
            {car && (
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-1 flex items-center">
                  <Car className="w-4 h-4 mr-1" />
                  Detalii Mașină:
                </p>
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    {car.brand} {car.model} ({car.year})
                  </p>
                  {car.licensePlate && (
                    <p className="text-gray-600">Nr. înmatriculare: {car.licensePlate}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1 flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                Detalii:
              </p>
              <p className="text-sm line-clamp-2">{offer.details}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-medium text-gray-600 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Data:
                </p>
                <p className="text-sm">{offer.availableDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 flex items-center">
                  <CreditCard className="w-4 h-4 mr-1" />
                  Preț:
                </p>
                <p className="text-sm">{offer.price} RON</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with view details button */}
        <div className="p-4 border-t mt-auto">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSelectedOffer(offer)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Vezi Detalii Complete
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <SendHorizontal className="h-5 w-5" />
          Oferte Trimise
        </CardTitle>
        <CardDescription>
          Urmărește și gestionează ofertele trimise către clienți
        </CardDescription>
         <div className="mt-4">
          <Input
            placeholder="Caută oferte după titlu, detalii, preț sau dată..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="data-[state=active]:bg-[#00aff5] data-[state=active]:text-white">
              Oferte Trimise ({pendingOffers.length})
            </TabsTrigger>
            <TabsTrigger value="accepted" className="data-[state=active]:bg-[#00aff5] data-[state=active]:text-white">
              Oferte Acceptate ({acceptedOffers.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-[#00aff5] data-[state=active]:text-white">
              Oferte Respinse ({rejectedOffers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingOffers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {searchTerm ? "Nu s-au găsit oferte care să corespundă căutării" : "Nu există oferte în așteptare"}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingOffers.map(offer => renderOfferBox(offer))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="accepted">
            {acceptedOffers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                 {searchTerm ? "Nu s-au găsit oferte care să corespundă căutării" : "Nu există oferte acceptate"}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {acceptedOffers.map(offer => renderOfferBox(offer))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {rejectedOffers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                 {searchTerm ? "Nu s-au găsit oferte care să corespundă căutării" : "Nu există oferte respinse"}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rejectedOffers.map(offer => renderOfferBox(offer))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      {selectedOffer && renderOfferDetails(selectedOffer)}
    </Card>
  );
}

export default SentOffers;