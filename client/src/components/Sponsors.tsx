import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Sponsors() {
  const [showDialog, setShowDialog] = useState(false);

  const mockSponsors = [
    {
      id: 1,
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Your+Logo+Here",
      alt: "Sponsor 1",
    },
    {
      id: 2,
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Your+Logo+Here",
      alt: "Sponsor 2",
    },
    {
      id: 3,
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Your+Logo+Here",
      alt: "Sponsor 3",
    },
    {
      id: 4,
      image: "https://placehold.co/600x400/e2e8f0/64748b?text=Your+Logo+Here",
      alt: "Sponsor 4",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 sm:text-5xl mb-4">
          Sponsorii Noștri
        </h2>
        <p className="text-lg text-center text-gray-600 mb-12">
          Partenerii care ne susțin în misiunea noastră
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {mockSponsors.map((sponsor) => (
            <button
              key={sponsor.id}
              onClick={() => setShowDialog(true)}
              className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={sponsor.image}
                  alt={sponsor.alt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-lg font-medium">
                    Rezervă acest spațiu
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Devino Sponsor CARVIZIO</DialogTitle>
              <DialogDescription className="pt-4 space-y-4 text-base">
                <p>
                  Afacerea ta poate apărea aici! Prin intermediul platformei noastre, 
                  poți ajunge la mii de potențiali clienți interesați de servicii auto.
                </p>
                <p>
                  Beneficii:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Vizibilitate crescută în industria auto</li>
                  <li>Acces la o audiență targetată</li>
                  <li>Creșterea credibilității brandului</li>
                  <li>Parteneriat cu o platformă în continuă creștere</li>
                </ul>
                <p className="font-semibold pt-2">
                  Contactează-ne pentru a discuta despre oportunitățile de sponsorizare:
                </p>
                <p className="text-[#00aff5]">
                  contact@carvizio.com
                </p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
