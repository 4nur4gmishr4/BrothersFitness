import Navbar from "@/components/Navbar";
import PaymentSection from "@/components/PaymentSection";
import Footer from "@/components/Footer";

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
