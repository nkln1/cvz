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
  Check,
  XCircle,
  Eye,
  RotateCcw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { useToast } from "@/hooks/use-toast";

interface ReceivedOffersProps {
  cars: Record<string, CarType>;
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
  serviceName?: string;
  isNew?: boolean;
}

export function ReceivedOffers({ cars, onMessageService }: ReceivedOffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewedOffers, setViewedOffers] = useState<Set<string>>(new Set());
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchViewedOffers = async () => {
      if (!user) return;

      try {
        const viewedOffersRef = doc(db, `users/${user.uid}/metadata/viewedOffers`);
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

  useEffect(() => {
    const fetchOffers = async () => {
      if (!user) return;

      try {
        setLoading(true);
        console.log("Fetching received offers for client:", user.uid);
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
            isNew: !viewedOffers.has(docSnap.id),
          } as Offer);
        }

        fetchedOffers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        console.log("Final processed received offers:", fetchedOffers);
        setOffers(fetchedOffers);
      } catch (error) {
        console.error("Error fetching received offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [user, viewedOffers]);

  const markOfferAsViewed = async (offerId: string) => {
    if (!user) return;

    try {
      const viewedOffersRef = doc(db, `users/${user.uid}/metadata/viewedOffers`);
      const newViewedOffers = new Set(viewedOffers).add(offerId);
      await setDoc(viewedOffersRef, {
        offerIds: Array.from(newViewedOffers),
      }, { merge: true });
      setViewedOffers(newViewedOffers);
    } catch (error) {
      console.error("Error marking offer as viewed:", error);
    }
  };

  const handleAcceptOffer = async (offer: Offer) => {
    if (!user) return;

    try {
      // Check if there's already an accepted offer for this request
      const offersRef = collection(db, "offers");
      const q = query(
        offersRef,
        where("requestId", "==", offer.requestId),
        where("status", "==", "Accepted")
      );

      const existingAcceptedOffers = await getDocs(q);

      if (!existingAcceptedOffers.empty) {
        toast({
          title: "Nu se poate accepta oferta",
          description: "Există deja o ofertă acceptată pentru această cerere. Anulați oferta acceptată înainte de a accepta una nouă.",
          variant: "destructive",
        });
        return;
      }

      const offerRef = doc(db, "offers", offer.id);
      await updateDoc(offerRef, {
        status: "Accepted",
        updatedAt: new Date(),
      });

      // Update the request status
      const requestRef = doc(db, "requests", offer.requestId);
      await updateDoc(requestRef, {
        status: "Rezolvat",
        lastUpdated: new Date(),
      });

      // Refresh offers
      const updatedOffers = offers.map(o => 
        o.id === offer.id ? { ...o, status: "Accepted" } : o
      );
      setOffers(updatedOffers);

      toast({
        title: "Succes!",
        description: "Oferta a fost acceptată cu succes.",
      });
    } catch (error) {
      console.error("Error accepting offer:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la acceptarea ofertei. Încercați din nou.",
        variant: "destructive",
      });
    }
  };

  const handleRejectOffer = async (offer: Offer) => {
    if (!user) return;

    try {
      const offerRef = doc(db, "offers", offer.id);
      await updateDoc(offerRef, {
        status: "Rejected",
        updatedAt: new Date(),
      });

      // Update the request status
      const requestRef = doc(db, "requests", offer.requestId);
      await updateDoc(requestRef, {
        status: "Respins",
        lastUpdated: new Date(),
      });

      // Refresh offers
      const updatedOffers = offers.map(o => 
        o.id === offer.id ? { ...o, status: "Rejected" } : o
      );
      setOffers(updatedOffers);
    } catch (error) {
      console.error("Error rejecting offer:", error);
    }
  };

  const handleCancelOffer = async (offer: Offer) => {
    if (!user) return;

    try {
      const offerRef = doc(db, "offers", offer.id);
      await updateDoc(offerRef, {
        status: "Pending",
        updatedAt: new Date(),
      });

      // Update the request status
      const requestRef = doc(db, "requests", offer.requestId);
      await updateDoc(requestRef, {
        status: "În așteptare",
        lastUpdated: new Date(),
      });

      // Refresh offers
      const updatedOffers = offers.map(o => 
        o.id === offer.id ? { ...o, status: "Pending" } : o
      );
      setOffers(updatedOffers);
    } catch (error) {
      console.error("Error canceling offer:", error);
    }
  };

    const formatDateSafely = (dateString: string) => {
        try {
          return format(new Date(dateString), "dd.MM.yyyy");
        } catch (error) {
          console.error("Error formatting date:", error);
          return "Data necunoscută";
        }
    };

  const renderOfferDetails = (offer: Offer) => (
    <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
      <DialogContent className="max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#00aff5]">{offer.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 p-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {format(offer.createdAt, "dd.MM.yyyy HH:mm")}
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

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Service Auto</h3>
              <p className="text-sm text-gray-600">{offer.serviceName}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Detalii Ofertă</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{offer.details}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Data Disponibilă</h3>
                <p className="text-sm text-gray-600">{formatDateSafely(offer.availableDate)}</p>
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

  const renderOfferBox = (offer: Offer) => (
    <div
      key={offer.id}
      className="bg-white rounded-lg border-2 hover:border-[#00aff5]/30 transition-all duration-200 relative h-[280px] flex flex-col p-4"
      onMouseEnter={() => offer.isNew && markOfferAsViewed(offer.id)}
    >
      {offer.isNew && (
        <Badge className="absolute -top-2 -right-2 bg-[#00aff5] text-white">
          Nou
        </Badge>
      )}

      {/* Header */}
      <div className="mb-3">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold line-clamp-1">{offer.title}</h3>
          <Badge
            variant="secondary"
            className={`ml-2 flex-shrink-0 ${
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
        <p className="text-sm text-muted-foreground flex items-center mt-1">
          <Clock className="w-4 h-4 mr-1" />
          {format(offer.createdAt, "dd.MM.yyyy HH:mm")}
        </p>
      </div>

      {/* Content */}
      <div className="flex-grow space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Service:</p>
          <p className="text-sm line-clamp-1">{offer.serviceName}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Detalii:</p>
          <p className="text-sm line-clamp-2">{offer.details}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Data:</p>
            <p className="text-sm">{formatDateSafely(offer.availableDate)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Preț:</p>
            <p className="text-sm">{offer.price} RON</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 pt-3 border-t flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          onClick={() => onMessageService?.(offer.serviceId, offer.requestId)}
        >
          <MessageSquare className="w-4 h-4 mr-1" />
          Mesaj
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          onClick={() => {
            setSelectedOffer(offer);
            setIsDetailsOpen(true);
          }}
        >
          <Eye className="w-4 h-4 mr-1" />
          Detalii
        </Button>

        {offer.status === "Pending" && (
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="text-green-500 hover:text-green-700 hover:bg-green-50"
              onClick={() => handleAcceptOffer(offer)}
            >
              <Check className="w-4 h-4 mr-1" />
              Acceptă
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleRejectOffer(offer)}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Respinge
            </Button>
          </div>
        )}

        {offer.status === "Accepted" && (
          <Button
            variant="outline"
            size="sm"
            className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 ml-auto"
            onClick={() => handleCancelOffer(offer)}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Anulează
          </Button>
        )}
      </div>
    </div>
  );


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

  const pendingOffers = offers.filter(offer => offer.status === "Pending");
  const acceptedOffers = offers.filter(offer => offer.status === "Accepted");
  const rejectedOffers = offers.filter(offer => offer.status === "Rejected");

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
      <CardContent className="p-4">
        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="data-[state=active]:bg-[#00aff5] data-[state=active]:text-white">
              În așteptare ({pendingOffers.length})
            </TabsTrigger>
            <TabsTrigger value="accepted" className="data-[state=active]:bg-[#00aff5] data-[state=active]:text-white">
              Acceptate ({acceptedOffers.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-[#00aff5] data-[state=active]:text-white">
              Respinse ({rejectedOffers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingOffers.map(renderOfferBox)}
            </div>
          </TabsContent>

          <TabsContent value="accepted" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {acceptedOffers.map(renderOfferBox)}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rejectedOffers.map(renderOfferBox)}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      {selectedOffer && renderOfferDetails(selectedOffer)}
    </Card>
  );
}

export default ReceivedOffers;