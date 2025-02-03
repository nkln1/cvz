import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SendHorizontal, Loader2 } from "lucide-react";
import type { Request, Car as CarType } from "@/types/dashboard";
import { collection, query, getDocs, getDoc, where, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OfferList } from "./offers/OfferList";
import { SearchBar } from "./offers/SearchBar";
import { OfferDetails } from "./offers/OfferDetails";
import { OfferBox } from "./offers/OfferBox";

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
  request: Request | null;
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
          where("serviceId", "==", user.uid),
        );

        const querySnapshot = await getDocs(q);
        console.log("Query snapshot size:", querySnapshot.size);
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
              status: data.status || "Pending"
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
  }, [user, refreshCounter, requests]);

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

  const filteredOffers = filterOffers(offers);

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
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="data-[state=active]:bg-[#00aff5] data-[state=active]:text-white">
              Oferte Trimise ({filteredOffers.filter(o => o.status === "Pending").length})
            </TabsTrigger>
            <TabsTrigger value="accepted" className="data-[state=active]:bg-[#00aff5] data-[state=active]:text-white">
              Oferte Acceptate ({filteredOffers.filter(o => o.status === "Accepted").length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-[#00aff5] data-[state=active]:text-white">
              Oferte Respinse ({filteredOffers.filter(o => o.status === "Rejected").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <OfferList
              offers={filteredOffers.filter(o => o.status === "Pending")}
              cars={cars}
              onViewDetails={setSelectedOffer}
            />
          </TabsContent>
          <TabsContent value="accepted">
            <OfferList
              offers={filteredOffers.filter(o => o.status === "Accepted")}
              cars={cars}
              onViewDetails={setSelectedOffer}
            />
          </TabsContent>
          <TabsContent value="rejected">
            <OfferList
              offers={filteredOffers.filter(o => o.status === "Rejected")}
              cars={cars}
              onViewDetails={setSelectedOffer}
            />
          </TabsContent>
        </Tabs>
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

export default SentOffers;