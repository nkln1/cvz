
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SendHorizontal, Loader2 } from "lucide-react";
import type { Request, Car as CarType } from "@/types/dashboard";
import { collection, query, getDocs, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { OfferBox } from "./offers/OfferBox";

interface AcceptedOffersProps {
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
  request: Request | null;
}

export function AcceptedOffers({ requests, cars, refreshRequests, refreshCounter }: AcceptedOffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOffers = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const offersRef = collection(db, "offers");
        const q = query(
          offersRef,
          where("serviceId", "==", user.uid),
          where("status", "==", "Accepted")
        );

        const querySnapshot = await getDocs(q);
        const fetchedOffers: Offer[] = [];

        const fetchPromises = querySnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          try {
            const requestRef = doc(db, "requests", data.requestId);
            const requestDoc = await getDoc(requestRef);
            const requestData = requestDoc.exists() ? { id: requestDoc.id, ...requestDoc.data() } as Request : null;

            return {
              id: docSnapshot.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              request: requestData,
              availableDate: data.availableDate || "Data necunoscută",
              price: data.price || 0,
              status: "Accepted"
            } as Offer;
          } catch (error) {
            console.error("Error fetching request data for doc:", docSnapshot.id, error);
            return null;
          }
        });

        const results = await Promise.all(fetchPromises);
        fetchedOffers.push(...results.filter((offer): offer is Offer => offer !== null));
        fetchedOffers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setOffers(fetchedOffers);
      } catch (error) {
        console.error("Error in fetchOffers:", error);
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

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <SendHorizontal className="h-5 w-5" />
          Oferte Acceptate
        </CardTitle>
        <CardDescription>
          Gestionează ofertele acceptate de către clienți
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {offers.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nu există oferte acceptate
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map(offer => (
              <OfferBox 
                key={offer.id}
                offer={offer}
                cars={cars}
                onViewDetails={() => {}}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AcceptedOffers;
