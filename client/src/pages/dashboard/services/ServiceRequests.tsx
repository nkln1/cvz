```tsx
import { FC } from "react";
import { ServiceLayout } from "@/components/dashboard/services/ServiceLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface ServiceRequest {
  id: string;
  clientName: string;
  carDetails: string;
  serviceType: string;
  status: "pending" | "offered" | "accepted" | "declined";
  date: string;
}

export const ServiceRequests: FC = () => {
  const { toast } = useToast();
  
  const { data: requests, isLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service/requests"],
  });

  const handleSendOffer = (requestId: string) => {
    toast({
      title: "Ofertă trimisă",
      description: "Oferta a fost trimisă cu succes către client.",
    });
  };

  if (isLoading) {
    return <div>Se încarcă...</div>;
  }

  return (
    <ServiceLayout>
      <Card>
        <CardHeader>
          <CardTitle>Cererile Clienților</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Detalii Mașină</TableHead>
                <TableHead>Tip Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.clientName}</TableCell>
                  <TableCell>{request.carDetails}</TableCell>
                  <TableCell>{request.serviceType}</TableCell>
                  <TableCell>
                    <Badge variant={request.status === 'pending' ? 'secondary' : 'success'}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.date}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Trimite Ofertă
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Trimite o ofertă nouă</DialogTitle>
                        </DialogHeader>
                        {/* Add offer form here */}
                        <div className="space-y-4 py-4">
                          <p>Form implementation coming soon...</p>
                          <Button 
                            onClick={() => handleSendOffer(request.id)}
                          >
                            Trimite Oferta
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ServiceLayout>
  );
};

export default ServiceRequests;
```
