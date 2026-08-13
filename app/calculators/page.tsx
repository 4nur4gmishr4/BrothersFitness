import Navbar from "@/components/Navbar";
import Diagnostics from "@/components/Diagnostics";
import Footer from "@/components/Footer";

export default function CalculatorsPage() {
    return (
        <div className="min-h-screen surface-canvas text-hi">
            <Navbar />
            <Diagnostics />
            <Footer />
        </div>
    );
}
