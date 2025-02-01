import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SendHorizontal, Clock, User, Calendar, CreditCard, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { Car as CarType } from "@/types/dashboard";

interface ReceivedOffersProps {
  cars: Record<string, CarType>;
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
  serviceName?: string;
}

export function ReceivedOffers({ cars }: ReceivedOffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOffers = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const offersRef = collection(db, "offers");
        const q = query(offersRef, where("clientId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const fetchedOffers: Offer[] = [];

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const serviceRef = doc(db, "services", data.serviceId);
          const serviceSnap = await getDoc(serviceRef);
          const serviceName = serviceSnap.exists() ? serviceSnap.data().companyName : "Service Necunoscut";

          fetchedOffers.push({
            id: docSnap.id,
            ...data,
            serviceName,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Offer);
        }

        fetchedOffers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setOffers(fetchedOffers);
      } catch (error) {
        console.error("Error fetching received offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [user]);

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
            Oferte Primite
          </CardTitle>
          <CardDescription>
            Vezi și gestionează ofertele primite de la service-uri auto
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground py-4">
            Nu există oferte primite momentan
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
          Oferte Primite ({offers.length})
        </CardTitle>
        <CardDescription>
          Vezi și gestionează ofertele primite de la service-uri auto
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white border-2 border-gray-200 rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-semibold">{offer.title}</h3>
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

              <div className="text-sm text-gray-600 mb-2">
                <Clock className="inline-block w-4 h-4 mr-1 text-gray-500" />
                {format(offer.createdAt, "dd.MM.yyyy HH:mm")}
              </div>

              <div className="border-t border-gray-200 py-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" /> Service:{" "}
                  <span className="font-normal">{offer.serviceName}</span>
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <h4 className="text-xs font-medium text-gray-500">Disponibilitate</h4>
                  <p className="text-sm">{offer.availableDate}</p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500">Preț</h4>
                  <p className="text-sm">{offer.price} RON</p>
                </div>
              </div>

              <div className="mt-2">
                <h4 className="text-xs font-medium text-gray-500">Detalii</h4>
                <p className="text-sm">{offer.details}</p>
              </div>

              {offer.notes && (
                <div className="mt-2">
                  <h4 className="text-xs font-medium text-gray-500">Observații</h4>
                  <p className="text-sm">{offer.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ReceivedOffers;
