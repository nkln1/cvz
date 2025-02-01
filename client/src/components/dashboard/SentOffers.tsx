import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SendHorizontal, Clock, User, Car, Calendar, CreditCard, FileText, Loader2 } from "lucide-react";
import type { Request, Car as CarType } from "@/types/dashboard";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
  const { user } = useAuth();

  useEffect(() => {
    const fetchOffers = async () => {
      if (!user) return;

      try {
        console.log("Fetching offers for service:", user.uid);
        setLoading(true);
        const offersRef = collection(db, "offers");
        const q = query(
          offersRef,
          where("serviceId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const fetchedOffers: Offer[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("Fetched offer:", { id: doc.id, ...data });
          fetchedOffers.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
          } as Offer);
        });

        console.log("Total offers fetched:", fetchedOffers.length);
        setOffers(fetchedOffers);
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [user, refreshCounter]);

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
        <div className="space-y-6">
          {offers.map((offer) => {
            const request = requests.find((r) => r.id === offer.requestId);
            const car = request ? cars[request.carId] : null;

            return (
              <div
                key={offer.id}
                className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{offer.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      <Clock className="inline-block w-4 h-4 mr-1" />
                      Trimisă pe {format(offer.createdAt, "dd.MM.yyyy HH:mm")}
                    </p>
                  </div>
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

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Detalii Ofertă
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {offer.details}
                      </p>
                    </div>

                    {request && (
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <User className="w-4 h-4" /> Client
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.clientName}
                        </p>
                      </div>
                    )}

                    {car && (
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Car className="w-4 h-4" /> Mașină
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {car.brand} {car.model} ({car.year})
                          {car.licensePlate && (
                            <span className="block text-xs">
                              Nr. {car.licensePlate}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Data Disponibilă
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {offer.availableDate}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Preț
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {offer.price} RON
                      </p>
                    </div>

                    {offer.notes && (
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Observații
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {offer.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default SentOffers;