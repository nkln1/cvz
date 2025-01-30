import { Fragment, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Eye,
  MessageSquare,
  SendHorizontal,
  X,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import type { Request, Car, User } from "@/types/dashboard";

interface ClientRequestsProps {
  clientRequests: Request[];
  viewedRequests: Set<string>;
  onViewDetails: (request: Request) => void;
  onMessage: (request: Request) => void;
  onSendOffer: (request: Request) => void;
  onRejectRequest: (requestId: string) => void;
  selectedRequest: Request | null;
  requestClient: User | null;
  cars: Record<string, Car>;
}

export function ClientRequests({
  clientRequests,
  viewedRequests,
  onViewDetails,
  onMessage,
  onSendOffer,
  onRejectRequest,
  selectedRequest,
  requestClient,
  cars,
}: ClientRequestsProps) {
  const [sortField, setSortField] = useState<keyof Request>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredRequests = clientRequests.filter((request) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      (request.title?.toLowerCase() || "").includes(searchLower) ||
      (request.description?.toLowerCase() || "").includes(searchLower) ||
      (request.county?.toLowerCase() || "").includes(searchLower) ||
      (request.cities || []).some((city) =>
        (city?.toLowerCase() || "").includes(searchLower)
      ) ||
      (request.status?.toLowerCase() || "").includes(searchLower) ||
      (request.clientName?.toLowerCase() || "").includes(searchLower) ||
      (request.preferredDate &&
        format(new Date(request.preferredDate), "dd.MM.yyyy").includes(
          searchQuery
        )) ||
      (request.createdAt &&
        format(new Date(request.createdAt), "dd.MM.yyyy").includes(searchQuery))
    );
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const modifier = sortDirection === "asc" ? 1 : -1;

    if (typeof aValue === "string" && typeof bValue === "string") {
      return aValue.localeCompare(bValue) * modifier;
    }
    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * modifier;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = sortedRequests.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <Card className="border-[#00aff5]/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[#00aff5] flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cererile Clienților
            </CardTitle>
            {clientRequests.filter((req) => !viewedRequests.has(req.id)).length >
              0 && (
              <Badge
                variant="secondary"
                className="bg-[#00aff5] text-white text-lg font-bold px-3 py-1"
              >
                {
                  clientRequests.filter((req) => !viewedRequests.has(req.id))
                    .length
                }
              </Badge>
            )}
          </div>
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
              placeholder="Caută cereri..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-[300px]"
            />
          </div>
        </div>
        <CardDescription>
          Vezi și gestionează toate cererile primite de la clienți
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] overflow-y-auto pr-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Titlu</TableHead>
                <TableHead>
                  <button
                    onClick={() => {
                      setSortField("createdAt");
                      setSortDirection((prev) =>
                        prev === "asc" ? "desc" : "asc"
                      );
                    }}
                    className="flex items-center hover:text-[#00aff5]"
                  >
                    Data primirii
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => {
                      setSortField("preferredDate");
                      setSortDirection((prev) =>
                        prev === "asc" ? "desc" : "asc"
                      );
                    }}
                    className="flex items-center hover:text-[#00aff5]"
                  >
                    Data preferată
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead>Județ</TableHead>
                <TableHead>Localități</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr:not(:last-child)]:mb-2">
              {paginatedRequests.map((request) => (
                <Fragment key={request.id}>
                  <TableRow className="hover:bg-blue-50/80 transition-colors relative mb-2">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {!viewedRequests.has(request.id) && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            NEW
                          </span>
                        )}
                        <span
                          className={
                            !viewedRequests.has(request.id) ? "font-bold" : ""
                          }
                        >
                          {request.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.createdAt), "dd.MM.yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.preferredDate), "dd.MM.yyyy")}
                    </TableCell>
                    <TableCell>{request.county}</TableCell>
                    <TableCell>{request.cities.join(", ")}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          request.status === "Active"
                            ? "bg-yellow-100 text-yellow-800"
                            : request.status === "Rezolvat"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {request.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(request)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Detalii
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMessage(request)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Mesaj
                        </Button>
                        {request.status === "Active" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSendOffer(request)}
                              className="text-green-500 hover:text-green-700 hover:bg-green-50 flex items-center gap-1"
                            >
                              <SendHorizontal className="h-4 w-4" />
                              Trimite ofertă
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRejectRequest(request.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center gap-1"
                            >
                              <X className="h-4 w-4" />
                              Respinge
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {selectedRequest?.id === request.id && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="p-0">
                        <div className="bg-gray-50 p-4 border-t border-b">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <h3 className="text-xs font-medium text-muted-foreground">
                                Client
                              </h3>
                              <p className="text-sm mt-1">
                                {request.clientName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {requestClient?.email}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-xs font-medium text-muted-foreground">
                                Mașină
                              </h3>
                              <p className="text-sm mt-1">
                                {cars[request.carId] ? (
                                  <>
                                    {cars[request.carId].brand}{" "}
                                    {cars[request.carId].model} (
                                    {cars[request.carId].year})
                                    {cars[request.carId].licensePlate && (
                                      <span className="text-xs text-muted-foreground ml-1">
                                        Nr. {cars[request.carId].licensePlate}
                                      </span>
                                    )}
                                    {cars[request.carId].vin && (
                                      <span className="block text-xs text-muted-foreground">
                                        VIN: {cars[request.carId].vin}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  "Detalii indisponibile"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-xs font-medium text-muted-foreground">
                                Data preferată
                              </h3>
                              <p className="text-sm mt-1">
                                {format(
                                  new Date(request.preferredDate),
                                  "dd.MM.yyyy"
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default ClientRequests;
