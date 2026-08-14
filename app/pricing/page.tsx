import Navbar from "@/components/public/layout/Navbar";
import PaymentSection from "@/components/public/sections/PaymentSection";
import Footer from "@/components/public/layout/Footer";

export default function PricingPage() {
    return (
        <div className="min-h-screen surface-canvas text-hi">
            <Navbar />
            <div className="pt-20">
                <PaymentSection />
            </div>
            <Footer />
        </div>
    );
}
