"use client";

import React, { useState } from "react";
import {
  MapPin,
  Send,
  Loader2,
  ExternalLink,
  Phone,
  Clock,
  Navigation,
  CheckCircle2,
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
              HEADQUARTERS &amp; INQUIRIES
            </p>
            <h2 className="heading-display text-4xl md:text-5xl lg:text-6xl text-hi leading-[0.95] tracking-tight uppercase">
              FIND US &amp; <span className="text-accent">CONNECT</span>
            </h2>
          </div>

          <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-surface-border pl-4 md:pl-0 md:pr-4">
            <p className="text-sm font-medium text-hi">Lakhnadon Branch &bull; Seoni Road</p>
            <p className="text-xs text-mid">Instant WhatsApp inquiries, phone calls &amp; direct GPS navigation</p>
          </div>
        </div>

        {/* 2-Column Stretched Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
          {/* Left Column: Direct Coach Contacts & Inquiry Form */}
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-accent">
                  Direct Coach Access
                </span>
                <span className="text-[11px] font-semibold text-mid">Avg response: &lt;15 mins</span>
              </div>

              {/* Coach Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {/* Aman Shrivastava */}
                <div className="p-3.5 rounded-xl bg-surface-soft border border-surface-border flex flex-col justify-between hover:border-accent/40 transition-all duration-150">
                  <div className="mb-3">
                    <span className="text-xs font-bold text-hi block">Aman Shrivastava</span>
                    <span className="text-[11px] text-mid">Head Coach &bull; CSCS</span>
                    <span className="text-[11px] font-medium text-hi mt-1 block">+91 91311 79343</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-surface-border/60">
                    <a
                      href="tel:+919131179343"
                      className="flex-1 py-1.5 px-2 text-xs font-semibold bg-surface-card border border-surface-border text-hi hover:text-accent hover:border-accent/50 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      title="Call Aman"
                    >
                      <AnimatedPhone size={13} />
                      <span>Call</span>
                    </a>
                    <a
                      href="https://wa.me/919131179343?text=Hi%20Aman,%20I%20want%20to%20inquire%20about%20Brother's%20Fitness%20membership!"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2 text-xs font-semibold bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      title="WhatsApp Aman"
                    >
                      <AnimatedWhatsApp size={13} />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Pradeep Shrivastava */}
                <div className="p-3.5 rounded-xl bg-surface-soft border border-surface-border flex flex-col justify-between hover:border-accent/40 transition-all duration-150">
                  <div className="mb-3">
                    <span className="text-xs font-bold text-hi block">Pradeep Shrivastava</span>
                    <span className="text-[11px] text-mid">Senior Trainer &bull; Strength</span>
                    <span className="text-[11px] font-medium text-hi mt-1 block">+91 91312 72754</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-surface-border/60">
                    <a
                      href="tel:+919131272754"
                      className="flex-1 py-1.5 px-2 text-xs font-semibold bg-surface-card border border-surface-border text-hi hover:text-accent hover:border-accent/50 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      title="Call Pradeep"
                    >
                      <AnimatedPhone size={13} />
                      <span>Call</span>
                    </a>
                    <a
                      href="https://wa.me/919131272754?text=Hi%20Pradeep,%20I%20want%20to%20inquire%20about%20training%20at%20Brother's%20Fitness!"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2 text-xs font-semibold bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      title="WhatsApp Pradeep"
                    >
                      <AnimatedWhatsApp size={13} />
                      <span>WhatsApp</span>
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
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-success" />
                </span>
                <div className="truncate">
                  <span className="text-xs font-bold text-hi block truncate">Lakhnadon Branch Open</span>
                  <span className="text-[11px] text-mid truncate block">Open Today &bull; Closes 10:00 PM</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-mid shrink-0">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span className="font-semibold text-hi">6:00 AM – 10:00 PM</span>
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
                  <span className="text-xs font-bold text-hi block">Brother&apos;s Fitness Gymnasium</span>
                  <span className="text-[11px] text-mid block">
                    Near Civil Court, Seoni Road, Lakhnadon, MP 480886
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

      toast.success("Inquiry sent successfully! Coach Aman will get in touch shortly.");
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to send inquiry. Please try again or WhatsApp directly.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-5 rounded-xl bg-surface-soft border border-status-success/30 text-center space-y-2 animate-fade-in">
        <CheckCircle2 className="w-6 h-6 text-status-success mx-auto" />
        <h4 className="font-bold text-sm text-hi">Inquiry Received</h4>
        <p className="text-xs text-mid leading-relaxed">
          Thank you for reaching out. We will review your inquiry and message you on WhatsApp or call you shortly.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-xs font-semibold text-accent hover:underline pt-2 inline-block"
        >
          Send another inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t border-surface-border/70">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-widest text-hi">
          Send a Direct Message
        </span>
        <span className="text-[10px] text-mid uppercase tracking-wide">All fields secure</span>
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
        placeholder="What is your fitness goal or membership question? *"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 text-xs font-bold text-white bg-accent hover:bg-accent-hover active:scale-[0.99] transition-all rounded-full disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Sending Inquiry...</span>
          </>
        ) : (
          <>
            <span>Submit Inquiry</span>
            <Send className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </form>
  );
}
