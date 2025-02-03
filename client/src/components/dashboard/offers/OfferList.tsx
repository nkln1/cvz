
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import type { Offer, Car as CarType } from "@/types/dashboard";
import { OfferBox } from "./OfferBox";

interface OfferListProps {
  offers: Offer[];
  status: "pending" | "accepted" | "rejected";
  cars: Record<string, CarType>;
  onViewDetails: (offer: Offer) => void;
}

export function OfferList({ offers, status, cars, onViewDetails }: OfferListProps) {
  const filteredOffers = offers.filter(offer => offer.status === status);

  if (filteredOffers.length === 0) {
    return (
      <TabsContent value={status}>
        <p className="text-center text-muted-foreground py-4">
          {`Nu există oferte ${status === "pending" ? "în așteptare" : status === "accepted" ? "acceptate" : "respinse"}`}
        </p>
      </TabsContent>
    );
  }

  return (
    <TabsContent value={status}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOffers.map(offer => (
          <div key={offer.id}>
            <OfferBox offer={offer} cars={cars} onViewDetails={onViewDetails} />
          </div>
        ))}
      </div>
    </TabsContent>
  );
}
