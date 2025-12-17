"use client";
import { Clock } from "lucide-react";

export default function InfoSection() {
  return (
    <section id="operations" className="py-24 bg-gray-100 dark:bg-gym-dark text-gray-900 dark:text-white transition-colors duration-300 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gym-red to-transparent"></div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-6">
        
        {/* Operations Card */}
        <div className="border border-gray-300 dark:border-white/10 p-8 rounded-sm relative bg-white dark:bg-black/50 hover:border-gym-red transition-all duration-300 shadow-sm dark:shadow-none">
          <h3 className="text-3xl font-black mb-6 flex items-center gap-3 italic">
            <Clock className="text-gym-red" /> OPERATIONS
          </h3>
          
          <div className="space-y-6 font-dot text-lg">
            <div className="flex justify-between border-b border-dashed border-gray-300 dark:border-white/20 pb-2">
              <span className="text-gray-500 dark:text-gray-400">MORNING BLOCK</span>
              <span className="text-gym-black dark:text-gym-yellow font-bold">06:00 AM - 10:00 AM</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-gray-300 dark:border-white/20 pb-2">
              <span className="text-gray-500 dark:text-gray-400">EVENING BLOCK</span>
              <span className="text-gym-black dark:text-gym-yellow font-bold">04:00 PM - 10:00 PM</span>
            </div>
            <div className="flex justify-between opacity-50">
               <span className="text-gray-500 dark:text-gray-400">SUNDAY</span>
               <span className="text-gym-red font-bold">CLOSED</span>
            </div>
            
            {/* Women Only Notice */}
            <div className="bg-gym-yellow/20 border border-gym-yellow/40 p-3 rounded-sm">
              <div className="text-[11px] font-bold text-gym-yellow uppercase tracking-widest mb-1">⚠ WOMEN-ONLY BLOCK</div>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-sans leading-tight mb-2">
                <span className="font-bold">06:00 PM - 08:00 PM</span> is strictly for women only. Males are not allowed during this time.
              </p>
              <div className="text-[11px] font-bold text-gym-red uppercase tracking-widest mb-1">✓ OPEN ACCESS</div>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-sans leading-tight">
                <span className="font-bold">Morning (6 AM - 10 AM) & Evening (4 PM - 6 PM, 8 PM - 10 PM)</span> - Males and females can train together.
              </p>
            </div>
          </div>

           <div className="absolute bottom-4 right-4 text-[10px] font-dot text-gray-400 tracking-widest">
                IST // UTC+05:30
           </div>
        </div>

        {/* Membership Card */}
       <div className="border border-gray-300 dark:border-white/10 p-8 rounded-sm bg-white dark:bg-black/50 hover:border-gym-yellow transition-all duration-300 shadow-sm dark:shadow-none">
           <h3 className="text-3xl font-black mb-6 italic">MEMBERSHIP</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-white/5 p-6 text-center border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                <span className="text-gray-500 dark:text-gray-400 font-dot text-xs uppercase tracking-widest">Monthly</span>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mt-2 font-sans">Rs. 700</div>
              </div>
              
              {/* FIXED SPACING FOR "Best Value Quarterly" */}
              <div className="bg-gym-yellow/10 p-6 text-center border border-gym-yellow/50 relative">
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gym-yellow text-black text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide whitespace-nowrap">
                    Best Value
                 </div>
                <span className="text-gray-500 dark:text-gray-400 font-dot text-xs uppercase tracking-widest block mt-2">
                    Quarterly
                </span>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-400 dark:text-gray-500 line-through font-sans">Rs. 2100</span>
                    <span className="bg-gym-red text-white text-[10px] font-bold px-2 py-0.5 rounded-sm font-dot">SAVE</span>
                  </div>
                  <div className="text-4xl font-bold text-gym-yellow font-sans">Rs. 1800</div>
                </div>
              </div>
           </div>

           <div className="mt-6 text-center">
              <p className="font-dot text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Personal Training</p>
              <div className="text-xl font-bold text-gray-900 dark:text-white">AVAILABLE ON REQUEST</div>
           </div>
       </div>

      </div>
    </section>
  );
}