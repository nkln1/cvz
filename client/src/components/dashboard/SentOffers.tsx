import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SendHorizontal, Loader2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import type { Request, Car as CarType } from "@/types/dashboard";
import { collection, query, getDocs, getDoc, where, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OfferList } from "./offers/OfferList";
import { SearchBar } from "./offers/SearchBar";
import { OfferDetails } from "./offers/OfferDetails";

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
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();

  const ITEMS_PER_PAGE = 9; // Modificat pentru a afișa 9 oferte pe pagină

  useEffect(() => {
    let isMounted = true;

    const fetchOffers = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        if (!isMounted) return;
        setLoading(true);
        const offersRef = collection(db, "offers");
        const q = query(offersRef, where("serviceId", "==", user.uid));

        const querySnapshot = await getDocs(q);
        if (!isMounted) return;

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

    return () => {
      isMounted = false;
    };
  }, [user?.uid, refreshCounter]);

  useEffect(() => {
    setCurrentPage(1); // Resetare paginare la schimbarea tab-ului sau a termenului de căutare
  }, [searchTerm, activeTab]);

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

  const filteredOffers = filterOffers(offers || []).filter(o => o?.status?.toLowerCase() === activeTab);
  const totalPages = Math.ceil(filteredOffers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOffers = filteredOffers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
          Oferte Trimise
        </CardTitle>
        <CardDescription>Urmărește și gestionează ofertele trimise către clienți</CardDescription>
        <div className="mt-4">
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Calculate counts */}
          {(() => {
            const pendingOffersCount = filterOffers(offers).filter(o => o.status.toLowerCase() === "pending").length;
            const rejectedOffersCount = filterOffers(offers).filter(o => o.status.toLowerCase() === "rejected").length;

            return (
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="pending" className="data-[state=active]:bg-[#00aff5] data-[state=active]:text-white">
                  Oferte Trimise ({pendingOffersCount})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="data-[state=active]:bg-[#00aff5] data-[state=active]:text-white">
                  Oferte Respinse ({rejectedOffersCount})
                </TabsTrigger>
              </TabsList>
            );
          })()}

          <TabsContent value={activeTab}>
            <OfferList offers={paginatedOffers} cars={cars} onViewDetails={setSelectedOffer} />
            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink onClick={() => setCurrentPage(index + 1)} isActive={currentPage === index + 1}>
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <OfferDetails offer={selectedOffer} cars={cars} open={!!selectedOffer} onOpenChange={(open) => !open && setSelectedOffer(null)} />
    </Card>
  );
}

export default SentOffers;