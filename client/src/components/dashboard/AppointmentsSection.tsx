import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export function AppointmentsSection() {
  return (
    <Card className="border-[#00aff5]/20">
      <CardHeader>
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Programări
        </CardTitle>
        <CardDescription>
          Gestionează programările și disponibilitatea serviciului
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Calendar și programări vor apărea aici
        </p>
      </CardContent>
    </Card>
  );
}
