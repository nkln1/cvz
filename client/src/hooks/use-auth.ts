import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  emailVerified: boolean;
  role: "client" | "service";
}

interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

async function handleAuthRequest(
  url: string,
  method: string,
  body?: Record<string, any>
): Promise<AuthResponse> {
  try {
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
        return { success: false, message: "Email sau parolă incorecte" };
      }
      return { success: false, message: "A apărut o eroare. Vă rugăm încercați din nou." };
    }

    const data = await response.json();
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, message: "A apărut o eroare de rețea. Vă rugăm încercați din nou." };
  }
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
      return result;
    },
    onSuccess: (data) => {
      if (!data.success) {
        toast({
          variant: "destructive",
          title: "Eroare de autentificare",
          description: data.message,
        });
        return;
      }

      queryClient.setQueryData(["user"], data.user);
      toast({
        title: "Success",
        description: "Te-ai conectat cu succes!",
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
      return result;
    },
    onSuccess: (data) => {
      if (!data.success) {
        toast({
          variant: "destructive",
          title: "Eroare la înregistrare",
          description: data.message,
        });
        return;
      }

      queryClient.setQueryData(["user"], data.user);
      toast({
        title: "Success",
        description: "Cont creat cu succes! Te rugăm să verifici email-ul pentru confirmare.",
      });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      const result = await handleAuthRequest("/api/logout", "POST");
      return result;
    },
    onSuccess: (data) => {
      if (!data.success) {
        toast({
          variant: "destructive",
          title: "Eroare",
          description: data.message,
        });
        return;
      }

      queryClient.setQueryData(["user"], null);
      toast({
        title: "Success",
        description: "Te-ai deconectat cu succes!",
      });
    },
  });

  return {
    user,
    isLoading,
    login: login.mutateAsync,
    register: register.mutateAsync,
    logout: logout.mutateAsync,
  };
}