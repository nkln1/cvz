import { createContext, useContext, useEffect, useState } from "react";
import { type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isService: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isService: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isService, setIsService] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check user role in Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        setIsService(userDoc.data()?.role === "service");
      } else {
        setIsService(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isService }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}