import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Benefits from "@/components/Benefits";
import FAQ from "@/components/FAQ";
import AppPreview from "@/components/AppPreview";
import Sponsors from "@/components/Sponsors";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import { useEffect } from "react";
import { ParallaxWrapper } from "@/components/ui/parallax-wrapper";

export default function Home() {
  useEffect(() => {
    document.title = "CARVIZIO - Găsește service auto rapid și ușor";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <ParallaxWrapper offset={0}>
        <Hero />
      </ParallaxWrapper>
      <ParallaxWrapper offset={30}>
        <HowItWorks />
      </ParallaxWrapper>
      <ParallaxWrapper offset={40}>
        <Benefits />
      </ParallaxWrapper>
      <ParallaxWrapper offset={50}>
        <TestimonialCarousel />
      </ParallaxWrapper>
      <ParallaxWrapper offset={50}>
        <AppPreview />
      </ParallaxWrapper>
      <ParallaxWrapper offset={40}>
        <Sponsors />
      </ParallaxWrapper>
      <ParallaxWrapper offset={30}>
        <FAQ />
      </ParallaxWrapper>
      <Footer />
    </div>
  );
}