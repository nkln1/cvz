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
  Eye
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
  DialogTrigger,
} from "@/components/ui/dialog";

interface ReceivedOffersProps {
  cars: Record<string, CarType>;
  onMessageService?: (serviceId: string, requestId: string) => void;
}

interface Offer {
  id: string;
  requestId: string;
  serviceId: string;
  clientId: string;
  status: string;
  createdAt: Date;
  title: string;
  details: string;
  availableDate: string;
  price: number;
  notes?: string;
  serviceName?: string;
  isNew?: boolean;
}

interface OfferDetailsDialogProps {
  offer: Offer;
  onAccept: (offer: Offer) => void;
  onReject: (offer: Offer) => void;
  onMessage: (serviceId: string, requestId: string) => void;
}

const OfferDetailsDialog = ({ offer, onAccept, onReject, onMessage }: OfferDetailsDialogProps) => (
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Detalii Ofertă</DialogTitle>
    </DialogHeader>
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">{offer.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          <Clock className="inline-block w-4 h-4 mr-1" />
          {format(offer.createdAt, "dd.MM.yyyy HH:mm")}
        </p>
      </div>

      <div className="grid gap-4">
        <div>
          <h4 className="text-sm font-medium mb-1">Service Auto</h4>
          <p className="text-sm">{offer.serviceName}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-1">Detalii</h4>
          <p className="text-sm whitespace-pre-wrap">{offer.details}</p>
        </div>

        <div className="flex gap-6">
          <div>
            <h4 className="text-sm font-medium mb-1">Data Disponibilă</h4>
            <p className="text-sm">{offer.availableDate}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Preț</h4>
            <p className="text-sm">{offer.price} RON</p>
          </div>
        </div>

        {offer.notes && (
          <div>
            <h4 className="text-sm font-medium mb-1">Observații</h4>
            <p className="text-sm whitespace-pre-wrap">{offer.notes}</p>
          </div>
        )}
      </div>

      {offer.status === "Pending" && (
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="text-blue-500"
            onClick={() => onMessage(offer.serviceId, offer.requestId)}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Mesaj
          </Button>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-green-500"
              onClick={() => onAccept(offer)}
            >
              <Check className="w-4 h-4 mr-1" />
              Acceptă
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-500"
              onClick={() => onReject(offer)}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Respinge
            </Button>
          </div>
        </div>
      )}
    </div>
  </DialogContent>
);

export function ReceivedOffers({ cars, onMessageService }: ReceivedOffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewedOffers, setViewedOffers] = useState<Set<string>>(new Set());
  const { user } = useAuth();

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
        const offersRef = collection(db, "offers");
        const q = query(offersRef, where("clientId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const fetchedOffers: Offer[] = [];

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const serviceRef = doc(db, "services", data.serviceId);
          const serviceSnap = await getDoc(serviceRef);
          const serviceName = serviceSnap.exists()
            ? serviceSnap.data().companyName
            : "Service Necunoscut";

          fetchedOffers.push({
            id: docSnap.id,
            ...data,
            serviceName,
            createdAt: data.createdAt?.toDate() || new Date(),
            isNew: !viewedOffers.has(docSnap.id),
          } as Offer);
        }

        fetchedOffers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setOffers(fetchedOffers);
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [user, viewedOffers]);

  const handleAcceptOffer = async (offer: Offer) => {
    if (!user) return;

    try {
      const offerRef = doc(db, "offers", offer.id);
      await updateDoc(offerRef, {
        status: "Accepted",
        updatedAt: new Date(),
      });

      const updatedOffers = offers.map(o => 
        o.id === offer.id ? { ...o, status: "Accepted" } : o
      );
      setOffers(updatedOffers);
    } catch (error) {
      console.error("Error accepting offer:", error);
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

      const updatedOffers = offers.map(o => 
        o.id === offer.id ? { ...o, status: "Rejected" } : o
      );
      setOffers(updatedOffers);
    } catch (error) {
      console.error("Error rejecting offer:", error);
    }
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
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              <div className="p-4 h-[260px] flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm truncate pr-2">{offer.title}</h3>
                    <p className="text-xs text-gray-600 flex items-center mt-1">
                      <Clock className="inline w-3 h-3 mr-1" />
                      {format(offer.createdAt, "dd.MM.yyyy HH:mm")}
                    </p>
                  </div>
                  <Badge
                    className={`ml-2 ${
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

                <div className="flex-1 overflow-hidden">
                  <p className="text-sm text-gray-700 flex items-center mb-2">
                    <User className="w-3 h-3 inline-block mr-1 text-blue-500" />
                    <span className="truncate">{offer.serviceName}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <p className="flex items-center">
                      <Calendar className="w-3 h-3 text-gray-500 mr-1" />
                      <span className="truncate">{offer.availableDate}</span>
                    </p>
                    <p className="flex items-center">
                      <CreditCard className="w-3 h-3 text-gray-500 mr-1" />
                      <span>{offer.price} RON</span>
                    </p>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {offer.details}
                  </p>
                </div>

                <div className="mt-auto pt-3 border-t flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    className="text-blue-500"
                    onClick={() => onMessageService?.(offer.serviceId, offer.requestId)}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Mesaj
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="xs">
                        <Eye className="w-3 h-3 mr-1" />
                        Detalii
                      </Button>
                    </DialogTrigger>
                    <OfferDetailsDialog
                      offer={offer}
                      onAccept={handleAcceptOffer}
                      onReject={handleRejectOffer}
                      onMessage={(serviceId, requestId) => 
                        onMessageService?.(serviceId, requestId)
                      }
                    />
                  </Dialog>

                  {offer.status === "Pending" && (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-green-500"
                        onClick={() => handleAcceptOffer(offer)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Acceptă
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-red-500"
                        onClick={() => handleRejectOffer(offer)}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Respinge
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ReceivedOffers;