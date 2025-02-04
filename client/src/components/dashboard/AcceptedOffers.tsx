import { useState, useEffect } from "react";
import { collection, query, where, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { Request, Car as CarType } from "@/types/dashboard";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SendHorizontal, Loader2, MessageSquare, Eye, Calendar, FileText, Phone, CreditCard, User } from "lucide-react";
import { generateSlug } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

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
  clientPhone?: string;
  isNew?: boolean;
}

export function AcceptedOffers({ requests, cars, refreshRequests, refreshCounter, onMessageService }: AcceptedOffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const { user } = useAuth();

  const formatDateSafely = (dateValue: any) => {
    if (!dateValue) return "Data necunoscută";
    try {
      const date = dateValue && typeof dateValue.toDate === 'function'
        ? dateValue.toDate()
        : new Date(dateValue);
      return format(date, "dd.MM.yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Data necunoscută";
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
            // Fetch request data
            const requestRef = doc(db, "requests", data.requestId);
            const requestDoc = await getDoc(requestRef);
            const requestData = requestDoc.exists() ? { id: requestDoc.id, ...requestDoc.data() } as Request : null;

            // Fetch client data to get phone number
            let clientPhone;
            if (requestData?.userId) {
              const userRef = doc(db, "users", requestData.userId);
              const userDoc = await getDoc(userRef);
              if (userDoc.exists()) {
                clientPhone = userDoc.data().phone;
              }
            }

            return {
              id: docSnapshot.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              request: requestData,
              clientPhone,
              availableDate: data.availableDate || "Data necunoscută",
              price: data.price || 0,
              status: "Accepted",
              isNew: false
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

  const handleViewDetails = (offer: Offer) => {
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

      <Dialog
        open={!!selectedOffer}
        onOpenChange={(open) => !open && setSelectedOffer(null)}
      >
        <DialogContent className="max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedOffer?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full max-h-[60vh] pr-4">
            <div className="space-y-6 p-2">
              {/* Client Details Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  Detalii client
                </h3>
                <div className="space-y-1 ml-6">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Nume:</span> {selectedOffer?.request?.clientName || 'N/A'}
                  </p>
                  {selectedOffer?.clientPhone && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Telefon:</span> {selectedOffer.clientPhone}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Initial Request Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-500" />
                  Cererea inițială
                </h3>
                <div className="space-y-2 ml-6">
                  {selectedOffer?.request && (
                    <>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Titlu:</span> {selectedOffer.request.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Descriere:</span> {selectedOffer.request.description}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Data preferată:</span> {formatDateSafely(selectedOffer.request.preferredDate)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Offer Details Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Detalii Ofertă Acceptată
                </h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedOffer?.details}
                  </p>

                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">
                          Data Disponibilă
                        </h4>
                        <p className="text-sm text-gray-600">
                          {selectedOffer?.availableDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-green-500" />
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">Preț</h4>
                        <p className="text-sm text-gray-600">{selectedOffer?.price} RON</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedOffer?.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Observații
                  </h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedOffer.notes}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default AcceptedOffers;