import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('client' | 'service')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    async function checkUserRole() {
      if (!user) {
        toast({
          title: "Acces interzis",
          description: "Trebuie să fii autentificat pentru a accesa această pagină.",
          variant: "destructive",
        });
        setLocation('/');
        return;
      }

      try {
        // First try to get client document
        const clientDoc = await getDoc(doc(db, 'clients', user.uid));
        if (clientDoc.exists() && allowedRoles.includes('client')) {
          return; // User is a client and role is allowed
        }

        // If not found in clients, try services
        const serviceDoc = await getDoc(doc(db, 'services', user.uid));
        if (serviceDoc.exists() && allowedRoles.includes('service')) {
          return; // User is a service and role is allowed
        }

        // If we get here, user doesn't have the required role
        toast({
          title: "Acces interzis",
          description: "Nu ai permisiunea necesară pentru a accesa această pagină.",
          variant: "destructive",
        });
        setLocation('/');
      } catch (error) {
        console.error('Error checking user role:', error);
        toast({
          title: "Eroare",
          description: "A apărut o eroare la verificarea rolului. Te rugăm să încerci din nou.",
          variant: "destructive",
        });
        setLocation('/');
      }
    }

    if (!loading) {
      checkUserRole();
    }
  }, [user, loading, setLocation, allowedRoles, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00aff5]" />
      </div>
    );
  }

  return <>{children}</>;
}
