import { useState, useEffect } from "react";
import LoginDropdown from "./LoginDropdown";
import { Button } from "./ui/button";
import { Mail } from "lucide-react";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleContactClick = () => {
    // We'll implement the contact modal functionality later
    console.log("Contact button clicked");
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
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <img
              src="https://i.ibb.co/njmjGNW/Logo.png"
              alt="CARVIZIO Logo"
              className="h-16 w-auto"
            />
            <span
              className="ml-2 text-3xl font-bold text-gray-900"
              style={{ fontFamily: '"Gugi", sans-serif' }}
            >
              CARVIZIO
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleContactClick}
              className="flex items-center gap-2 text-gray-600 hover:text-[#00aff5] hover:bg-transparent hover:scale-105 transition-all duration-200"
            >
              <Mail className="h-4 w-4" />
              Contact Us
            </Button>
            <LoginDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
}