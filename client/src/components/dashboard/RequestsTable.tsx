import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
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

interface Request {
  id: string;
  title: string;
  description: string;
  carId: string;
  preferredDate: string;
  county: string;
  cities?: string[];
  status: "Active" | "Rezolvat" | "Anulat";
  createdAt: string; // Added createdAt field
}

interface RequestsTableProps {
  requests: Request[];
  cars: Car[];
  onDelete?: (id: string) => Promise<void>;
  refreshRequests: () => Promise<void>;
  hideDeleteButton?: boolean;
}

type SortDirection = 'asc' | 'desc';

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
  const [sortedRequests, setSortedRequests] = useState<Request[]>([]);
  const [sortConfig, setSortConfig] = useState<{ field: keyof Request; direction: SortDirection }>({
    field: 'createdAt',
    direction: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    let filteredRequests = [...requests];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredRequests = filteredRequests.filter(request => 
        request.title.toLowerCase().includes(searchLower) ||
        request.description.toLowerCase().includes(searchLower) ||
        request.county.toLowerCase().includes(searchLower) ||
        (request.cities?.join(', ').toLowerCase().includes(searchLower)) ||
        request.status.toLowerCase().includes(searchLower) ||
        cars.find(car => car.id === request.carId)?.brand.toLowerCase().includes(searchLower) ||
        cars.find(car => car.id === request.carId)?.model.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filteredRequests.sort((a, b) => {
      if (sortConfig.field === 'createdAt' || sortConfig.field === 'preferredDate') {
        const dateA = new Date(a[sortConfig.field]);
        const dateB = new Date(b[sortConfig.field]);
        return sortConfig.direction === 'asc' 
          ? dateA.getTime() - dateB.getTime() 
          : dateB.getTime() - dateA.getTime();
      }

      const valueA = String(a[sortConfig.field]).toLowerCase();
      const valueB = String(b[sortConfig.field]).toLowerCase();

      return sortConfig.direction === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });

    setSortedRequests(filteredRequests);
  }, [requests, sortConfig, searchTerm, cars]);

  const handleSort = (field: keyof Request) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'desc' ? 'asc' : 'desc'
    }));
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

  return (
    <>
      <div className="flex justify-end mb-4">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută cereri..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
              Titlu
              <ArrowUpDown className="ml-1 h-4 w-4 inline" />
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
              Data primirii
              <ArrowUpDown className="ml-1 h-4 w-4 inline" />
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('preferredDate')}>
              Data preferată
              <ArrowUpDown className="ml-1 h-4 w-4 inline" />
            </TableHead>
            <TableHead>Mașină</TableHead>
            <TableHead>Locație</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRequests.map((request) => (
            <TableRow key={request.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">{request.title}</TableCell>
              <TableCell>
                {format(new Date(request.createdAt), "dd.MM.yyyy HH:mm")}
              </TableCell>
              <TableCell>
                {format(new Date(request.preferredDate), "dd.MM.yyyy")}
              </TableCell>
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
          {sortedRequests.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground"
              >
                {searchTerm ? "Nu s-au găsit cereri care să corespundă căutării." : "Nu există cereri în această categorie."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
                  Data primirii
                </h3>
                <p>
                  {format(new Date(selectedRequest.createdAt), "dd.MM.yyyy HH:mm")}
                </p>
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