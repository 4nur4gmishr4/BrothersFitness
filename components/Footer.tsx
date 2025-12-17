import { MapPin, Phone, Mail, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-white/10 font-sans text-xs transition-colors duration-300">
        
        {/* GOOGLE MAPS IFRAME */}
        <div className="w-full h-72 border-b border-white/10 overflow-hidden relative group">
            <iframe 
                src="https://www.google.com/maps/embed?pb=!4v1765984139802!6m8!1m7!1sVgx1G-8DgYzc7r9doCFl-w!2m2!1d22.59908339631551!2d79.61152925095537!3f203.7776292249145!4f-5.853334360908249!5f0.7820865974627469"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Brother's Fitness Location"
                className="opacity-60 transition-opacity duration-500 group-hover:opacity-100 grayscale group-hover:grayscale-0"
            ></iframe>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start gap-8 bg-black">
            <div>
                <div className="font-black text-xl italic mb-4 text-white font-sans tracking-tighter">BROTHER'S FITNESS</div>
                
                <div className="space-y-3 text-gray-400 font-medium">
                    <a 
                        href="https://www.google.com/maps/search/?api=1&query=Brothers+Fitness+Lakhnadon+Madhya+Pradesh+480886"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 hover:text-gym-red transition-colors group"
                    >
                        <MapPin size={16} className="text-gym-red group-hover:animate-bounce"/> 
                        <span>Lakhnadon, Madhya Pradesh, 480886</span>
                    </a>
                    
                    <a href="tel:+919131179343" className="flex items-center gap-3 hover:text-gym-red transition-colors">
                        <Phone size={16} className="text-gym-red"/> 
                        <span>+91 91311 79343</span>
                    </a>
                    
                    <a href="mailto:brothersfitnesszone@gmail.com" className="flex items-center gap-3 hover:text-gym-red transition-colors">
                        <Mail size={16} className="text-gym-red"/> 
                        <span>brothersfitnesszone@gmail.com</span>
                    </a>
                </div>
            </div>
            
            <div className="text-right space-y-4">
                {/* INSTAGRAM BUTTON */}
                <a 
                    href="https://www.instagram.com/brothers_fitness_17?igsh=MW0xYmV2dHIzOHlneQ=="
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-sm hover:scale-105 transition-all duration-300 font-dot text-xs font-bold tracking-widest shadow-lg"
                >
                    <Instagram size={16} /> FOLLOW PROTOCOL
                </a>
                <div className="text-gray-500 text-sm font-medium">© 2024 BROTHER'S FITNESS.</div>
            </div>
        </div>
    </footer>
  );
}