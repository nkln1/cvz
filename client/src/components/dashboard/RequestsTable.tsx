import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, ArrowUpDown, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { type Car } from "@/pages/dashboard/CarManagement";
import { Input } from "@/components/ui/input";

interface Request {
  id: string;
  title: string;
  description: string;
  carId: string;
  preferredDate: string;
  createdAt: string;
  county: string;
  cities?: string[]; 
  status: "Active" | "Rezolvat" | "Anulat";
}

interface RequestsTableProps {
  requests: Request[];
  cars: Car[];
  onDelete?: (id: string) => Promise<void>;
  refreshRequests: () => Promise<void>;
  hideDeleteButton?: boolean;
}

type SortField = "createdAt" | "title" | "preferredDate";
type SortOrder = "asc" | "desc";

export function RequestsTable({
  requests,
  cars,
  onDelete,
  refreshRequests,
  hideDeleteButton = false,
}: RequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!onDelete) return;
    try {
      await onDelete(requestId);
      toast({
        title: "Success",
        description: "Cererea a fost anulată cu succes.",
      });
      await refreshRequests();
    } catch (error) {
      console.error("Error canceling request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-a putut anula cererea. Încercați din nou.",
      });
    }
    setShowDeleteDialog(false);
  };

  const getLocationDisplay = (request: Request) => {
    const citiesDisplay = request.cities?.length ? request.cities.join(", ") : "";
    return citiesDisplay ? `${citiesDisplay}, ${request.county}` : request.county;
  };

  const sortedAndFilteredRequests = [...requests]
    .filter(request => {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.title.toLowerCase().includes(searchLower) ||
        request.description.toLowerCase().includes(searchLower) ||
        getLocationDisplay(request).toLowerCase().includes(searchLower) ||
        request.status.toLowerCase().includes(searchLower) ||
        cars.find(car => car.id === request.carId)?.brand.toLowerCase().includes(searchLower) ||
        cars.find(car => car.id === request.carId)?.model.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "createdAt":
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "preferredDate":
          comparison = new Date(b.preferredDate).getTime() - new Date(a.preferredDate).getTime();
          break;
      }
      return sortOrder === "asc" ? -comparison : comparison;
    });

  const totalPages = Math.ceil(sortedAndFilteredRequests.length / itemsPerPage);
  const paginatedRequests = sortedAndFilteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <Input
            placeholder="Caută cereri..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("title")}
                  className="hover:bg-transparent p-0"
                >
                  Titlu
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("createdAt")}
                  className="hover:bg-transparent p-0"
                >
                  Data primirii
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("preferredDate")}
                  className="hover:bg-transparent p-0"
                >
                  Data preferată
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Mașină</TableHead>
              <TableHead>Locație</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRequests.map((request) => (
              <TableRow key={request.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{request.title}</TableCell>
                <TableCell>{format(new Date(request.createdAt), "dd.MM.yyyy HH:mm")}</TableCell>
                <TableCell>{format(new Date(request.preferredDate), "dd.MM.yyyy")}</TableCell>
                <TableCell>
                  {cars.find((car) => car.id === request.carId)?.brand}{" "}
                  {cars.find((car) => car.id === request.carId)?.model}
                </TableCell>
                <TableCell>{getLocationDisplay(request)}</TableCell>
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
                      size="icon"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowViewDialog(true);
                      }}
                      className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!hideDeleteButton && request.status !== "Anulat" && onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDeleteDialog(true);
                        }}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {paginatedRequests.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  {searchTerm ? "Nu s-au găsit rezultate pentru căutarea efectuată." : "Nu există cereri în această categorie."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="flex items-center px-3">
              Pagina {currentPage} din {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Următor
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anulați această cerere?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune nu poate fi anulată. Cererea va fi mutată în categoria "Anulate".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Nu</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && handleDelete(selectedRequest.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Da, anulează cererea
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalii Cerere</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Titlu
                </h3>
                <p>{selectedRequest.title}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Descriere
                </h3>
                <p>{selectedRequest.description}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Mașină
                </h3>
                <p>
                  {cars.find((car) => car.id === selectedRequest.carId)?.brand}{" "}
                  {cars.find((car) => car.id === selectedRequest.carId)?.model}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Data primirii
                </h3>
                <p>{format(new Date(selectedRequest.createdAt), "dd.MM.yyyy HH:mm")}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Data preferată
                </h3>
                <p>
                  {format(new Date(selectedRequest.preferredDate), "dd.MM.yyyy")}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Locație
                </h3>
                <p>{getLocationDisplay(selectedRequest)}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Status
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    selectedRequest.status === "Active"
                      ? "bg-yellow-100 text-yellow-800"
                      : selectedRequest.status === "Rezolvat"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedRequest.status}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}