import Navbar from "@/components/Navbar";
import PaymentSection from "@/components/PaymentSection";
import Footer from "@/components/Footer";

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="pt-20">
                <PaymentSection />
            </div>
            <Footer />
        </div>
    );
}
