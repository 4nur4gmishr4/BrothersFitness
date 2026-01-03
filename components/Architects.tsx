"use client";

import { Shield, Medal, Instagram } from "lucide-react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function Architects() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const trainers = [
    {
      name: "AMAN",
      role: "HEAD COACH // FOUNDER",
      spec: "STRENGTH & CONDITIONING",
      src: "/assets/aman.jpeg",
      id: "001",
      isMain: true,
      instagram: "https://www.instagram.com/aman_shrivastavaaa?igsh=MWJ5MHhodnJrY3BoNA=="
    },
    {
      name: "PRADEEP",
      role: "SENIOR TRAINER",
      spec: "FUNCTIONAL & HIIT",
      src: "/assets/pradeep.jpeg",
      id: "002",
      isMain: false,
      instagram: null
    }
  ];

  return (
    <section id="architects" ref={ref} className="min-h-screen bg-black py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          className="text-center mb-8 md:mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="heading-display text-4xl md:text-6xl mb-4">
            THE ARCHITECTS
          </h2>
          <p className="text-lg text-gray-400 font-mono tracking-wide">
            BUILT BY BROTHERS. FORGED IN IRON.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {trainers.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="relative group"
            >
              <motion.div
                className="border-2 border-white p-5 md:p-7 relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="absolute top-0 left-0 w-1 h-full bg-gym-red origin-top"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.2 + 0.3 }}
                />

                <div className="flex items-start justify-between gap-4 mb-6">
                  <motion.div
                    className="label-text text-gym-red"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ID: {t.id}
                  </motion.div>

                  {t.instagram && (
                    <motion.a
                      href={t.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative group/instagram"
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 rounded-full blur-md opacity-0 group-hover/instagram:opacity-75"
                        animate={{
                          scale: [1, 1.3, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 p-2 rounded-full">
                        <Instagram className="w-4 h-4 text-white" />
                      </div>
                    </motion.a>
                  )}
                </div>

                <div className="relative w-full aspect-square mb-6 overflow-hidden bg-gray-900">
                  <motion.div
                    className="relative w-full h-full"
                    initial={{ filter: "grayscale(100%)" }}
                    whileHover={{ filter: "grayscale(0%)" }}
                    transition={{ duration: 0.5 }}
                  >
                    <Image
                      src={t.src}
                      alt={t.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={i === 0}
                    />
                  </motion.div>

                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: "repeating-linear-gradient(0deg, rgba(215, 25, 33, 0.1) 0px, transparent 2px, transparent 4px)",
                    }}
                    animate={{ y: ["0%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xl md:text-4xl font-display font-black tracking-tight">{t.name}</h3>
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.5 }}
                    >
                      {t.isMain ? <Shield className="w-6 h-6 text-gym-red" /> : <Medal className="w-6 h-6 text-gym-red" />}
                    </motion.div>
                  </div>
                  <p className="label-text text-gray-400">
                    {t.role}
                  </p>
                  <motion.p
                    className="text-lg font-display font-semibold text-gym-red tracking-tight"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 + 0.5 }}
                  >
                    {t.spec}
                  </motion.p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

