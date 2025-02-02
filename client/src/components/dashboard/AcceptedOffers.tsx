import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  SendHorizontal,
  Clock,
  User,
  Calendar,
  CreditCard,
  FileText,
  Loader2,
  MessageSquare,
  Eye,
  RotateCcw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { Car as CarType } from "@/types/dashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface AcceptedOffersProps {
  refreshRequests?: () => Promise<void>;
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

export function AcceptedOffers({ refreshRequests }: AcceptedOffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchOffers = async () => {
      if (!user) {
        console.log("No user found, skipping fetch");
        return;
      }

      try {
        setLoading(true);
        console.log("Starting to fetch accepted offers for service:", user.uid);
        const offersRef = collection(db, "offers");
        const q = query(
          offersRef,
          where("serviceId", "==", user.uid),
          where("status", "==", "Accepted")
        );

        const querySnapshot = await getDocs(q);
        console.log("Number of accepted offers found:", querySnapshot.size);

        const fetchedOffers: Offer[] = [];

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const requestRef = doc(db, "requests", data.requestId);
          const requestSnap = await getDoc(requestRef);
          const requestData = requestSnap.exists() ? requestSnap.data() : null;

          const processedOffer = {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            clientName: requestData?.clientName || "Client necunoscut",
          } as Offer;

          fetchedOffers.push(processedOffer);
        }

        fetchedOffers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setOffers(fetchedOffers);
      } catch (error) {
        console.error("Error in fetchOffers:", error);
        toast({
          title: "Eroare",
          description: "Nu s-au putut încărca ofertele acceptate.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [user]);

  const handleCancelOffer = async (offer: Offer) => {
    if (!user) return;

    try {
      // Update offer status back to Pending
      const offerRef = doc(db, "offers", offer.id);
      await updateDoc(offerRef, {
        status: "Pending",
        updatedAt: new Date(),
      });

      // Update request status back to Active
      const requestRef = doc(db, "requests", offer.requestId);
      await updateDoc(requestRef, {
        status: "Active",
        lastUpdated: new Date(),
      });

      // Remove the canceled offer from the list
      setOffers(offers.filter(o => o.id !== offer.id));

      toast({
        title: "Ofertă anulată",
        description: "Oferta a fost anulată cu succes.",
      });

      if (refreshRequests) {
        await refreshRequests();
      }
    } catch (error) {
      console.error("Error canceling offer:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la anularea ofertei. Încercați din nou.",
        variant: "destructive",
      });
    }
  };

  const renderOfferBox = (offer: Offer) => {
    return (
      <div
        key={offer.id}
        className="bg-white rounded-lg border-2 hover:border-[#00aff5]/30 transition-all duration-200 flex flex-col overflow-hidden h-[320px]"
      >
        {/* Header section - fixed height */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold line-clamp-1 flex-1 mr-2">{offer.title}</h3>
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 ml-2 flex-shrink-0"
            >
              Acceptată
            </Badge>
          </div>
          <div className="text-sm text-gray-600">
            <Clock className="inline-block w-4 h-4 mr-1 text-gray-500" />
            {format(offer.createdAt, "dd.MM.yyyy HH:mm")}
          </div>
        </div>

        {/* Content section - scrollable with max height */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-600 flex items-center mb-1">
              <User className="w-4 h-4 mr-1" />
              Client
            </p>
            <p className="text-sm line-clamp-1">{offer.clientName}</p>
          </div>

          <div className="mb-3">
            <p className="text-sm font-medium text-gray-600 flex items-center mb-1">
              <FileText className="w-4 h-4 mr-1" />
              Detalii Ofertă
            </p>
            <p className="text-sm line-clamp-2">{offer.details}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm font-medium text-gray-600 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Data
              </p>
              <p className="text-sm truncate">{offer.availableDate}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 flex items-center">
                <CreditCard className="w-4 h-4 mr-1" />
                Preț
              </p>
              <p className="text-sm">{offer.price} RON</p>
            </div>
          </div>
        </div>

        {/* Footer section - fixed at bottom */}
        <div className="p-4 border-t mt-auto bg-white">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setSelectedOffer(offer);
                setIsDetailsOpen(true);
              }}
            >
              <Eye className="w-3 h-3 mr-1" />
              Detalii
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 flex-shrink-0"
              onClick={() => handleCancelOffer(offer)}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Anulează
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderOfferDetails = (offer: Offer) => (
    <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
      <DialogContent className="max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{offer.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[60vh] pr-4">
          <div className="space-y-6 p-2">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Client</h3>
              <p className="text-sm text-gray-600">{offer.clientName}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Detalii Ofertă</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{offer.details}</p>
            </div>

            <div className="flex gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Data Programată</h3>
                <p className="text-sm text-gray-600">{offer.availableDate}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Preț</h3>
                <p className="text-sm text-gray-600">{offer.price} RON</p>
              </div>
            </div>

            {offer.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Observații</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{offer.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-6 flex justify-center items-center min-h-[200px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[#00aff5]" />
            <p className="text-muted-foreground">Se încarcă ofertele acceptate...</p>
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
          Vezi și gestionează ofertele acceptate de clienți
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {offers.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nu există oferte acceptate
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map(offer => renderOfferBox(offer))}
          </div>
        )}
      </CardContent>
      {selectedOffer && renderOfferDetails(selectedOffer)}
    </Card>
  );
}

export default AcceptedOffers;
