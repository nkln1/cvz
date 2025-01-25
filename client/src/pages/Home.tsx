import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Benefits from "@/components/Benefits";
import FAQ from "@/components/FAQ";
import AppPreview from "@/components/AppPreview";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    document.title = "CARVIZIO - Găsește service auto rapid și ușor";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Hero />
      <HowItWorks />
      <Benefits />
      <AppPreview />
      <FAQ />
      <Footer />
    </div>
  );
}
