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
import { Mail, Lock, User, MapPin, Phone, Building, ArrowLeft } from "lucide-react";
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
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

      <Form {...currentForm}>
        <form onSubmit={currentForm.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {role === "client" ? (
              <FormField
                control={currentForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#00aff5]">Nume și Prenume</FormLabel>
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
            ) : (
              <>
                <FormField
                  control={currentForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#00aff5]">Numele Service-ului</FormLabel>
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
                      <FormLabel className="text-[#00aff5]">Nume Reprezentant</FormLabel>
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

            <FormField
              control={currentForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#00aff5]">Email</FormLabel>
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
                  <FormLabel className="text-[#00aff5]">Telefon</FormLabel>
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
                    <FormLabel className="text-[#00aff5]">Adresă</FormLabel>
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
                  <FormLabel className="text-[#00aff5]">Localitate</FormLabel>
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
                  <FormLabel className="text-[#00aff5]">Parolă</FormLabel>
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
                  <FormLabel className="text-[#00aff5]">Confirmă Parola</FormLabel>
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
            <Button type="submit" className="w-full max-w-md bg-[#00aff5] hover:bg-[#0099d6]" disabled={isLoading}>
              {isLoading ? "Se încarcă..." : "Creează cont"}
            </Button>

            <div className="relative w-full max-w-md">
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
              className="w-full max-w-md"
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
          </div>
        </form>
      </Form>
    </div>
  );
}