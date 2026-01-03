"use client";

import { motion } from "framer-motion";
import { Instagram, MessageCircle } from "lucide-react";

export default function SocialBar() {
  return (
    <div className="fixed top-20 right-4 md:right-8 z-40 flex flex-col gap-4">
      {/* Instagram Button */}
      <motion.a
        href="https://www.instagram.com/brothers_fitness_17?igsh=MW0xYmV2dHIzOHlneQ=="
        target="_blank"
        rel="noopener noreferrer"
        className="group relative"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 rounded-full blur-lg opacity-0 group-hover:opacity-75 transition-opacity duration-300"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 p-4 rounded-full shadow-lg">
          <Instagram className="w-6 h-6 text-white" />
        </div>
        <motion.div
          className="absolute -bottom-12 right-0 bg-black/90 text-white px-3 py-1 rounded text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none"
          initial={{ y: -10 }}
          whileHover={{ y: 0 }}
        >
          Follow Us
        </motion.div>
      </motion.a>

      {/* WhatsApp Button */}
      <motion.a
        href="https://chat.whatsapp.com/JuBvYwrjjPELfy7KlIUylI"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1, rotate: -5 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-0 group-hover:opacity-75 transition-opacity duration-300"
          animate={{
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="relative bg-green-500 p-4 rounded-full shadow-lg">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <motion.div
          className="absolute -bottom-12 right-0 bg-black/90 text-white px-3 py-1 rounded text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none"
          initial={{ y: -10 }}
          whileHover={{ y: 0 }}
        >
          Join Group
        </motion.div>
        <motion.div
          className="absolute -top-2 -right-2 bg-gym-red text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          animate={{
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          +
        </motion.div>
      </motion.a>
    </div>
  );
}
