import Navbar from "@/components/Navbar";
import Diagnostics from "@/components/Diagnostics";
import Footer from "@/components/Footer";

export default function CalculatorsPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <Diagnostics />
            <Footer />
        </div>
    );
}
