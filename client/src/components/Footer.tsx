export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap justify-center space-x-6 md:space-x-12">
          <a
            href="#"
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            Contact Us
          </a>
          <a
            href="#"
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            Terms & Conditions
          </a>
          <a
            href="#"
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            Privacy Policy
          </a>
        </nav>
        <div className="mt-8 flex flex-col items-center">
          <div className="flex items-center space-x-2">
            <img
              src="https://i.ibb.co/njmjGNW/Logo.png"
              alt="CARVIZIO Logo"
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-white">CARVIZIO</span>
          </div>
          <p className="mt-4 text-center text-gray-400">
            © {currentYear} CARVIZIO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
