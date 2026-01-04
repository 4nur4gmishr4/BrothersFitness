"use client";

import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Grid Animation */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(rgba(215, 25, 33, 0.2) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(215, 25, 33, 0.2) 1px, transparent 1px)`,
                    backgroundSize: "50px 50px",
                }}
            />

            <div className="relative z-10 text-center max-w-2xl mx-auto space-y-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gym-red/10 border-2 border-gym-red mb-6"
                >
                    <AlertTriangle className="w-12 h-12 text-gym-red" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="font-display font-black text-6xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 mb-2">
                        404
                    </h1>
                    <h2 className="font-display font-bold text-2xl md:text-3xl text-gym-red uppercase tracking-widest mb-6">
                        MISSION FAILED
                    </h2>
                    <p className="font-mono text-gray-400 text-sm md:text-base leading-relaxed mb-8 max-w-lg mx-auto border-l-2 border-gym-red pl-4 text-left">
                        &gt; COORDINATES INVALID<br />
                        &gt; TARGET SECTOR NOT FOUND<br />
                        &gt; NAVIGATION SYSTEMS OFFLINE<br />
                        &gt; ADVISE IMMEDIATE RETURN TO BASE
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <Link
                        href="/"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gym-red hover:bg-white hover:text-black text-white font-mono font-bold uppercase tracking-wider rounded transition-all duration-300 group"
                    >
                        <Home className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                        Return to Base
                    </Link>
                </motion.div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 text-center">
                <p className="font-mono text-xs text-gray-600 uppercase tracking-[0.2em] animate-pulse">
                    SYSTEM STATUS: CRITICAL ERROR
                </p>
            </div>
        </div>
    );
}
