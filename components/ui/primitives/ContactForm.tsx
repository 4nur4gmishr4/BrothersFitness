"use client";

import React, { useState } from "react";
import {
  MapPin,
  Send,
  Loader2,
  ExternalLink,
  Clock,
  Navigation,
  CheckCircle2,
  Mail,
  Instagram,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatedPhone, AnimatedWhatsApp } from "@/components/ui/icons";

export default function ContactForm() {
  return (
    <section id="contact" className="w-full select-none">
      <div className="w-full">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">
              GYM LOCATION &amp; CONTACT US
            </p>
            <h2 className="heading-display text-4xl md:text-5xl lg:text-6xl text-hi leading-[0.95] tracking-tight uppercase">
              VISIT US &amp; <span className="text-accent">GET IN TOUCH</span>
            </h2>
          </div>

          <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-surface-border pl-4 md:pl-0 md:pr-4">
            <p className="text-sm font-medium text-hi">Lakhnadon &bull; Seoni Road</p>
            <p className="text-xs text-mid">Call us, message on WhatsApp, or see our gym on map</p>
          </div>
        </div>

        {/* 2-Column Stretched Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
          {/* Left Column: Direct Coach Contacts & Inquiry Form */}
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-accent">
                  Talk To Our Coaches
                </span>
                <span className="text-[11px] font-semibold text-mid">Quick reply in 15 minutes</span>
              </div>

              {/* Coach Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {/* Aman Shrivastava */}
                <div className="p-3.5 rounded-xl bg-surface-soft border border-surface-border flex flex-col justify-between hover:border-accent/40 transition-all duration-150">
                  <div className="mb-3">
                    <span className="text-xs font-bold text-hi block">Aman Shrivastava</span>
                    <span className="text-[11px] text-mid">Head Coach &bull; Founder</span>
                    <span className="text-[11px] font-medium text-hi mt-1 block">+91 91311 79343</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-surface-border/60">
                    <a
                      href="tel:+919131179343"
                      className="py-1.5 px-1 text-xs font-semibold bg-surface-card border border-surface-border text-hi hover:text-[#007AFF] hover:border-[#007AFF]/50 rounded-lg active:scale-95 transition-all flex items-center justify-center shadow-xs"
                      title="Call Aman (+91 91311 79343)"
                      aria-label="Call Aman"
                    >
                      <AnimatedPhone size={14} />
                    </a>
                    <a
                      href="https://wa.me/919131179343?text=Hi%20Aman,%20I%20want%20to%20inquire%20about%20Brother's%20Fitness%20membership!"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-1 text-xs font-semibold bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 rounded-lg active:scale-95 transition-all flex items-center justify-center shadow-xs"
                      title="WhatsApp Aman"
                      aria-label="WhatsApp Aman"
                    >
                      <AnimatedWhatsApp size={14} />
                    </a>
                    <a
                      href="https://www.instagram.com/aman_shrivastavaaa72"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-1 text-xs font-semibold bg-[#E1306C]/10 border border-[#E1306C]/30 text-[#E1306C] hover:bg-[#E1306C]/20 rounded-lg active:scale-95 transition-all flex items-center justify-center shadow-xs"
                      title="Aman on Instagram"
                      aria-label="Aman Instagram"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href="mailto:brothersfitnesszone@gmail.com?subject=Message%20for%20Coach%20Aman"
                      className="py-1.5 px-1 text-xs font-semibold bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 rounded-lg active:scale-95 transition-all flex items-center justify-center shadow-xs"
                      title="Email Coach Aman"
                      aria-label="Email Aman"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Pradeep Shrivastava */}
                <div className="p-3.5 rounded-xl bg-surface-soft border border-surface-border flex flex-col justify-between hover:border-accent/40 transition-all duration-150">
                  <div className="mb-3">
                    <span className="text-xs font-bold text-hi block">Pradeep Shrivastava</span>
                    <span className="text-[11px] text-mid">Senior Trainer &bull; Co-Founder</span>
                    <span className="text-[11px] font-medium text-hi mt-1 block">+91 91312 72754</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-surface-border/60">
                    <a
                      href="tel:+919131272754"
                      className="py-1.5 px-1 text-xs font-semibold bg-surface-card border border-surface-border text-hi hover:text-[#007AFF] hover:border-[#007AFF]/50 rounded-lg active:scale-95 transition-all flex items-center justify-center shadow-xs"
                      title="Call Pradeep (+91 91312 72754)"
                      aria-label="Call Pradeep"
                    >
                      <AnimatedPhone size={14} />
                    </a>
                    <a
                      href="https://wa.me/919131272754?text=Hi%20Pradeep,%20I%20want%20to%20inquire%20about%20training%20at%20Brother's%20Fitness!"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-1 text-xs font-semibold bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 rounded-lg active:scale-95 transition-all flex items-center justify-center shadow-xs"
                      title="WhatsApp Pradeep"
                      aria-label="WhatsApp Pradeep"
                    >
                      <AnimatedWhatsApp size={14} />
                    </a>
                    <a
                      href="https://www.instagram.com/brothers_fitness_17"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-1 text-xs font-semibold bg-[#E1306C]/10 border border-[#E1306C]/30 text-[#E1306C] hover:bg-[#E1306C]/20 rounded-lg active:scale-95 transition-all flex items-center justify-center shadow-xs"
                      title="Gym & Trainer Instagram"
                      aria-label="Trainer Instagram"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href="mailto:brothersfitnesszone@gmail.com?subject=Message%20for%20Coach%20Pradeep"
                      className="py-1.5 px-1 text-xs font-semibold bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 rounded-lg active:scale-95 transition-all flex items-center justify-center shadow-xs"
                      title="Email Coach Pradeep"
                      aria-label="Email Pradeep"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Minimalist Message Form */}
              <ContactFormLogic />
            </div>
          </div>

          {/* Right Column: Apple-Grade Map Showcase */}
          <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
            {/* Map Top Status Bar */}
            <div className="p-4 sm:p-5 bg-surface-card border-b border-surface-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-status-success shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-bold text-hi block truncate">Lakhnadon Branch Open</span>
                  <span className="text-[11px] text-mid truncate block">Mon–Sat 6:00 AM – 10:00 PM &bull; Sun Closed</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-mid shrink-0">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span className="font-semibold text-hi">Women: 4:30 – 6:30 PM</span>
              </div>
            </div>

            {/* Map Iframe Frame */}
            <div className="relative w-full flex-1 min-h-[300px] sm:min-h-[360px] bg-surface-soft">
              <iframe
                src="https://www.google.com/maps?q=22.59908339631551,79.61152925095537&z=16&hl=en&output=embed"
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Brother's Fitness Lakhnadon Location Map"
              />
            </div>

            {/* Map Bottom Action Bar */}
            <div className="p-4 sm:p-5 bg-surface-card border-t border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-hi block">Brother&apos;s Fitness Lakhnadon</span>
                  <span className="text-[11px] text-mid block">
                    Near Civil Court, Seoni Road, Lakhnadon, MP 480886 &bull; brothersfitnesszone@gmail.com
                  </span>
                </div>
              </div>

              <a
                href="https://www.google.com/maps?q=22.59907,79.61161"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-bold text-hi bg-surface-soft border border-surface-border hover:border-accent hover:text-accent rounded-full active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs group"
              >
                <Navigation className="w-3.5 h-3.5 text-accent group-hover:translate-x-0.5 transition-transform" />
                <span>Get Directions</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactFormLogic() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");

      toast.success("Message sent! Coach Aman will reply shortly.");
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (err: unknown) {
      toast.error((err as Error).message || "Could not send message. Please try again or message on WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-5 rounded-xl bg-surface-soft border border-status-success/30 text-center space-y-2 animate-fade-in">
        <CheckCircle2 className="w-6 h-6 text-status-success mx-auto" />
        <h4 className="font-bold text-sm text-hi">Message Sent!</h4>
        <p className="text-xs text-mid leading-relaxed">
          Thank you! We will message you on WhatsApp or call you shortly.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-xs font-semibold text-accent hover:underline pt-2 inline-block"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t border-surface-border/70">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-widest text-hi">
          Send Us A Message
        </span>
        <span className="text-[10px] text-mid uppercase tracking-wide">Your info is safe</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-surface-soft border border-surface-border text-hi placeholder:text-mid/60 focus:outline-none focus:border-accent transition-colors"
          placeholder="Your Full Name *"
        />
        <input
          type="tel"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-surface-soft border border-surface-border text-hi placeholder:text-mid/60 focus:outline-none focus:border-accent transition-colors"
          placeholder="Phone / WhatsApp Number *"
        />
      </div>

      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-surface-soft border border-surface-border text-hi placeholder:text-mid/60 focus:outline-none focus:border-accent transition-colors"
        placeholder="Email Address (Optional)"
      />

      <textarea
        required
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        rows={3}
        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-surface-soft border border-surface-border text-hi placeholder:text-mid/60 focus:outline-none focus:border-accent transition-colors resize-none"
        placeholder="Ask your question or tell us what you need *"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 text-xs font-bold text-white bg-accent hover:bg-accent-hover active:scale-[0.99] transition-all rounded-full disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Sending Message...</span>
          </>
        ) : (
          <>
            <span>Send Message</span>
            <Send className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </form>
  );
}
