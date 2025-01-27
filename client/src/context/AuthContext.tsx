import { createContext, useContext, useEffect, useState } from "react";
import { type User } from "firebase/auth";
import { onAuthChange } from "@/lib/auth";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);

      // If user is logged in and on the root path, redirect to dashboard
      if (user && window.location.pathname === "/") {
        setLocation("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [setLocation]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}