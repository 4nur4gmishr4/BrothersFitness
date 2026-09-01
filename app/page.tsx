import Navbar from "@/components/public/layout/Navbar";
import Hero from "@/components/public/sections/Hero";
import FeaturesOverview from "@/components/public/sections/FeaturesOverview";
import InfoSection from "@/components/public/sections/InfoSection";
import WorkoutSplits from "@/components/public/sections/WorkoutSplits";
import Architects from "@/components/public/sections/Architects";
import ContactForm from "@/components/ui/primitives/ContactForm";
import Footer from "@/components/public/layout/Footer";
import PageWrapper from "@/components/ui/layout/PageWrapper";

export default function Home() {
  return (
    <PageWrapper>
      <Navbar />
      
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 space-y-12 sm:space-y-16 py-4 sm:py-8">
        
        {/* 1. Hero Section (Full Width) */}
        <Hero />
        
        {/* 2. Facilities & Features (Single Full-Width Section with Divider) */}
        <div className="w-full pt-10 sm:pt-14 border-t border-surface-border/70">
          <FeaturesOverview />
        </div>

        {/* 3. Operating Hours & Workout Splits (Stretched Side by Side with Header & Divider) */}
        <div className="w-full pt-10 sm:pt-14 border-t border-surface-border/70">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">
                SCHEDULE &amp; TRAINING
              </p>
              <h2 className="heading-display text-4xl md:text-5xl lg:text-6xl text-hi leading-[0.95] tracking-tight uppercase">
                HOURS &amp; <span className="text-accent">ROUTINES</span>
              </h2>
            </div>
            
            <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-surface-border pl-4 md:pl-0 md:pr-4">
              <p className="text-sm font-medium text-hi">Operating Daily in Lakhnadon</p>
              <p className="text-xs text-mid">Morning, Women&apos;s &amp; Evening Batches with Weekly Splits</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">
            <InfoSection />
            <WorkoutSplits />
          </div>
        </div>

        {/* 4. Coaches & Leadership (Aman & Pradeep Side by Side with Divider) */}
        <div className="w-full pt-10 sm:pt-14 border-t border-surface-border/70">
          <Architects />
        </div>

        {/* 5. Contact & Map Section (Stretched Side by Side with Divider) */}
        <div className="w-full pt-10 sm:pt-14 border-t border-surface-border/70">
          <ContactForm />
        </div>

      </main>

      <Footer />
    </PageWrapper>
  );
}
