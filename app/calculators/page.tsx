import Navbar from "@/components/public/layout/Navbar";
import Diagnostics from "@/components/public/widgets/Diagnostics";
import Footer from "@/components/public/layout/Footer";

export default function CalculatorsPage() {
    return (
        <div className="min-h-screen surface-canvas text-hi">
            <Navbar />
            <Diagnostics />
            <Footer />
        </div>
    );
}
