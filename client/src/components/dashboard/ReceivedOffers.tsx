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
  isNew?: boolean;
}

export function ReceivedOffers({ cars, onMessageService, refreshRequests }: ReceivedOffersProps) {
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

  
  const formatDateSafely = (dateValue: any) => {
    if (!dateValue) return "Data necunoscută";

    try {
      // If it's already a properly formatted string like "01.03.2002", return it as is
      if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        return dateValue;
      }

      // Handle Firestore Timestamp
      if (dateValue && typeof dateValue.toDate === 'function') {
        return format(dateValue.toDate(), "dd.MM.yyyy");
      }

      // Handle other date strings
      if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return format(date, "dd.MM.yyyy");
        }
      }

      console.log("Unhandled date format:", typeof dateValue, dateValue);
      return dateValue?.toString() || "Data necunoscută";
    } catch (error) {
      console.error("Error formatting date:", error, "Date value:", dateValue);
      return "Data necunoscută";
    }
  };


  useEffect(() => {
    const fetchOffers = async () => {
      if (!user) {
        console.log("No user found, skipping fetch");
        return;
      }
  
      try {
        setLoading(true);
        console.log("Starting to fetch offers for client:", user.uid);
        const offersRef = collection(db, "offers");
        const q = query(offersRef, where("clientId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        console.log("Number of offers found:", querySnapshot.size);
  
        const fetchedOffers: Offer[] = [];
  
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          console.log("Raw offer data:", {
            id: docSnap.id,
            availableDate: data.availableDate,
            createdAt: data.createdAt
          });
  
          const serviceRef = doc(db, "services", data.serviceId);
          const serviceSnap = await getDoc(serviceRef);
          const serviceName = serviceSnap.exists() ? serviceSnap.data().companyName : "Service Necunoscut";
  
          const processedOffer = {
            id: docSnap.id,
            ...data,
            serviceName,
            createdAt: data.createdAt?.toDate() || new Date(),
            // Keep availableDate as is, since it's already in the correct string format
            availableDate: data.availableDate,
            isNew: !viewedOffers.has(docSnap.id),
          } as Offer;
    
          console.log("Processing offer with availableDate:", data.availableDate);
          fetchedOffers.push(processedOffer);
        }
  
        fetchedOffers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        console.log("All processed offers:", fetchedOffers);
        setOffers(fetchedOffers);
      } catch (error) {
        console.error("Error in fetchOffers:", error);
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

      // Update offer status to Accepted
      const offerRef = doc(db, "offers", offer.id);
      await updateDoc(offerRef, {
        status: "Accepted",
        updatedAt: new Date(),
      });

      // Update the request status to Rezolvat ONLY when accepting an offer
      const requestRef = doc(db, "requests", offer.requestId);
      await updateDoc(requestRef, {
        status: "Rezolvat",
        lastUpdated: new Date(),
      });

      // Refresh offers in UI
      const updatedOffers = offers.map(o => 
        o.id === offer.id ? { ...o, status: "Accepted" } : o
      );
      setOffers(updatedOffers);

      // Refresh requests list to update the tabs
      if (refreshRequests) {
        await refreshRequests();
      }

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
      // Update only the offer status to Rejected
      const offerRef = doc(db, "offers", offer.id);
      await updateDoc(offerRef, {
        status: "Rejected",
        updatedAt: new Date(),
      });

      // DO NOT update the request status - keep it active
      // This allows other offers to still come in

      // Refresh offers
      const updatedOffers = offers.map(o => 
        o.id === offer.id ? { ...o, status: "Rejected" } : o
      );
      setOffers(updatedOffers);

      toast({
        title: "Ofertă respinsă",
        description: "Oferta a fost respinsă cu succes.",
      });
    } catch (error) {
      console.error("Error rejecting offer:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la respingerea ofertei. Încercați din nou.",
        variant: "destructive",
      });
    }
  };

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

      // Refresh offers
      const updatedOffers = offers.map(o => 
        o.id === offer.id ? { ...o, status: "Pending" } : o
      );
      setOffers(updatedOffers);

      toast({
        title: "Ofertă anulată",
        description: "Oferta a fost anulată cu succes.",
      });
    } catch (error) {
      console.error("Error canceling offer:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la anularea ofertei. Încercați din nou.",
        variant: "destructive",
      });
    }
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
              <h3 className="text-sm font-medium text-gray-700 mb-2">Detalii Ofertă</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{offer.details}</p>
            </div>

            <div className="flex gap-4">
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

  const renderOfferBox = (offer: Offer) => {
    console.log("Rendering offer box for offer:", {
      id: offer.id,
      availableDate: offer.availableDate,
      title: offer.title
    });

    return (
      <div
        key={offer.id}
        className="bg-white border-2 border-gray-200 rounded-lg hover:border-[#00aff5]/30 transition-all duration-200 relative h-[320px] flex flex-col"
        onMouseEnter={() => offer.isNew && markOfferAsViewed(offer.id)}
      >
        {offer.isNew && (
          <Badge className="absolute -top-2 -right-2 bg-[#00aff5] text-white">
            Nou
          </Badge>
        )}

        {/* Header section */}
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
          <div className="text-sm text-gray-600">
            <Clock className="inline-block w-4 h-4 mr-1 text-gray-500" />
            {format(offer.createdAt, "dd.MM.yyyy HH:mm")}
          </div>
        </div>

        {/* Content section */}
        <div className="p-4 flex-grow">
          <div className="mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Service:{" "}
              <span className="font-normal line-clamp-1">{offer.serviceName}</span>
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <h4 className="text-xs font-medium text-gray-500">Disponibilitate</h4>
              <p className="text-sm">{formatDateSafely(offer.availableDate)}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500">Preț</h4>
              <p className="text-sm">{offer.price} RON</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">Detalii</h4>
            <p className="text-sm line-clamp-2">{offer.details}</p>
          </div>
        </div>

        {/* Actions section */}
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="xs"
              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex-shrink-0"
              onClick={() => onMessageService?.(offer.serviceId, offer.requestId)}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Mesaj
            </Button>

            <Button
              variant="outline"
              size="xs"
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setSelectedOffer(offer);
                setIsDetailsOpen(true);
              }}
            >
              <Eye className="w-3 h-3 mr-1" />
              Detalii
            </Button>

            {offer.status === "Pending" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  className="text-green-500 hover:text-green-700 hover:bg-green-50 flex-shrink-0"
                  onClick={() => handleAcceptOffer(offer)}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Acceptă
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  onClick={() => handleRejectOffer(offer)}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Respinge
                </Button>
              </div>
            )}

            {offer.status === "Accepted" && (
              <Button
                variant="outline"
                size="xs"
                className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 flex-shrink-0"
                onClick={() => handleCancelOffer(offer)}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Anulează
              </Button>
            )}
          </div>
        </div>
      </div>
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
        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="data-[state=active]:bg-[#00aff5] data-[state=active]:text-white">
              Oferte Primite ({pendingOffers.length})
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
                Nu există oferte în așteptare
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
                Nu există oferte acceptate
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
                Nu există oferte respinse
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

export default ReceivedOffers;