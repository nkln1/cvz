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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Car } from "@/pages/dashboard/CarManagement";

const currentYear = new Date().getFullYear();

const carFormSchema = z.object({
  brand: z.string().min(1, "Marca mașinii este obligatorie"),
  model: z.string().min(1, "Modelul mașinii este obligatoriu"),
  year: z.number()
    .int()
    .min(1900, "Anul trebuie să fie după 1900")
    .max(currentYear, `Anul trebuie să fie până în ${currentYear}`),
  fuelType: z.enum(["Benzină", "Motorină", "Hibrid", "Electric"], {
    required_error: "Selectează tipul de carburant",
  }),
  vin: z.string().optional(),
  mileage: z.number().min(0, "Kilometrajul nu poate fi negativ"),
});

type CarFormValues = z.infer<typeof carFormSchema>;

interface CarFormProps {
  onSubmit: (data: Omit<Car, "id">) => void;
  onCancel: () => void;
  initialData?: Partial<Car>;
}

export function CarForm({ onSubmit, onCancel, initialData }: CarFormProps) {
  const form = useForm<CarFormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      brand: initialData?.brand || "",
      model: initialData?.model || "",
      year: initialData?.year || currentYear,
      fuelType: initialData?.fuelType as any || undefined,
      vin: initialData?.vin || "",
      mileage: initialData?.mileage || 0,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca mașinii</FormLabel>
              <FormControl>
                <Input placeholder="ex: Volkswagen" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modelul mașinii</FormLabel>
              <FormControl>
                <Input placeholder="ex: Golf" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>An fabricație</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fuelType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tip carburant</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează tipul de carburant" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Benzină">Benzină</SelectItem>
                  <SelectItem value="Motorină">Motorină</SelectItem>
                  <SelectItem value="Hibrid">Hibrid</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serie șasiu (VIN)</FormLabel>
              <FormControl>
                <Input placeholder="Optional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mileage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kilometraj actual</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Anulează
          </Button>
          <Button type="submit">Salvează mașina</Button>
        </div>
      </form>
    </Form>
  );
}
