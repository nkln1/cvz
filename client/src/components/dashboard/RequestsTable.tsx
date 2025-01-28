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
import { Eye, Trash2 } from "lucide-react";
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
  city: string;
  status: "Active" | "Rezolvat" | "Anulat";
}

interface RequestsTableProps {
  requests: Request[];
  cars: Car[];
  onDelete: (id: string) => Promise<void>;
  refreshRequests: () => Promise<void>;
}

export function RequestsTable({
  requests,
  cars,
  onDelete,
  refreshRequests,
}: RequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const { toast } = useToast();

  const handleDelete = async (requestId: string) => {
    try {
      await onDelete(requestId);
      toast({
        title: "Success",
        description: "Cererea a fost ștearsă cu succes.",
      });
      await refreshRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-a putut șterge cererea. Încercați din nou.",
      });
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titlu</TableHead>
            <TableHead>Mașină</TableHead>
            <TableHead>Data preferată</TableHead>
            <TableHead>Locație</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">{request.title}</TableCell>
              <TableCell>
                {cars.find((car) => car.id === request.carId)?.brand}{" "}
                {cars.find((car) => car.id === request.carId)?.model}
              </TableCell>
              <TableCell>
                {format(new Date(request.preferredDate), "dd.MM.yyyy")}
              </TableCell>
              <TableCell>{`${request.city}, ${request.county}`}</TableCell>
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
                </div>
              </TableCell>
            </TableRow>
          ))}
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Nu există cereri în această categorie.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergeți această cerere?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune nu poate fi anulată. Cererea va fi ștearsă
              permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && handleDelete(selectedRequest.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Șterge
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
                  Data preferată
                </h3>
                <p>
                  {format(
                    new Date(selectedRequest.preferredDate),
                    "dd.MM.yyyy"
                  )}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  Locație
                </h3>
                <p>{selectedRequest.city}, {selectedRequest.county}</p>
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
