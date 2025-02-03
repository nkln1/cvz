
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import type { Offer, Car as CarType } from "@/types/dashboard";

interface OfferDetailsProps {
  offer: Offer | null;
  cars: Record<string, CarType>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfferDetails({ offer, cars, open, onOpenChange }: OfferDetailsProps) {
  if (!offer) return null;

  const request = offer.request;
  const car = request ? cars[request.carId] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{offer.title}</DialogTitle>
          <DialogDescription>
            Vezi detaliile complete ale ofertei și cererea asociată
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[60vh]">
          <div className="space-y-6 p-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Cererea Inițială
              </h4>
              {request ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Titlu Cerere:</p>
                    <p className="text-sm">{request.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Descriere:</p>
                    <p className="text-sm whitespace-pre-wrap">{request.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data Preferată:</p>
                    <p className="text-sm">{format(new Date(request.preferredDate), "dd.MM.yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Locație:</p>
                    <p className="text-sm">{request.county} - {request.cities.join(", ")}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Detaliile cererii nu mai sunt disponibile.</p>
              )}
            </div>

            <Separator className="my-4" />

            <div>
              <h4 className="text-sm font-medium mb-2">Detalii Ofertă</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{offer.details}</p>
            </div>

            {request && (
              <div>
                <h4 className="text-sm font-medium mb-2">Client</h4>
                <p className="text-sm text-muted-foreground">{request.clientName}</p>
              </div>
            )}

            {car && (
              <div>
                <h4 className="text-sm font-medium mb-2">Mașină</h4>
                <p className="text-sm text-muted-foreground">
                  {car.brand} {car.model} ({car.year})
                  {car.licensePlate && (
                    <span className="block text-xs">Nr. {car.licensePlate}</span>
                  )}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Data Disponibilă</h4>
                <p className="text-sm text-muted-foreground">{offer.availableDate}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Preț</h4>
                <p className="text-sm text-muted-foreground">{offer.price} RON</p>
              </div>
            </div>

            {offer.notes && (
              <div>
                <h4 className="text-sm font-medium mb-2">Observații</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{offer.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
