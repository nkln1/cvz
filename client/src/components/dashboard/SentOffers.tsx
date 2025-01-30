import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SendHorizontal } from "lucide-react";
import type { Request, Car } from "@/types/dashboard";

interface SentOffersProps {
  requests: Request[];
  cars: Record<string, Car>;
  refreshRequests: () => Promise<void>;
}

export function SentOffers({ requests, cars, refreshRequests }: SentOffersProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <SendHorizontal className="h-5 w-5" />
          Oferte Trimise
        </CardTitle>
        <CardDescription>
          Urmărește și gestionează ofertele trimise către clienți
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-center text-muted-foreground py-4">
          Nu există oferte trimise momentan
        </p>
      </CardContent>
    </Card>
  );
}

export default SentOffers;
