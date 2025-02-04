import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SendHorizontal, Loader2, MessageSquare, Eye } from "lucide-react";
import type { Request, Car as CarType } from "@/types/dashboard";
import { collection, query, getDocs, where, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { OfferBox } from "./offers/OfferBox";
import { OfferDetails } from "./offers/OfferDetails";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AcceptedOffersProps {
  requests: Request[];
  cars: Record<string, CarType>;
  refreshRequests: () => Promise<void>;
  refreshCounter: number;
  onMessageService?: (serviceId: string, requestId: string) => void;
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
  isNew?: boolean;
}

export function AcceptedOffers({ requests, cars, refreshRequests, refreshCounter, onMessageService }: AcceptedOffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [viewedOffers, setViewedOffers] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  // Effect to fetch viewed offers
  useEffect(() => {
    const fetchViewedOffers = async () => {
      if (!user) return;

      try {
        const viewedOffersRef = doc(db, `users/${user.uid}/metadata/viewedAcceptedOffers`);
        const viewedOffersDoc = await getDoc(viewedOffersRef);
        if (viewedOffersDoc.exists()) {
          setViewedOffers(new Set(viewedOffersDoc.data().offerIds || []));
        }
      } catch (error) {
        console.error("Error fetching viewed offers:", error);
      }
    };

    fetchViewedOffers();
  }, [user]);

  const markOfferAsViewed = async (offerId: string) => {
    if (!user) return;

    try {
      const viewedOffersRef = doc(db, `users/${user.uid}/metadata/viewedAcceptedOffers`);
      const newViewedOffers = new Set(viewedOffers).add(offerId);
      await setDoc(viewedOffersRef, {
        offerIds: Array.from(newViewedOffers),
      }, { merge: true });
      setViewedOffers(newViewedOffers);
    } catch (error) {
      console.error("Error marking offer as viewed:", error);
    }
  };

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
              status: "Accepted",
              isNew: !viewedOffers.has(docSnapshot.id)
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
  }, [user, refreshCounter, viewedOffers]);

  const handleViewDetails = (offer: Offer) => {
    if (offer.isNew) {
      markOfferAsViewed(offer.id);
    }
    setSelectedOffer(offer);
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
              <div
                key={offer.id}
                className="bg-white border-2 border-gray-200 rounded-lg hover:border-[#00aff5]/30 transition-all duration-200 relative p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold">{offer.title}</h3>
                  {offer.isNew && (
                    <Badge className="bg-[#00aff5] text-white">Nou</Badge>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600 line-clamp-2">{offer.details}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Disponibilitate</p>
                      <p className="text-sm font-medium">{offer.availableDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Preț</p>
                      <p className="text-sm font-medium">{offer.price} RON</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  {onMessageService && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => onMessageService(offer.serviceId, offer.requestId)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Mesaj
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(offer)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Detalii
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <OfferDetails
        offer={selectedOffer}
        cars={cars}
        open={!!selectedOffer}
        onOpenChange={(open) => !open && setSelectedOffer(null)}
      />
    </Card>
  );
}

export default AcceptedOffers;