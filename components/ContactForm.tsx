"use client";

import { MapPin, Phone, Mail, MessageCircle, Send, Loader2 } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

export default function ContactForm() {
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

  const phoneNumber = "+919131179343";
  const whatsappNumber = "919131179343";

  return (
    <section
      id="contact"
      ref={ref}
      className="min-h-screen bg-black py-12 md:py-20 relative overflow-hidden"
    >
      {/* Background grid - disabled on mobile for performance */}
      {!isMobile && (
        <div
          className="absolute inset-0 opacity-[0.02] animate-pulse"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="heading-display text-4xl md:text-6xl mb-4">
            CONTACT STATION
          </h2>
          <p className="text-lg text-gray-400 font-mono tracking-wide">
            BEGIN YOUR TRANSFORMATION. REACH OUT NOW.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto align-center">
          {/* Contact Layout: 2 Separated Columns */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

            {/* Column 1: Contact Info & Message Form Combined */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-black border-2 border-white rounded-xl overflow-hidden p-5 md:p-8 relative group"
            >
              {/* Animated Red Line on hover/view */}
              <motion.div
                className="absolute top-0 left-0 w-1 h-full bg-gym-red origin-top"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              />

              <div className="space-y-6 md:space-y-8 relative z-10">
                {/* Highlighting Text */}
                <div className="bg-white/5 border-l-2 border-green-500 p-3 md:p-4 mb-4 md:mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-green-500/10 animate-pulse" />
                  <p className="text-xs md:text-sm font-mono font-bold text-white uppercase tracking-wide relative z-10">
                    ⚡ We respond to your enquiry within 24 hours.
                  </p>
                </div>

                {/* Location */}
                <motion.div className="flex items-start gap-4" whileHover={{ x: 5 }}>
                  <MapPin className="w-5 h-5 md:w-6 md:h-6 text-gym-red mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-[10px] md:text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1 md:mb-2">
                      LOCATION
                    </h3>
                    <a
                      href="https://www.google.com/maps?q=22.59907,79.61161"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base md:text-lg font-sans text-white leading-relaxed hover:text-gym-red transition-colors cursor-pointer inline-block"
                    >
                      Lakhnadon, 480886, MP
                    </a>
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      Click to view on Google Maps
                    </p>
                  </div>
                </motion.div>

                {/* Phone Aman */}
                <motion.div className="flex items-start gap-4" whileHover={{ x: 5 }}>
                  <Phone className="w-5 h-5 md:w-6 md:h-6 text-gym-red mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-[10px] md:text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1 md:mb-2">
                      PHONE (AMAN)
                    </h3>
                    <p className="text-xl md:text-2xl font-display font-bold text-white mb-4 md:mb-5">
                      +91 91311 79343
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-3 md:gap-4 flex-col sm:flex-row mb-6">
                      <motion.a
                        href={`tel:${phoneNumber}`}
                        className="flex-1 bg-gym-red text-white px-3 py-3 md:px-4 md:py-3.5 text-xs font-mono font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 rounded"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Phone className="w-3 h-3 md:w-4 md:h-4" />
                        Call Now
                      </motion.a>

                      <motion.a
                        href={`https://wa.me/${whatsappNumber}?text=Hi%20Aman,%20I'm%20interested%20in%20joining%20Brother's%20Fitness!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#25D366] text-white px-3 py-3 md:px-4 md:py-3.5 text-xs font-mono font-bold uppercase tracking-wider hover:bg-white hover:text-[#25D366] transition-all flex items-center justify-center gap-2 rounded"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <MessageCircle className="w-3 h-3 md:w-4 md:h-4" />
                        WhatsApp
                      </motion.a>
                    </div>

                    <div className="w-full h-[1px] bg-white/10 mb-6" />

                    <h3 className="text-[10px] md:text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1 md:mb-2">
                      PHONE (PRADEEP)
                    </h3>
                    <p className="text-xl md:text-2xl font-display font-bold text-white mb-4 md:mb-5">
                      +91 91312 72754
                    </p>

                    {/* Action Buttons - Pradeep */}
                    <div className="flex gap-3 md:gap-4 flex-col sm:flex-row">
                      <motion.a
                        href="tel:+919131272754"
                        className="flex-1 bg-gym-red text-white px-3 py-3 md:px-4 md:py-3.5 text-xs font-mono font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 rounded"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Phone className="w-3 h-3 md:w-4 md:h-4" />
                        Call Now
                      </motion.a>

                      <motion.a
                        href="https://wa.me/919131272754?text=Hi%20Pradeep,%20I'm%20interested%20in%20joining%20Brother's%20Fitness!"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#25D366] text-white px-3 py-3 md:px-4 md:py-3.5 text-xs font-mono font-bold uppercase tracking-wider hover:bg-white hover:text-[#25D366] transition-all flex items-center justify-center gap-2 rounded"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <MessageCircle className="w-3 h-3 md:w-4 md:h-4" />
                        WhatsApp
                      </motion.a>
                    </div>
                  </div>
                </motion.div>

                {/* Email */}
                <motion.div className="flex items-start gap-4" whileHover={{ x: 5 }}>
                  <Mail className="w-5 h-5 md:w-6 md:h-6 text-gym-red mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-[10px] md:text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1 md:mb-2">
                      EMAIL
                    </h3>
                    <a
                      href="mailto:brothersfitnesszone@gmail.com"
                      className="text-sm md:text-lg font-sans text-white hover:text-gym-red transition-colors break-all"
                    >
                      brothersfitnesszone@gmail.com
                    </a>
                  </div>
                </motion.div>

                <div className="w-full h-[1px] bg-white/10" />

                {/* Integrated Contact Form */}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <div className="flex items-center gap-2 mb-6">
                    <MessageCircle className="w-5 h-5 text-white" />
                    <h3 className="text-xl font-display font-bold text-white">SEND A MESSAGE</h3>
                  </div>
                  <ContactFormLogic />
                </motion.div>

              </div>
            </motion.div>

            {/* Column 2: Map Card Only */}
            <motion.div
              className="relative h-full min-h-[450px] md:min-h-full bg-gray-900 border-2 border-white rounded-xl overflow-hidden"
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="absolute inset-0 hover:grayscale-0 transition-all duration-700">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!4v1767551049933!6m8!1m7!1sVgx1G-8DgYzc7r9doCFl-w!2m2!1d22.59908339631551!2d79.61152925095537!3f152.81242427702475!4f-7.897474045401708!5f0.7820865974627469"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Brother's Fitness 3D Map View"
                />
              </div>

              {/* Overlay Label */}
              <div className="absolute bottom-4 left-4 bg-black/90 px-4 py-2 md:bottom-6 md:left-6 md:px-6 md:py-3 border-l-4 border-gym-red backdrop-blur-sm pointer-events-none max-w-[calc(100%-2rem)]">
                <p className="text-xs md:text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 md:gap-3 flex-wrap">
                  <MapPin className="w-3 h-3 md:w-4 md:h-4 text-gym-red" />
                  <span>Lakhnadon, 480886, MP</span>
                </p>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}

function ContactFormLogic() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send message');

      toast.success('Message sent successfully! We will contact you shortly. 🚀');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-mono text-gray-400 mb-1 uppercase">Name</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-gym-red focus:outline-none transition-colors"
          placeholder="Your Name"
        />
      </div>
      <div>
        <label className="block text-xs font-mono text-gray-400 mb-1 uppercase">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
          className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-gym-red focus:outline-none transition-colors"
          placeholder="+91..."
        />
      </div>
      <div>
        <label className="block text-xs font-mono text-gray-400 mb-1 uppercase">Email</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-gym-red focus:outline-none transition-colors"
          placeholder="your@email.com"
        />
      </div>
      <div>
        <label className="block text-xs font-mono text-gray-400 mb-1 uppercase">Message</label>
        <textarea
          required
          value={formData.message}
          onChange={e => setFormData({ ...formData, message: e.target.value })}
          className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-gym-red focus:outline-none transition-colors h-24 resize-none"
          placeholder="How can we help you?"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black font-bold uppercase py-3 rounded-lg hover:bg-gym-red hover:text-white transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Send Message <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  );
}
