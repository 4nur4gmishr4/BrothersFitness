"use client";

import React, { useState } from "react";
import { MapPin, Phone, Mail, MessageCircle, Send, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function ContactForm() {
  return (
    <section id="contact" className="w-full select-none">
      <div className="w-full">
        
        {/* Big Display Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">
              GET IN TOUCH
            </p>
            <h2 className="heading-display text-4xl md:text-5xl lg:text-6xl text-hi leading-[0.95] tracking-tight uppercase">
              LOCATION &amp; <span className="text-accent">CONTACT</span>
            </h2>
          </div>
          
          <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-surface-border pl-4 md:pl-0 md:pr-4">
            <p className="text-sm font-medium text-hi">Direct Coach Inquiries</p>
            <p className="text-xs text-mid">Call, WhatsApp or visit us in Lakhnadon, MP</p>
          </div>
        </div>

        {/* Compact 2-Column iOS Layout Stretched Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
          
          {/* Left Column: Direct Action Contacts & Quick Form */}
          <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
            
            {/* Quick Contact Rows (iOS List Style) */}
            <div className="space-y-3 mb-4">
              
              {/* Aman Shrivastava */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-soft border border-surface-border/70">
                <div>
                  <span className="text-xs font-semibold text-hi block">Aman Shrivastava</span>
                  <span className="text-[11px] text-mid">Head Coach &bull; +91 91311 79343</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href="tel:+919131179343"
                    className="px-2.5 py-1 text-xs font-medium bg-accent text-white rounded-full hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" /> Call
                  </a>
                  <a
                    href="https://wa.me/919131179343?text=Hi%20Aman,%20I'm%20interested%20in%20joining%20Brother's%20Fitness!"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-xs font-medium bg-[#25D366] text-white rounded-full hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </a>
                </div>
              </div>

              {/* Pradeep Shrivastava */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-soft border border-surface-border/70">
                <div>
                  <span className="text-xs font-semibold text-hi block">Pradeep Shrivastava</span>
                  <span className="text-[11px] text-mid">Senior Trainer &bull; +91 91312 72754</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href="tel:+919131272754"
                    className="px-2.5 py-1 text-xs font-medium bg-accent text-white rounded-full hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" /> Call
                  </a>
                  <a
                    href="https://wa.me/919131272754?text=Hi%20Pradeep,%20I'm%20interested%20in%20joining%20Brother's%20Fitness!"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-xs font-medium bg-[#25D366] text-white rounded-full hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </a>
                </div>
              </div>

            </div>

            {/* Compact Message Form */}
            <ContactFormLogic />
          </div>

          {/* Right Column: Compact Map & Address */}
          <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between min-h-[300px] md:min-h-full">
            
            {/* Map Frame */}
            <div className="relative w-full flex-1 min-h-[220px]">
              <iframe
                src="https://www.google.com/maps?q=22.59908339631551,79.61152925095537&z=16&hl=en&output=embed"
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Brother's Fitness location"
              />
            </div>

            {/* Address Footer */}
            <div className="p-3.5 sm:p-4 bg-surface-card border-t border-surface-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-semibold text-hi block truncate">Brother&apos;s Fitness</span>
                  <span className="text-[11px] text-mid truncate block">Lakhnadon, Seoni Road, MP 480886</span>
                </div>
              </div>

              <a
                href="https://www.google.com/maps?q=22.59907,79.61161"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-medium text-hi bg-surface-soft border border-surface-border rounded-full hover:bg-surface-elevated active:scale-95 transition-all flex-shrink-0 inline-flex items-center gap-1"
              >
                <span>Directions</span>
                <ExternalLink className="w-3 h-3" />
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

      toast.success("Message sent successfully! We will contact you shortly.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (err: unknown) {
      toast.error((err as Error).message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 pt-2 border-t border-surface-border/60">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 text-xs rounded-xl bg-surface-soft border border-surface-border text-hi placeholder:text-mid/60 focus:outline-none focus:border-accent"
          placeholder="Your Name"
        />
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2 text-xs rounded-xl bg-surface-soft border border-surface-border text-hi placeholder:text-mid/60 focus:outline-none focus:border-accent"
          placeholder="Phone Number"
        />
      </div>

      <input
        type="email"
        required
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-soft border border-surface-border text-hi placeholder:text-mid/60 focus:outline-none focus:border-accent"
        placeholder="Email address"
      />

      <textarea
        required
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        rows={2}
        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-soft border border-surface-border text-hi placeholder:text-mid/60 focus:outline-none focus:border-accent resize-none"
        placeholder="Your inquiry or message..."
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 text-xs font-semibold text-white bg-accent rounded-full hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <span>Send Message</span>
            <Send className="w-3 h-3" />
          </>
        )}
      </button>
    </form>
  );
}
