import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  MailOpen,
  FileText,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MainLayout from "@/components/layout/MainLayout";

// Mock data
const mockRequests = [
  {
    id: "REQ-001",
    date: "2024-01-26",
    status: "În așteptare",
    service: "Schimb ulei",
  },
  {
    id: "REQ-002",
    date: "2024-01-25",
    status: "Acceptat",
    service: "Schimb plăcuțe frână",
  },
];

const mockOffers = [
  {
    id: "OFF-001",
    serviceId: "SRV-001",
    serviceName: "Auto Service Pro",
    price: 250,
    availability: "2024-01-28",
    requestId: "REQ-001",
  },
  {
    id: "OFF-002",
    serviceId: "SRV-002",
    serviceName: "MasterMech Auto",
    price: 280,
    availability: "2024-01-27",
    requestId: "REQ-001",
  },
];

type TabType = "requests" | "offers" | "messages" | "profile";

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("requests");
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case "requests":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Cererile Mele</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Serviciu</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.id}</TableCell>
                      <TableCell>{request.date}</TableCell>
                      <TableCell>{request.service}</TableCell>
                      <TableCell>{request.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case "offers":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Oferte Primite</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {mockOffers.map((offer) => (
                  <Card key={offer.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{offer.serviceName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Pentru cererea: {offer.requestId}
                          </p>
                          <p className="text-sm">
                            Disponibilitate: {offer.availability}
                          </p>
                          <p className="font-medium mt-2">{offer.price} RON</p>
                        </div>
                        <Button>Acceptă Oferta</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "profile":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profilul Meu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p>{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Nume
                  </label>
                  <p>{user?.displayName || "Nespecificat"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "messages":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Mesaje</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Nu există mesaje noi.</p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4 space-y-4">
        {/* Navigation */}
        <nav className="flex gap-2 border-b pb-4">
          <Button
            variant={activeTab === "requests" ? "default" : "ghost"}
            onClick={() => setActiveTab("requests")}
          >
            <FileText className="w-4 h-4 mr-2" />
            Cererile Mele
          </Button>
          <Button
            variant={activeTab === "offers" ? "default" : "ghost"}
            onClick={() => setActiveTab("offers")}
          >
            <MailOpen className="w-4 h-4 mr-2" />
            Oferte Primite
          </Button>
          <Button
            variant={activeTab === "messages" ? "default" : "ghost"}
            onClick={() => setActiveTab("messages")}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Mesaje
          </Button>
          <Button
            variant={activeTab === "profile" ? "default" : "ghost"}
            onClick={() => setActiveTab("profile")}
          >
            <User className="w-4 h-4 mr-2" />
            Cont
          </Button>
        </nav>

        {/* Main Content */}
        {renderContent()}
      </div>
    </MainLayout>
  );
}