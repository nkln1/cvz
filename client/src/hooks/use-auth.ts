import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  emailVerified: boolean;
  role: "client" | "service";
}

interface AuthResponse {
  user: User;
  message: string;
}

interface AuthError {
  error: true;
  message: string;
}

async function handleAuthRequest(
  url: string,
  method: string,
  body?: Record<string, any>
): Promise<AuthResponse | AuthError> {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    // Handle specific error cases
    if (response.status === 401 || response.status === 400) {
      return { error: true, message: "Email sau parolă incorecte" };
    }
    return { error: true, message: "A apărut o eroare. Vă rugăm încercați din nou." };
  }

  return response.json();
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/user", {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          return null;
        }

        return response.json();
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
  });

  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const result = await handleAuthRequest("/api/login", "POST", credentials);
      if ('error' in result) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data.user);
      toast({
        title: "Success",
        description: "Te-ai conectat cu succes!",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Eroare de autentificare",
        description: error.message,
      });
    },
  });

  const register = useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      role: "client" | "service";
      name?: string;
      companyName?: string;
      representativeName?: string;
      phone?: string;
      address?: string;
      county?: string;
      city?: string;
    }) => {
      const result = await handleAuthRequest("/api/register", "POST", userData);
      if ('error' in result) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data.user);
      toast({
        title: "Success",
        description: "Cont creat cu succes! Te rugăm să verifici email-ul pentru confirmare.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Eroare la înregistrare",
        description: error.message || "A apărut o eroare la crearea contului.",
      });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      const result = await handleAuthRequest("/api/logout", "POST");
      if ('error' in result) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
      toast({
        title: "Success",
        description: "Te-ai deconectat cu succes!",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Eroare",
        description: error.message || "A apărut o eroare la deconectare.",
      });
    },
  });

  const resendVerification = useMutation({
    mutationFn: async () => {
      const result = await handleAuthRequest("/api/resend-verification", "POST");
      if ('error' in result) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Email trimis",
        description: "Un nou email de verificare a fost trimis. Te rugăm să verifici căsuța de email.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Eroare",
        description: error.message || "Nu s-a putut trimite emailul de verificare.",
      });
    },
  });

  return {
    user,
    isLoading,
    login: login.mutateAsync,
    register: register.mutateAsync,
    logout: logout.mutateAsync,
    resendVerification: resendVerification.mutateAsync,
  };
}