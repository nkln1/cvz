import { useState, useRef, useEffect } from "react";
import AuthDialog from "./auth/AuthDialog";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function LoginDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Success",
        description: "Te-ai deconectat cu succes!",
      });
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "A apărut o eroare la deconectare.",
      });
    }
  };

  const navigateToDashboard = async () => {
    if (!user?.uid) return;

    try {
      // Try to get user data from clients collection first
      const clientDoc = await getDoc(doc(db, "clients", user.uid));
      if (clientDoc.exists()) {
        setLocation("/dashboard");
      } else {
        // If not found in clients, check services collection
        const serviceDoc = await getDoc(doc(db, "services", user.uid));
        if (serviceDoc.exists()) {
          setLocation("/service-dashboard");
        }
      }
    } catch (error) {
      console.error("Error navigating to dashboard:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-a putut accesa dashboard-ul.",
      });
    } finally {
      setIsOpen(false);
    }
  };

  if (!user) {
    return (
      <AuthDialog
        trigger={
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-gray-600 hover:text-[#00aff5]"
          >
            <img
              src="https://i.ibb.co/NnnNWbN/Signlogin.png"
              alt="Login Icon"
              className="h-8 w-8"
            />
            <ChevronDown className="h-4 w-4" />
          </Button>
        }
      />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          src={user.photoURL || "https://i.ibb.co/NnnNWbN/Signlogin.png"}
          alt={user.displayName || "User"}
          className="h-8 w-8 rounded-full"
        />
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <button 
            onClick={() => {
              void navigateToDashboard();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 border-b border-gray-100 hover:bg-gray-100"
          >
            {user.displayName || user.email}
          </button>
          <button
            onClick={() => void handleSignOut()}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Deconectare
          </button>
        </div>
      )}
    </div>
  );
}