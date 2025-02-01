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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
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
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{offer.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full max-h-[60vh] pr-4">
            <div className="space-y-6 p-2">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Detalii Ofertă</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{offer.details}</p>
              </div>

              {request && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Client</h4>
                  <p className="text-sm text-gray-600">{request.clientName}</p>
                </div>
              )}

              {car && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Mașină</h4>
                  <p className="text-sm text-gray-600">
                    {car.brand} {car.model} ({car.year})
                    {car.licensePlate && (
                      <span className="block text-xs">Nr. {car.licensePlate}</span>
                    )}
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Data Disponibilă</h4>
                  <p className="text-sm text-gray-600">{offer.availableDate}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Preț</h4>
                  <p className="text-sm text-gray-600">{offer.price} RON</p>
                </div>
              </div>

              {offer.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Observații</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{offer.notes}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  };

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

  if (!offers || offers.length === 0) {
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
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground py-4">
            Nu există oferte trimise momentan
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <SendHorizontal className="h-5 w-5" />
          Oferte Trimise ({offers.length})
        </CardTitle>
        <CardDescription>
          Urmărește și gestionează ofertele trimise către clienți
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => {
            const request = requests.find((r) => r.id === offer.requestId);
            const car = request ? cars[request.carId] : null;

            return (
              <div
                key={offer.id}
                className="bg-white rounded-lg border-2 border-gray-200 hover:border-[#00aff5]/30 transition-all duration-200 h-[320px] flex flex-col"
              >
                <div className="p-4 border-b">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-md font-semibold line-clamp-1">{offer.title}</h3>
                    <Badge
                      variant="secondary"
                      className={`${
                        offer.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : offer.status === "Accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {offer.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    <Clock className="inline-block w-4 h-4 mr-1" />
                    {format(offer.createdAt, "dd.MM.yyyy HH:mm")}
                  </p>
                </div>

                <div className="p-4 flex-grow">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Detalii
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {offer.details}
                      </p>
                    </div>

                    {request && (
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <User className="w-4 h-4" /> Client
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {request.clientName}
                        </p>
                      </div>
                    )}

                    {car && (
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Car className="w-4 h-4" /> Mașină
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {car.brand} {car.model} ({car.year})
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t mt-auto">
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="text-muted-foreground">{offer.price} RON</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        setSelectedOffer(offer);
                        setIsDetailsOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Vezi Detalii
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      {selectedOffer && renderOfferDetails(selectedOffer)}
    </Card>
  );
}

export default SentOffers;