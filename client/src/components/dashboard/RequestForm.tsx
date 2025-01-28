import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Car, Plus } from "lucide-react";
import { romanianCounties, getCitiesForCounty } from "@/lib/romaniaData";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import type { Car as CarType } from "@/pages/dashboard/CarManagement";

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Titlul trebuie să conțină cel puțin 3 caractere.",
  }),
  description: z.string().min(10, {
    message: "Descrierea trebuie să conțină cel puțin 10 caractere.",
  }),
  carId: z.string({
    required_error: "Te rugăm să selectezi o mașină.",
  }),
  preferredDate: z.string().min(1, {
    message: "Te rugăm să selectezi o dată preferată.",
  }),
  county: z.string().min(1, {
    message: "Te rugăm să selectezi județul.",
  }),
  city: z.string().min(1, {
    message: "Te rugăm să selectezi localitatea.",
  }),
});

interface RequestFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
  onAddCar: () => void;
  isVisible?: boolean;
}

export function RequestForm({ onSubmit, onCancel, onAddCar, isVisible = true }: RequestFormProps) {
  const [cars, setCars] = useState<CarType[]>([]);
  const { user } = useAuth();
  const [selectedCounty, setSelectedCounty] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      carId: "",
      preferredDate: "",
      county: "",
      city: "",
    },
  });

  const loadCars = async () => {
    if (!user) return;

    try {
      const carsQuery = query(
        collection(db, "cars"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(carsQuery);
      const loadedCars: CarType[] = [];
      querySnapshot.forEach((doc) => {
        loadedCars.push({ id: doc.id, ...doc.data() } as CarType);
      });
      setCars(loadedCars);
    } catch (error) {
      console.error("Error loading cars:", error);
    }
  };

  // Load cars when component mounts or becomes visible.  Reload when isVisible changes to true.
  useEffect(() => {
    if (isVisible) {
      loadCars();
    }
  }, [user, isVisible]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titlu cerere</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Revizie anuală" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descriere cerere</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ex: Doresc oferta de preț revizie anuală pentru o MAZDA CX5 din 2020."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selectare mașină</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selectează mașina" />
                        </SelectTrigger>
                        <SelectContent>
                          {cars.map((car) => (
                            <SelectItem key={car.id} value={car.id}>
                              {car.brand} {car.model} ({car.year})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onAddCar}
                      className="whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adaugă mașină
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data preferată</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="county"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Județ</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedCounty(value);
                      form.setValue("city", "");
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează județul" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {romanianCounties.map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localitate</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedCounty}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează localitatea" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedCounty &&
                        getCitiesForCounty(selectedCounty).map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Anulează
          </Button>
          <Button type="submit">Trimite cererea</Button>
        </div>
      </form>
    </Form>
  );
}