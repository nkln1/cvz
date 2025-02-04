import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import LoginDropdown from "./LoginDropdown";
import { Button } from "./ui/button";
import { Mail, Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleContactClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLocation("/contact");
  };

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLocation("/");
  };

  const handlePublicProfileClick = () => {
    if (user?.uid) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setLocation(`/service/${user.uid}`);
    }
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/75 backdrop-blur-md shadow-md"
          : "bg-white shadow-md"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16 items-center">
          <button 
            onClick={handleLogoClick}
            className="flex items-center hover:opacity-80 transition-opacity duration-200"
          >
            <img
              src="https://i.ibb.co/njmjGNW/Logo.png"
              alt="CARVIZIO Logo"
              className="h-10 sm:h-16 w-auto"
            />
            <span
              className="ml-2 text-xl sm:text-3xl font-bold text-gray-900 font-gugi"
            >
              CARVIZIO
            </span>
          </button>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePublicProfileClick}
                className="text-sm sm:text-base flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-[#00aff5] hover:bg-transparent hover:scale-105 transition-all duration-200"
              >
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Profil Public</span>
                <span className="sm:hidden">Profil</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleContactClick}
              className="text-sm sm:text-base flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-[#00aff5] hover:bg-transparent hover:scale-105 transition-all duration-200"
            >
              <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Contactează-ne</span>
              <span className="sm:hidden">Contact</span>
            </Button>
            <LoginDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
}