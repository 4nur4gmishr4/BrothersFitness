"use client";
import { User, Shield, Trophy, Medal } from "lucide-react";
import Image from "next/image";

export default function Architects() {
  const trainers = [
    { 
      name: "AMAN", 
      role: "HEAD COACH // FOUNDER", 
      spec: "STRENGTH & CONDITIONING", 
      src: "/assets/aman.jpeg", 
      id: "001",
      isMain: true
    },
    { 
      name: "PRADEEP", 
      role: "SENIOR TRAINER", 
      spec: "FUNCTIONAL & HIIT", 
      src: "/assets/pradeep.jpeg", 
      id: "002",
      isMain: false
    }
  ];

  return (
    <section id="architects" className="py-12 md:py-24 bg-white dark:bg-gym-black transition-colors duration-300 border-t border-black/10 dark:border-white/10">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        
        <div className="text-center mb-8 md:mb-16">
            <h3 className="text-xl sm:text-2xl md:text-4xl font-black font-sans italic uppercase text-black dark:text-white flex items-center justify-center gap-2 sm:gap-3">
                <User className="text-gym-red w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" /> THE <span className="text-gym-red">ARCHITECTS</span>
            </h3>
            <p className="font-dot text-xs sm:text-xs md:text-sm text-gray-500 mt-2 tracking-widest">BUILT BY BROTHERS. FORGED IN IRON.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 max-w-4xl mx-auto">
            {trainers.map((t, i) => (
                <div key={i} className="group relative bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-sm overflow-hidden hover:border-gym-red transition-all duration-300 hover:shadow-[0_0_30px_rgba(215,25,33,0.15)]">
                    
                    <div className="aspect-[3/4] relative overflow-hidden bg-gray-300 dark:bg-white/10">
                        <Image 
                            src={t.src} 
                            alt={t.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105 group-hover:grayscale-0 grayscale"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-0 pointer-events-none">
                            <Shield size={64} className="text-gray-400" />
                        </div>
                        
                        {/* SCAN EFFECT */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gym-red/20 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1500 ease-in-out z-10 pointer-events-none"></div>
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gym-red shadow-[0_0_15px_#D71921] translate-y-[-100%] group-hover:translate-y-[500px] transition-transform duration-1500 ease-in-out z-20 pointer-events-none"></div>
                        
                        {/* FIXED: ID BADGE SPACING & CONTENT */}
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white font-dot text-[10px] px-2 py-1 uppercase tracking-widest backdrop-blur-sm z-30 border border-white/10">
                            ID: {t.id}
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 md:p-6 relative z-30 bg-white dark:bg-black border-t border-gray-100 dark:border-white/5">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black font-sans italic text-lg sm:text-xl md:text-3xl text-black dark:text-white leading-none">{t.name}</h4>
                            {t.isMain ? <Trophy size={16} className="text-gym-yellow shrink-0" /> : <Medal size={16} className="text-gray-500 shrink-0" />}
                        </div>
                        
                        <div className="text-gym-red font-bold font-dot text-[9px] sm:text-xs tracking-widest mb-2">{t.role}</div>
                        <p className="text-xs sm:text-sm text-gray-500 font-sans font-medium">{t.spec}</p>
                    </div>
                </div>
            ))}
        </div>

      </div>
    </section>
  );
}