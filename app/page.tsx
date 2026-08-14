import Navbar from "@/components/public/layout/Navbar";
import Hero from "@/components/public/sections/Hero";
import FeaturesOverview from "@/components/public/sections/FeaturesOverview";
import InfoSection from "@/components/public/sections/InfoSection";
import DailyProtocol from "@/components/DailyProtocol";
import Architects from "@/components/Architects";
import ContactForm from "@/components/ui/primitives/ContactForm";
import Footer from "@/components/public/layout/Footer";
import PageWrapper from "@/components/PageWrapper";

export default function Home() {
  return (
    <PageWrapper>
      <Navbar />
      
      <main className="max-w-[1800px] mx-auto px-4 md:px-6 space-y-4 md:space-y-6">
        <Hero />
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          <div className="col-span-1">
            <InfoSection />
          </div>
          <div className="col-span-1 xl:col-span-2">
            <FeaturesOverview />
          </div>
          <div className="col-span-1">
            <DailyProtocol />
          </div>
          <div className="col-span-1">
            <Architects />
          </div>
          <div className="col-span-1 md:col-span-2 xl:col-span-1">
            <ContactForm />
          </div>
        </div>
      </main>

      <Footer />
    </PageWrapper>
  );
}

