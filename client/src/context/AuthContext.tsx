import { createContext, useContext, useEffect, useState } from "react";
import { type User } from "firebase/auth";
import { auth, onAuthChange } from "@/lib/firebase";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  rememberMe: false,
  setRememberMe: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedRememberMe = localStorage.getItem('rememberMe') === 'true';
    setRememberMe(storedRememberMe);

    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);

      // If user is logged in and on the root path, redirect to dashboard
      if (user && window.location.pathname === "/") {
        setLocation("/dashboard");
      }

      // Handle persistence based on rememberMe setting
      if (user && !storedRememberMe) {
        auth.signOut(); // Sign out if remember me is not enabled
      }
    });

    return () => unsubscribe();
  }, [setLocation]);

  const handleSetRememberMe = (value: boolean) => {
    setRememberMe(value);
    localStorage.setItem('rememberMe', value.toString());
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      rememberMe, 
      setRememberMe: handleSetRememberMe 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}