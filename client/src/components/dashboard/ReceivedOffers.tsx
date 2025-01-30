import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SendHorizontal } from "lucide-react";

export function ReceivedOffers() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <SendHorizontal className="h-5 w-5" />
          Oferte Primite
        </CardTitle>
        <CardDescription>
          Urmărește și gestionează ofertele primite de la service-uri auto din
          zona selectată
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-center text-muted-foreground py-4">
          Nu există oferte primite momentan
        </p>
      </CardContent>
    </Card>
  );
}
