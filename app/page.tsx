import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import InfoSection from "@/components/InfoSection";
import DailyProtocol from "@/components/DailyProtocol";
import Architects from "@/components/Architects";
import FuelInjector from "@/components/FuelInjector";
import Diagnostics from "@/components/Diagnostics";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-gym-black transition-colors duration-300">
      <Navbar />
      <Hero />
      <InfoSection />
      
      {/* NEW: Live Schedule */}
      <DailyProtocol />
      
      <Architects />
      
      {/* NEW: Nutrition Guide */}
      <FuelInjector />
      
      {/* NEW: Calculators */}
      <Diagnostics />
      
      {/* REMOVED: WorkoutLibrary, MissionTimeline, Manuals etc to clean up flow */}
      <ContactForm />
      <Footer />
    </main>
  );
}
