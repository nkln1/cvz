import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, MapPin, Phone, Building, ArrowLeft } from "lucide-react";
import RoleSelection from "./RoleSelection";
import { useLocation } from "wouter";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { romanianCounties, getCitiesForCounty } from "@/lib/romaniaData";

const clientSchema = z.object({
  name: z.string().min(2, {
    message: "Numele trebuie să conțină cel puțin 2 caractere.",
  }),
  email: z.string().email({
    message: "Te rugăm să introduci o adresă de email validă.",
  }),
  phone: z.string().min(10, {
    message: "Te rugăm să introduci un număr de telefon valid.",
  }),
  county: z.string().min(1, {
    message: "Te rugăm să selectezi județul.",
  }),
  city: z.string().min(1, {
    message: "Te rugăm să selectezi localitatea.",
  }),
  password: z.string().min(6, {
    message: "Parola trebuie să conțină cel puțin 6 caractere.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Parolele nu coincid",
  path: ["confirmPassword"],
});

const serviceSchema = z.object({
  companyName: z.string().min(2, {
    message: "Numele companiei trebuie să conțină cel puțin 2 caractere.",
  }),
  representativeName: z.string().min(2, {
    message: "Numele reprezentantului trebuie să conțină cel puțin 2 caractere.",
  }),
  email: z.string().email({
    message: "Te rugăm să introduci o adresă de email validă.",
  }),
  phone: z.string().min(10, {
    message: "Te rugăm să introduci un număr de telefon valid.",
  }),
  address: z.string().min(5, {
    message: "Te rugăm să introduci adresa completă.",
  }),
  county: z.string().min(1, {
    message: "Te rugăm să selectezi județul.",
  }),
  city: z.string().min(1, {
    message: "Te rugăm să selectezi localitatea.",
  }),
  password: z.string().min(6, {
    message: "Parola trebuie să conțină cel puțin 6 caractere.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Parolele nu coincid",
  path: ["confirmPassword"],
});

type UserRole = "client" | "service" | null;
type ClientFormData = z.infer<typeof clientSchema>;
type ServiceFormData = z.infer<typeof serviceSchema>;

export default function SignupForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<UserRole>(null);
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const clientForm = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      county: "",
      city: "",
      password: "",
      confirmPassword: "",
    },
  });

  const serviceForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      companyName: "",
      representativeName: "",
      email: "",
      phone: "",
      address: "",
      county: "",
      city: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ClientFormData | ServiceFormData) {
    setIsLoading(true);
    try {
      // Create Firebase auth user
      const { email, password, confirmPassword, ...userData } = values;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store additional user data in Firestore
      const collectionName = role === 'client' ? 'clients' : 'services';
      await setDoc(doc(db, collectionName, user.uid), {
        ...userData,
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Send verification email
      await sendEmailVerification(user);

      toast({
        title: "Success",
        description: "Cont creat cu succes! Te rugăm să verifici email-ul pentru a confirma adresa.",
      });

      // Handle success callback and navigation
      onSuccess?.();
      setLocation("/verify-email");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: error.code === 'auth/email-already-in-use'
          ? "Această adresă de email este deja folosită."
          : "A apărut o eroare la crearea contului.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!role) {
    return <RoleSelection onSelect={setRole} />;
  }

  return (
    <div className="w-full max-w-4xl space-y-6 p-6 bg-white rounded-lg shadow-lg relative max-h-[80vh] overflow-y-auto">
      <Button
        variant="ghost"
        className="absolute left-4 top-4 p-0 text-[#00aff5]"
        onClick={() => setRole(null)}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-[#00aff5]">
          {role === "client" ? "Înregistrare Client" : "Înregistrare Service Auto"}
        </h2>
      </div>

      {role === "client" ? (
        <Form {...clientForm}>
          <form onSubmit={clientForm.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={clientForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume și Prenume</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} placeholder="Ion Popescu" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={clientForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} type="email" placeholder="email@example.com" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={clientForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} placeholder="0712 345 678" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={clientForm.control}
                name="county"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Județ</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCounty(value);
                        clientForm.setValue("city", "");
                      }}
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
                control={clientForm.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localitate</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
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

              <FormField
                control={clientForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parolă</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} type="password" placeholder="••••••••" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={clientForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmă Parola</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} type="password" placeholder="••••••••" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col items-center space-y-4 pt-4">
              <Button
                type="submit"
                className="w-full max-w-md bg-[#00aff5] hover:bg-[#0099d6]"
                disabled={isLoading}
              >
                {isLoading ? "Se încarcă..." : "Creează cont"}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <Form {...serviceForm}>
          <form onSubmit={serviceForm.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={serviceForm.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numele Service-ului</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} placeholder="Auto Service SRL" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={serviceForm.control}
                name="representativeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume Reprezentant</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} placeholder="Ion Popescu" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={serviceForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} type="email" placeholder="email@example.com" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={serviceForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} placeholder="0712 345 678" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={serviceForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresă</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} placeholder="Strada, Număr" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={serviceForm.control}
                name="county"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Județ</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCounty(value);
                        serviceForm.setValue("city", "");
                      }}
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
                control={serviceForm.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localitate</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
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

              <FormField
                control={serviceForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parolă</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} type="password" placeholder="••••••••" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={serviceForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmă Parola</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} type="password" placeholder="••••••••" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col items-center space-y-4 pt-4">
              <Button
                type="submit"
                className="w-full max-w-md bg-[#00aff5] hover:bg-[#0099d6]"
                disabled={isLoading}
              >
                {isLoading ? "Se încarcă..." : "Creează cont"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}