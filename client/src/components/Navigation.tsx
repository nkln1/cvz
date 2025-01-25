import { useState, useEffect } from "react";
import LoginDropdown from "./LoginDropdown";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 bg-white shadow-md transition-all duration-300 ${
        isScrolled ? "navbar-transparent" : ""
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
          <LoginDropdown />
        </div>
      </div>
    </nav>
  );
}
