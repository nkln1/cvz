import { format } from "date-fns";
import { Clock, Car, FileText, Calendar, CreditCard, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Car as CarType } from "@/types/dashboard";

interface Offer {
  id: string;
  title: string;
  details: string;
  availableDate: string;
  price: number;
  status: string;
  createdAt: Date;
  request?: any;
  isNew?: boolean;
}

interface OfferBoxProps {
  offer: Offer;
  cars: Record<string, CarType>;
  onViewDetails: (offer: Offer) => void;
}

export function OfferBox({ offer, cars, onViewDetails }: OfferBoxProps) {
  const request = offer.request;
  const car = request ? cars[request.carId] : null;

  return (
    <div className="bg-white rounded-lg border-2 hover:border-[#00aff5]/30 transition-all duration-200 flex flex-col overflow-hidden h-[320px] relative">
      {offer.isNew && (
        <Badge className="absolute -top-2 -right-2 bg-[#00aff5] text-white">
          Nou
        </Badge>
      )}

      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold line-clamp-1 flex-1 mr-2">{offer.title}</h3>
          <Badge
            variant="secondary"
            className={`${
              offer.status === "Pending"
                ? "bg-yellow-100 text-yellow-800"
                : offer.status === "Accepted"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            } ml-2 flex-shrink-0`}
          >
            {offer.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {format(offer.createdAt, "dd.MM.yyyy HH:mm")}
          </span>
          {car && (
            <span className="flex items-center">
              <Car className="w-4 h-4 mr-1" />
              {car.licensePlate}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-hidden flex flex-col min-h-0">
        {request && (
          <div className="bg-gray-50 p-2 rounded-lg mb-3">
            <p className="text-sm font-medium text-gray-600 flex items-center mb-1">
              <FileText className="w-4 h-4 mr-1" />
              Cerere Client
            </p>
            <p className="text-sm line-clamp-1">{request.title}</p>
            {car && (
              <p className="text-xs text-gray-500 mt-1">
                {car.brand} {car.model} ({car.year})
              </p>
            )}
          </div>
        )}

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

      <div className="p-4 border-t mt-auto bg-white">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onViewDetails(offer)}
        >
          <Eye className="w-4 h-4 mr-2" />
          Vezi Detalii Complete
        </Button>
      </div>
    </div>
  );
}

export default OfferBox;