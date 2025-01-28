import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Car, Trash2, ArrowLeft } from "lucide-react";
import { CarForm } from "@/components/dashboard/CarForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  vin?: string;
  mileage: number;
}

interface CarManagementProps {
  isDialog?: boolean;
  onBackClick?: () => void;
}

export default function CarManagement({ isDialog, onBackClick }: CarManagementProps) {
  const [cars, setCars] = useState<Car[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      console.log("No user found, skipping car load");
      setIsLoading(false);
      return;
    }

    const loadCars = async () => {
      try {
        console.log("Loading cars for user:", user.uid);
        console.log("User auth state:", {
          isAuthenticated: !!user,
          uid: user.uid,
          email: user.email
        });

        const carsQuery = query(
          collection(db, "cars"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(carsQuery);
        const loadedCars: Car[] = [];
        querySnapshot.forEach((doc) => {
          loadedCars.push({ id: doc.id, ...doc.data() } as Car);
        });
        console.log("Successfully loaded cars:", loadedCars);
        setCars(loadedCars);
      } catch (error) {
        console.error("Error loading cars:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Nu s-au putut încărca mașinile. Te rugăm să încerci din nou.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCars();
  }, [user, toast]);

  const handleAddCar = async (car: Omit<Car, "id">) => {
    if (!user) {
      console.error("No authenticated user found");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Trebuie să fiți autentificat pentru a adăuga o mașină.",
      });
      return;
    }

    try {
      console.log("Attempting to add car:", car);
      console.log("Current user:", {
        uid: user.uid,
        email: user.email,
        isAuthenticated: !!user
      });

      const carData = {
        ...car,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };

      console.log("Preparing to add car with data:", carData);
      const docRef = await addDoc(collection(db, "cars"), carData);
      console.log("Successfully added car with ID:", docRef.id);

      const newCar = {
        ...car,
        id: docRef.id,
      };

      setCars((prev) => [...prev, newCar]);
      setIsOpen(false);

      toast({
        title: "Success",
        description: "Mașina a fost adăugată cu succes!",
      });
    } catch (error: any) {
      console.error("Detailed error adding car:", {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        stack: error.stack
      });

      let errorMessage = "Nu s-a putut adăuga mașina. ";
      if (error.code === "permission-denied") {
        errorMessage += "Nu aveți permisiunea necesară.";
      } else if (error.code === "unavailable") {
        errorMessage += "Serviciul este momentan indisponibil.";
      } else {
        errorMessage += "Te rugăm să încerci din nou.";
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  const handleEditCar = async (car: Omit<Car, "id">) => {
    if (!user || !editingCar) return;

    try {
      console.log("Attempting to update car:", editingCar.id);
      const carRef = doc(db, "cars", editingCar.id);
      await updateDoc(carRef, {
        ...car,
        updatedAt: new Date().toISOString(),
      });
      console.log("Successfully updated car");

      setCars((prev) =>
        prev.map((c) =>
          c.id === editingCar.id ? { ...car, id: editingCar.id } : c
        )
      );

      setEditingCar(undefined);
      setIsOpen(false);

      toast({
        title: "Success",
        description: "Mașina a fost actualizată cu succes!",
      });
    } catch (error) {
      console.error("Error updating car:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-a putut actualiza mașina. Te rugăm să încerci din nou.",
      });
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!user) return;

    try {
      console.log("Attempting to delete car:", carId);
      const carRef = doc(db, "cars", carId);
      await deleteDoc(carRef);
      console.log("Successfully deleted car");

      setCars((prev) => prev.filter((c) => c.id !== carId));

      toast({
        title: "Success",
        description: "Mașina a fost ștearsă cu succes!",
      });
    } catch (error) {
      console.error("Error deleting car:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-a putut șterge mașina. Te rugăm să încerci din nou.",
      });
    }
  };

  const startEditing = (car: Car) => {
    setEditingCar(car);
    setIsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-gray-500">Se încarcă...</div>
      </div>
    );
  }

  const content = (
    <div className="space-y-4">
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingCar(undefined);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button className="mb-4">
            <Plus className="mr-2 h-4 w-4" />
            Adaugă mașină
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCar ? "Editează mașina" : "Adaugă o mașină nouă"}
            </DialogTitle>
          </DialogHeader>
          <CarForm 
            onSubmit={editingCar ? handleEditCar : handleAddCar} 
            onCancel={() => {
              setIsOpen(false);
              setEditingCar(undefined);
            }}
            initialData={editingCar}
          />
        </DialogContent>
      </Dialog>

      <ScrollArea className="h-[400px] pr-4">
        <div className="grid gap-4 md:grid-cols-2">
          {cars.map((car) => (
            <Card key={car.id}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{car.brand} {car.model}</h3>
                      <p className="text-sm text-muted-foreground">
                        An fabricație: {car.year}
                      </p>
                    </div>
                    {!isDialog && (
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => startEditing(car)}
                          className="w-full"
                        >
                          Editează
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCar(car.id)}
                          className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Șterge
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="text-sm">
                    <p>Tip carburant: {car.fuelType}</p>
                    <p>Kilometraj: {car.mileage} km</p>
                    {car.vin && <p>Serie șasiu: {car.vin}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  if (isDialog) {
    return (
      <div className="space-y-4">
        <div className="sticky top-0 z-10 bg-white pb-4 mb-4 border-b">
          {onBackClick && (
            <Button
              variant="ghost"
              onClick={onBackClick}
              className="flex items-center text-[#00aff5] hover:text-[#0099d6] hover:bg-[#e6f7ff]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Înapoi la cerere
            </Button>
          )}
        </div>
        <div className="px-4">
          {content}
        </div>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <Car className="h-5 w-5" />
          Mașina Mea
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {content}
      </CardContent>
    </Card>
  );
}