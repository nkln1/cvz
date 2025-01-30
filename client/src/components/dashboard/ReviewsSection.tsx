import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

export function ReviewsSection() {
  return (
    <Card className="border-[#00aff5]/20">
      <CardHeader>
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <Star className="h-5 w-5" />
          Recenzii
        </CardTitle>
        <CardDescription>
          Vezi și răspunde la recenziile primite de la clienți
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Lista recenziilor va apărea aici
        </p>
      </CardContent>
    </Card>
  );
}
