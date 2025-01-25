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
import { Input } from "@/components/ui/input";
import { signInWithGoogle } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, MapPin, Phone, Building } from "lucide-react";
import RoleSelection from "./RoleSelection";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

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
  location: z.string().min(2, {
    message: "Te rugăm să introduci localitatea.",
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
  location: z.string().min(2, {
    message: "Te rugăm să introduci localitatea.",
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

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<UserRole>(null);
  const { toast } = useToast();

  const clientForm = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      location: "",
      password: "",
      confirmPassword: "",
    },
  });

  const serviceForm = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      companyName: "",
      representativeName: "",
      email: "",
      phone: "",
      address: "",
      location: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof clientSchema> | z.infer<typeof serviceSchema>) {
    setIsLoading(true);
    try {
      const { email, password, ...userData } = values;
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store additional user data
      await setDoc(doc(db, role === "client" ? "clients" : "services", user.uid), {
        ...userData,
        email,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Cont creat cu succes!",
      });
    } catch (error) {
      console.error("Error during registration:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "A apărut o eroare la crearea contului. Te rugăm să încerci din nou.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Success",
        description: "Te-ai înregistrat cu succes prin Google!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "A apărut o eroare la înregistrarea prin Google.",
      });
    }
  };

  if (!role) {
    return <RoleSelection onSelect={setRole} />;
  }

  const currentForm = role === "client" ? clientForm : serviceForm;
  const currentSchema = role === "client" ? clientSchema : serviceSchema;

  return (
    <div className="w-full max-w-md space-y-6 p-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">
          {role === "client" ? "Înregistrare Client" : "Înregistrare Service Auto"}
        </h2>
        <p className="text-sm text-gray-500">
          Completează datele pentru a crea un cont nou
        </p>
      </div>

      <Form {...currentForm}>
        <form onSubmit={currentForm.handleSubmit(onSubmit)} className="space-y-4">
          {role === "client" ? (
            // Client Form Fields
            <>
              <FormField
                control={currentForm.control}
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
            </>
          ) : (
            // Service Form Fields
            <>
              <FormField
                control={currentForm.control}
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
                control={currentForm.control}
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
            </>
          )}

          {/* Common Fields */}
          <FormField
            control={currentForm.control}
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
            control={currentForm.control}
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

          {role === "service" && (
            <FormField
              control={currentForm.control}
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
          )}

          <FormField
            control={currentForm.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localitate</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input {...field} placeholder="București" className="pl-10" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={currentForm.control}
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
            control={currentForm.control}
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Se încarcă..." : "Creează cont"}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Sau continuă cu</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="mr-2 h-4 w-4"
        />
        Înregistrare cu Google
      </Button>

      <Button
        type="button"
        variant="link"
        className="w-full"
        onClick={() => setRole(null)}
        disabled={isLoading}
      >
        Schimbă tipul de cont
      </Button>
    </div>
  );
}