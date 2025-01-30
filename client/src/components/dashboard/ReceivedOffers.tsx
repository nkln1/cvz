import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MailOpen } from "lucide-react";
import { RequestsTable } from "./RequestsTable";
import type { Request, Car } from "@/types/dashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ReceivedOffersProps {
  requests: Request[];
  cars: Car[];
  refreshRequests: () => Promise<void>;
}

export function ReceivedOffers({ requests, cars, refreshRequests }: ReceivedOffersProps) {
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRequests = requests.filter((request) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      request.title?.toLowerCase().includes(searchLower) ||
      request.description?.toLowerCase().includes(searchLower) ||
      request.status?.toLowerCase().includes(searchLower)
    );
  });

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#00aff5] flex items-center gap-2">
            <MailOpen className="h-5 w-5" />
            Oferte Primite
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Afișează:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="10 pe pagină" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 pe pagină</SelectItem>
                  <SelectItem value="20">20 pe pagină</SelectItem>
                  <SelectItem value="50">50 pe pagină</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Caută oferte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-[300px]"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <RequestsTable
          requests={paginatedRequests}
          cars={cars}
          hideDeleteButton={true}
          refreshRequests={refreshRequests}
        />
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "bg-[#00aff5] text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
