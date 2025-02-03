
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import type { Offer, Car as CarType } from "@/types/dashboard";
import { OfferBox } from "./OfferBox";

interface OfferListProps {
  offers: Offer[];
  cars: Record<string, CarType>;
  onViewDetails: (offer: Offer) => void;
}

export function OfferList({ offers, cars, onViewDetails }: OfferListProps) {
  if (offers.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        Nu există oferte
      </p>
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
