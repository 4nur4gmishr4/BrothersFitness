"use client";

import { motion } from "framer-motion";

const schedules = [
  {
    id: "01",
    phase: "MORNING CYCLE",
    time: "06:00 - 10:00",
    access: "MIXED ACCESS",
    status: "ACTIVE",
    highlight: false,
  },
  {
    id: "02",
    phase: "WOMEN ONLY",
    time: "16:30 - 18:30",
    access: "RESTRICTED ACCESS",
    status: "SECURE",
    highlight: true,
  },
  {
    id: "03",
    phase: "EVENING CYCLE",
    time: "18:30 - 22:00",
    access: "MIXED ACCESS",
    status: "ACTIVE",
    highlight: false,
  },
  {
    id: "04",
    phase: "SUNDAY",
    time: "00:00 - 00:00",
    access: "NO ACCESS",
    status: "OFFLINE",
    highlight: false,
    closed: true,
  }
];

export default function InfoSection() {
  return (
    <section id="timings" className="surface-canvas py-16 md:py-24 border-b border-surface-border relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative z-10">
        
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* Header Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-[40%] flex flex-col gap-6 sticky top-24"
          >
            <div className="inline-flex items-center gap-3">
              <div className="px-2 py-1 bg-accent/10 border border-accent/20 text-[10px] font-mono tracking-widest text-accent uppercase">
                STATUS: OPERATIONAL
              </div>
            </div>
            
            <h2 className="heading-display text-4xl md:text-5xl lg:text-6xl text-hi leading-[0.9] uppercase">
              OPERATIONAL<br/><span className="text-accent">PARAMETERS</span>
            </h2>
            
            <p className="text-mid md:text-base font-mono text-xs leading-relaxed uppercase tracking-wide opacity-80 border-l border-surface-border pl-4">
              Access to the facility is strictly governed by the schedule below. Unauthorized access outside designated cycles is prohibited. All timings in IST.
            </p>

            {/* Decorative Barcode */}
            <div className="mt-8 flex items-end gap-1 h-12 opacity-30">
               {[1,3,1,1,4,1,2,5,1,1,3,2,1,1,6,1,2,1,4].map((w, i) => (
                 <div key={i} className="bg-hi h-full" style={{ width: `${w * 2}px` }} />
               ))}
            </div>
          </motion.div>

          {/* Data Table */}
          <div className="w-full lg:w-[60%] flex flex-col border border-surface-border bg-surface-card rounded-none p-1 shrink-0">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-surface-elevated border-b border-surface-border">
              <div className="col-span-2 text-[10px] font-mono text-mid uppercase tracking-[0.2em]">ID</div>
              <div className="col-span-4 text-[10px] font-mono text-mid uppercase tracking-[0.2em]">PHASE</div>
              <div className="col-span-3 text-[10px] font-mono text-mid uppercase tracking-[0.2em]">TIMEFRAME</div>
              <div className="col-span-3 text-[10px] font-mono text-mid uppercase tracking-[0.2em]">CLEARANCE</div>
            </div>

            {/* Table Rows */}
            <div className="flex flex-col">
              {schedules.map((row, idx) => (
                <motion.div 
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-4 px-6 py-5 border-b border-surface-border/50 last:border-0 items-center transition-colors duration-300 ${row.highlight ? 'bg-accent/5 hover:bg-accent/10' : 'hover:bg-surface-elevated'}`}
                >
                  <div className="md:col-span-2 flex items-center justify-between md:block">
                    <span className="md:hidden text-[10px] font-mono text-mid uppercase tracking-[0.2em]">ID</span>
                    <span className="text-[10px] font-mono text-low">[{row.id}]</span>
                  </div>
                  
                  <div className="md:col-span-4 flex flex-col gap-1">
                    <span className="md:hidden text-[10px] font-mono text-mid uppercase tracking-[0.2em] mb-1">PHASE</span>
                    <span className={`font-display text-xl uppercase tracking-wide ${row.closed ? 'text-status-danger' : 'text-hi'}`}>
                      {row.phase}
                    </span>
                    <span className="md:hidden text-xs font-mono text-mid uppercase">{row.time}</span>
                  </div>
                  
                  <div className="hidden md:block md:col-span-3">
                    <span className="font-mono text-sm tracking-wider text-hi bg-surface-canvas border border-surface-border/50 px-2 py-1">
                      {row.time}
                    </span>
                  </div>
                  
                  <div className="md:col-span-3 flex flex-col gap-1 items-start">
                    <span className="md:hidden text-[10px] font-mono text-mid uppercase tracking-[0.2em] mb-1">CLEARANCE</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${row.highlight ? 'bg-status-warning' : row.closed ? 'bg-status-danger' : 'bg-status-success'}`} />
                      <span className={`text-[10px] font-mono uppercase tracking-widest ${row.highlight ? 'text-status-warning' : row.closed ? 'text-status-danger' : 'text-mid'}`}>
                        {row.access}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
