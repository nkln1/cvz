import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { CarForm } from "@/components/dashboard/CarForm";
import { Card, CardContent } from "@/components/ui/card";

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  vin?: string;
  mileage: number;
}

export default function CarManagement() {
  const [cars, setCars] = useState<Car[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | undefined>();

  const handleAddCar = (car: Omit<Car, "id">) => {
    const newCar = {
      ...car,
      id: crypto.randomUUID(),
    };
    setCars((prev) => [...prev, newCar]);
    setIsOpen(false);
  };

  const handleEditCar = (car: Omit<Car, "id">) => {
    if (editingCar) {
      setCars((prev) =>
        prev.map((c) =>
          c.id === editingCar.id ? { ...car, id: editingCar.id } : c
        )
      );
      setEditingCar(undefined);
    }
    setIsOpen(false);
  };

  const startEditing = (car: Car) => {
    setEditingCar(car);
    setIsOpen(true);
  };

  return (
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => startEditing(car)}
                  >
                    Editează
                  </Button>
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
    </div>
  );
}