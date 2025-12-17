"use client";
import { useState } from "react";
import { Mail, Send, CheckCircle2, AlertCircle, Phone, MapPin, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="py-12 md:py-24 bg-white dark:bg-gym-black transition-colors duration-300 relative border-t border-black/10 dark:border-white/10">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        
        <div className="text-center mb-8 md:mb-16">
            <h3 className="text-2xl md:text-4xl font-black font-sans italic uppercase text-black dark:text-white flex items-center justify-center gap-3">
                <Mail className="text-gym-red" /> INITIATE <span className="text-gym-red">CONTACT</span>
            </h3>
            <p className="font-dot text-xs md:text-sm text-gray-500 mt-2 tracking-widest">JOIN THE BROTHERHOOD. START YOUR ARC.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-12 bg-gray-50 dark:bg-black/20 p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-white/10 relative overflow-hidden rounded-sm">
            <div className="absolute top-0 left-0 w-1 h-full bg-gym-red"></div>

            <form onSubmit={handleSubmit} className="md:col-span-3 space-y-4 sm:space-y-6">
                <div className="space-y-2">
                    <label className="font-dot text-xs font-bold text-gray-500 uppercase tracking-widest">Identity // Name</label>
                    <input 
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        type="text" 
                        placeholder="ENTER FULL NAME"
                        className="w-full p-4 bg-white dark:bg-black border border-gray-300 dark:border-white/20 font-bold font-sans focus:border-gym-red focus:ring-1 focus:ring-gym-red outline-none transition-all placeholder:text-gray-400 text-black dark:text-white rounded-sm"
                    />
                </div>
                
                <div className="space-y-2">
                    <label className="font-dot text-xs font-bold text-gray-500 uppercase tracking-widest">Comms // Email</label>
                    <input 
                        required 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email" 
                        placeholder="EMAIL ADDRESS"
                        className="w-full p-4 bg-white dark:bg-black border border-gray-300 dark:border-white/20 font-bold font-sans focus:border-gym-red focus:ring-1 focus:ring-gym-red outline-none transition-all placeholder:text-gray-400 text-black dark:text-white rounded-sm"
                    />
                </div>

                <div className="space-y-2">
                    <label className="font-dot text-xs font-bold text-gray-500 uppercase tracking-widest">Transmission // Message</label>
                    <textarea 
                        required 
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={4}
                        placeholder="STATE YOUR GOALS..."
                        className="w-full p-4 bg-white dark:bg-black border border-gray-300 dark:border-white/20 font-bold font-sans focus:border-gym-red focus:ring-1 focus:ring-gym-red outline-none transition-all placeholder:text-gray-400 text-black dark:text-white resize-none rounded-sm"
                    ></textarea>
                </div>

                <button 
                    disabled={status === "submitting" || status === "success"}
                    className={`w-full py-4 font-black font-dot tracking-widest uppercase transition-all flex items-center justify-center gap-3 rounded-sm
                        ${status === "success" 
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : status === "error"
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-black dark:bg-white text-white dark:text-black hover:bg-gym-red dark:hover:bg-gym-red hover:text-white"
                        } disabled:opacity-80 disabled:cursor-not-allowed`}
                >
                    {status === "submitting" ? (
                        <span className="animate-pulse">TRANSMITTING...</span>
                    ) : status === "success" ? (
                        <>TRANSMISSION SENT <CheckCircle2 size={20} /></>
                    ) : status === "error" ? (
                        <>FAILED. RETRY? <XCircle size={20} /></>
                    ) : (
                        <>SEND_MESSAGE <Send size={18} /></>
                    )}
                </button>
            </form>

            <div className="md:col-span-2 flex flex-col justify-center gap-6 sm:gap-8 border-t md:border-t-0 md:border-l border-gray-200 dark:border-white/10 pt-6 sm:pt-8 md:pt-0 md:pl-6 sm:md:pl-8">
                <div>
                    <h4 className="font-black font-sans italic text-xl mb-2 text-black dark:text-white flex items-center gap-2">
                        <MapPin size={18} className="text-gym-red" /> LOCATION
                    </h4>
                    {/* DIRECT MAPS LINK */}
                    <a 
                        href="https://www.google.com/maps/search/?api=1&query=Brothers+Fitness+Lakhnadon+Madhya+Pradesh+480886"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-sans text-sm text-gray-500 ml-6 hover:text-gym-red transition-colors underline decoration-dotted underline-offset-4"
                    >
                        Lakhnadon, Madhya Pradesh, 480886
                    </a>
                </div>
                
                <div>
                    <h4 className="font-black font-sans italic text-xl mb-3 text-black dark:text-white flex items-center gap-2">
                        <Phone size={18} className="text-gym-red" /> DIRECT LINE
                    </h4>
                    
                    {/* CALL BUTTON */}
                    <a 
                        href="tel:+919131179343"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-gym-red text-white font-dot font-bold text-xs tracking-widest uppercase hover:bg-red-700 transition-all shadow-lg rounded-sm mb-3 group"
                    >
                        <Phone size={14} className="group-hover:animate-bounce" /> INITIATE_CALL
                    </a>

                    <a href="tel:+919131179343" className="block font-sans text-sm text-gray-500 font-bold ml-1 hover:text-white transition-colors">
                        +91 91311 79343
                    </a>
                    <a href="mailto:brothersfitnesszone@gmail.com" className="block font-sans text-sm text-gray-500 ml-1 hover:text-white transition-colors">
                        brothersfitnesszone@gmail.com
                    </a>
                </div>
                
                <div className="p-4 bg-gym-red/10 border border-gym-red/20 rounded-sm">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-gym-red shrink-0" size={20} />
                        <p className="text-xs font-sans text-gray-600 dark:text-gray-400">
                            <span className="text-gym-red font-bold">NOTE:</span> We respond to all inquiries within 24 hours.
                        </p>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </section>
  );
}