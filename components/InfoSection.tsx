"use client";

import { Clock } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

export default function InfoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return (
    <section
      id="operations"
      ref={ref}
      className="min-h-screen bg-black py-12 md:py-20 relative overflow-hidden"
    >
      {/* Background grid - disabled on mobile for performance */}
      {!isMobile && (
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
          }}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="flex justify-center">
          {/* OPERATIONS CARD */}
          <AnimatedCard delay={0.1} isInView={isInView}>
            <motion.div
              className="border-2 border-white p-6 md:p-8 relative overflow-hidden group max-w-2xl"
              whileHover={{ scale: 1.02, boxShadow: "0 10px 40px rgba(215, 25, 33, 0.1)" }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="absolute inset-0 bg-gym-red opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.8 }}
              />

              <h2 className="heading-display text-3xl md:text-4xl mb-5 flex items-center gap-3">
                <Clock className="w-7 h-7 md:w-8 md:h-8" />
                OPERATIONS
              </h2>

              <div className="space-y-4 md:space-y-5">
                {/* MORNING SESSION: 6:00 AM - 10:00 AM */}
                <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                  <h3 className="label-text text-gray-300 mb-1.5">
                    MORNING SESSION
                  </h3>
                  <motion.p
                    className="text-xl md:text-2xl font-display font-bold tracking-tight"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    06:00 AM - 10:00 AM
                  </motion.p>
                  <p className="text-xs md:text-sm text-gray-300 mt-1">
                    ✓ Men and Women Together
                  </p>
                </motion.div>

                {/* WOMEN-ONLY SESSION: 4:30 PM - 6:30 PM */}
                <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                  <h3 className="label-text text-gray-300 mb-1.5">
                    WOMEN-ONLY SESSION
                  </h3>
                  <motion.p
                    className="text-xl md:text-2xl font-display font-bold tracking-tight text-gym-red"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  >
                    04:30 PM - 06:30 PM
                  </motion.p>
                  <p className="text-xs md:text-sm text-gym-red mt-1 font-medium">
                    ⚠ Strictly Women Only
                  </p>
                </motion.div>

                {/* EVENING SESSION: 6:30 PM - 10:00 PM */}
                <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                  <h3 className="label-text text-gray-300 mb-1.5">
                    EVENING SESSION
                  </h3>
                  <motion.p
                    className="text-xl md:text-2xl font-display font-bold tracking-tight"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  >
                    06:30 PM - 10:00 PM
                  </motion.p>
                  <p className="text-xs md:text-sm text-gray-300 mt-1">
                    ✓ Men and Women Together
                  </p>
                </motion.div>

                {/* SUNDAY CLOSED */}
                <div className="pt-3 border-t-2 border-gym-red">
                  <h3 className="label-text text-gray-300 mb-1.5">
                    SUNDAY
                  </h3>
                  <p className="text-lg md:text-xl font-bold text-gym-red">CLOSED</p>
                </div>

                {/* SCHEDULE SUMMARY */}
                <motion.div
                  className="bg-gym-red/10 border-l-4 border-gym-red p-3 mt-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-xs font-mono font-bold uppercase tracking-wider text-gym-red mb-1.5">
                    ℹ SCHEDULE SUMMARY
                  </p>
                  <p className="text-xs md:text-sm text-white/90 leading-relaxed">
                    <strong>Mixed Training:</strong> 6:00-10:00 AM & 6:30-10:00 PM<br />
                    <strong>Women Only:</strong> 4:30-6:30 PM
                  </p>
                </motion.div>

                <p className="text-xs font-mono text-gray-300 mt-2">
                  IST // UTC+05:30
                </p>
              </div>
            </motion.div>
          </AnimatedCard>
        </div>
      </div>
    </section>
  );
}

function AnimatedCard({ children, delay, isInView }: { children: React.ReactNode; delay: number; isInView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}
