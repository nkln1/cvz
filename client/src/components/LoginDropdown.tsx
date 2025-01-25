import { useState, useRef, useEffect } from "react";

export default function LoginDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label="Conectează-te"
        className="flex items-center p-0 space-x-1 text-gray-600 hover:text-blue-600 focus:outline-none focus:ring-0 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          src="https://i.ibb.co/NnnNWbN/Signlogin.png"
          alt="Login Icon"
          className="h-8 w-8"
        />
        <svg
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 transition-transform ${isOpen ? "rotate-180" : ""}`}
          role="img"
          aria-hidden="true"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8.29289 6.70711c-.39052-.39053-.39052-1.02369 0-1.41422.39053-.39052 1.02369-.39052 1.41422 0l5.99999 6.00001c.3905.3905.3905 1.0237 0 1.4142l-5.99999 6c-.39053.3905-1.02369.3905-1.41422 0-.39052-.3905-.39052-1.0237 0-1.4142L13.5858 12 8.29289 6.70711Z"
            clipRule="evenodd"
            transform="rotate(90 12 12)"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg p-4 z-50">
          <h3 className="text-lg font-semibold mb-2">Intră în cont</h3>
          <form className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Parolă"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-lg font-medium rounded-full text-white bg-[#00aff5] hover:bg-blue-700 shadow-lg transition-transform transform hover:scale-105 w-full"
            >
              Conectează-te
            </button>
          </form>
          <hr className="my-3" />
          <button className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-lg font-medium rounded-full text-white bg-[#005f99] hover:bg-[#006fb3] shadow-lg transition-transform transform hover:scale-105 w-full">
            Crează cont
          </button>
        </div>
      )}
    </div>
  );
}
