"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const personnel = [
  {
    id: "OP-001",
    name: "AMAN",
    rank: "HEAD COACH // FOUNDER",
    clearance: "LEVEL 5",
    spec: "STRENGTH & CONDITIONING",
    src: "/assets/aman.jpeg",
    instagram: "https://www.instagram.com/aman_shrivastavaaa?igsh=MWJ5MHhodnJrY3BoNA==",
    whatsapp: "919131179343",
  },
  {
    id: "OP-002",
    name: "PRADEEP",
    rank: "SENIOR TRAINER",
    clearance: "LEVEL 4",
    spec: "FUNCTIONAL & HIIT",
    src: "/assets/pradeep.jpeg",
    instagram: "https://www.instagram.com/brothers_fitness_17",
    whatsapp: "919131272754",
  },
];

export default function Architects() {
  return (
    <section id="architects" className="surface-canvas py-16 md:py-24 border-b border-surface-border relative">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 bg-accent" />
              <p className="font-mono text-[10px] tracking-[0.3em] text-accent uppercase font-bold">AUTHORIZED PERSONNEL</p>
            </div>
            <h2 className="heading-display text-4xl md:text-5xl lg:text-6xl text-hi leading-[0.9] uppercase">
              PERSONNEL <span className="text-accent">DIRECTORY</span>
            </h2>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-2 border-l-2 md:border-l-0 md:border-r-2 border-accent pl-4 md:pl-0 md:pr-4">
            <p className="font-mono text-xs tracking-widest text-mid uppercase">Total Active Officers: 02</p>
            <p className="font-mono text-[10px] tracking-widest text-faint uppercase">All personnel cleared for combat.</p>
          </div>
        </div>

        {/* Grid Layout (Replaced 3D Carousel) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {personnel.map((p, idx) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col lg:flex-row border border-surface-border bg-surface-card rounded-none group hover:border-accent transition-colors duration-300"
            >
              {/* Photo Section */}
              <div className="relative w-full lg:w-[45%] aspect-square lg:aspect-auto lg:h-[400px] bg-surface-elevated border-b lg:border-b-0 lg:border-r border-surface-border overflow-hidden">
                <Image
                  src={p.src}
                  alt={`Officer ${p.name}`}
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                
                {/* HUD Elements */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm border border-surface-border/50 px-2 py-1">
                  <span className="font-mono text-[9px] tracking-widest text-accent uppercase">{p.id}</span>
                </div>
                
                <div className="absolute bottom-4 right-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-1 h-3 ${i < parseInt(p.clearance.split(' ')[1]) ? 'bg-accent' : 'bg-surface-border/50'}`} />
                  ))}
                </div>
              </div>

              {/* Data Section */}
              <div className="w-full lg:w-[55%] flex flex-col justify-between p-6 md:p-8">
                <div>
                  <h3 className="heading-display text-3xl md:text-4xl text-hi mb-1 tracking-wider uppercase group-hover:text-accent transition-colors">
                    {p.name}
                  </h3>
                  <div className="inline-flex px-2 py-1 bg-surface-elevated border border-surface-border mb-6">
                    <span className="font-mono text-[10px] tracking-widest text-mid uppercase">{p.rank}</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[9px] tracking-[0.2em] text-low uppercase">SPECIALIZATION</span>
                      <span className="font-mono text-sm tracking-wide text-hi uppercase">{p.spec}</span>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[9px] tracking-[0.2em] text-low uppercase">CLEARANCE LEVEL</span>
                      <span className="font-mono text-sm tracking-wide text-hi uppercase">{p.clearance}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-surface-border flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-widest text-low uppercase">INITIATE COMMS:</span>
                  
                  <div className="flex items-center gap-2">
                    {p.instagram && (
                      <a href={p.instagram} target="_blank" rel="noopener noreferrer" className="p-3 border border-surface-border bg-surface-elevated hover:border-accent hover:text-accent transition-colors duration-300 text-mid">
                        <InstagramIcon className="w-4 h-4" />
                      </a>
                    )}
                    {p.whatsapp && (
                      <a href={`https://wa.me/${p.whatsapp}?text=Hi%20${p.name},%20I'm%20interested%20in%20joining%20Brother's%20Fitness!`} target="_blank" rel="noopener noreferrer" className="p-3 border border-surface-border bg-surface-elevated hover:border-accent hover:text-accent transition-colors duration-300 text-mid">
                        <WhatsAppIcon className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
