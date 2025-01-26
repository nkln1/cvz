import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
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
import { Mail, Lock } from "lucide-react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const formSchema = z.object({
  email: z.string().email({
    message: "Te rugăm să introduci o adresă de email validă.",
  }),
  password: z.string().min(6, {
    message: "Parola trebuie să conțină cel puțin 6 caractere.",
  }),
});

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (user) {
      console.log("User already logged in:", user);
      setLocation("/dashboard");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting to sign in with email/password...");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      console.log("Sign in successful:", userCredential.user.uid);

      toast({
        title: "Success",
        description: "Te-ai conectat cu succes!",
      });

      // Redirect to dashboard after successful login
      setLocation("/dashboard");
    } catch (error: any) {
      console.error("Login Error:", error);
      let errorMessage = "A apărut o eroare la conectare.";

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = "Adresa de email nu este validă.";
          break;
        case 'auth/user-disabled':
          errorMessage = "Acest cont a fost dezactivat.";
          break;
        case 'auth/user-not-found':
          errorMessage = "Nu există niciun cont cu această adresă de email.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Parolă incorectă.";
          break;
      }

      toast({
        variant: "destructive",
        title: "Eroare",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handlePasswordReset = async () => {
    const email = form.getValues("email");
    if (!email) {
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Te rugăm să introduci adresa de email pentru resetarea parolei.",
      });
      return;
    }

    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Email trimis",
        description: "Verifică-ți email-ul pentru instrucțiuni de resetare a parolei.",
      });
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      let errorMessage = "A apărut o eroare la trimiterea email-ului de resetare.";

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = "Adresa de email nu este validă.";
          break;
        case 'auth/user-not-found':
          errorMessage = "Nu există niciun cont cu această adresă de email.";
          break;
      }

      toast({
        variant: "destructive",
        title: "Eroare",
        description: errorMessage,
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (user) {
      console.log("User already logged in:", user);
      setLocation("/dashboard");
      return;
    }

    try {
      console.log("Initiating Google sign in...");
      const result = await signInWithGoogle();
      console.log("Google sign in successful:", result);

      toast({
        title: "Success",
        description: "Te-ai conectat cu succes prin Google!",
      });

      // Redirect to dashboard after successful Google login
      setLocation("/dashboard");
    } catch (error: any) {
      console.error("Google Sign In Error:", error);

      let errorMessage = "A apărut o eroare la conectarea prin Google.";
      if (error.message === 'Popup was blocked by the browser. Please allow popups and try again.') {
        errorMessage = "Te rugăm să permiți popup-urile pentru a continua cu autentificarea Google.";
      }

      toast({
        variant: "destructive",
        title: "Eroare",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 p-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Intră în cont</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      {...field}
                      type="email"
                      placeholder="nume@example.com"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parolă</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      {...field}
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Se încarcă..." : "Conectare"}
          </Button>
        </form>
      </Form>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="link"
          className="text-sm text-[#00aff5] hover:text-[#0099d6]"
          onClick={handlePasswordReset}
          disabled={isSendingReset}
        >
          {isSendingReset ? "Se trimite..." : "Mi-am uitat parola"}
        </Button>
      </div>

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
        Conectare cu Google
      </Button>
    </div>
  );
}