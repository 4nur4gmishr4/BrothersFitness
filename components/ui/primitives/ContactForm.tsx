"use client";

import { MapPin, Phone, Mail, MessageCircle, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactForm() {
  const phoneNumber = "+919131179343";
  const whatsappNumber = "919131179343";

  return (
    <section id="contact" className="surface-canvas py-16 md:py-24 relative overflow-hidden">
      {/* Subtle grid pattern - static */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          
          backgroundSize: "80px 80px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12 md:mb-16" data-reveal>
          <p className="label-text text-accent mb-3">CONTACT</p>
          <h2 className="heading-display text-4xl md:text-6xl mb-4 text-hi">
            CONTACT <span className="text-accent">US</span>
          </h2>
          <p className="body-text text-mid">REACH OUT — WE RESPOND WITHIN 24 HOURS.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Column 1: Contact Info & Message Form */}
          <div className="surface-card hairline p-6 md:p-8">
            {/* Response guarantee */}
            <div className="badge badge--success mb-8">
              We respond to your enquiry within 24 hours.
            </div>

            <div className="space-y-8">
              {/* Location */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 surface-elevated hairline flex items-center justify-center text-accent flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="label-text text-mid mb-1">LOCATION</h3>
                  <a
                    href="https://www.google.com/maps?q=22.59907,79.61161"
                    target="_blank" rel="noopener noreferrer"
                    className="heading-section text-lg md:text-xl text-hi hover:text-accent transition-colors duration-fast inline-block"
                  >
                    Lakhnadon, 480886, MP
                  </a>
                  <p className="body-text text-sm text-low mt-1">Click to view on Google Maps</p>
                </div>
              </div>

              {/* Phones */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 surface-elevated hairline flex items-center justify-center text-accent flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="label-text text-mid mb-1">PHONE (AMAN)</h3>
                    <p className="heading-section text-2xl md:text-3xl font-bold text-hi mb-4">
                      +91 91311 79343
                    </p>
                    <div className="flex gap-3 flex-col sm:flex-row">
                      <a
                        href={`tel:${phoneNumber}`}
                        className="btn-primary flex-1"
                        aria-label="Call Aman"
                      >
                        <Phone className="w-4 h-4" /> Call Now
                      </a>
                      <a
                        href={`https://wa.me/${whatsappNumber}?text=Hi%20Aman,%20I'm%20interested%20in%20joining%20Brother's%20Fitness!`}
                        target="_blank" rel="noopener noreferrer"
                        className="btn-secondary flex-1"
                        aria-label="WhatsApp Aman"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                    </div>
                  </div>

                  <div className="hairline-t pt-6">
                    <h3 className="label-text text-mid mb-1">PHONE (PRADEEP)</h3>
                    <p className="heading-section text-2xl md:text-3xl font-bold text-hi mb-4">
                      +91 91312 72754
                    </p>
                    <div className="flex gap-3 flex-col sm:flex-row">
                      <a href="tel:+919131272754" className="btn-primary flex-1" aria-label="Call Pradeep">
                        <Phone className="w-4 h-4" /> Call Now
                      </a>
                      <a
                        href="https://wa.me/919131272754?text=Hi%20Pradeep,%20I'm%20interested%20in%20joining%20Brother's%20Fitness!"
                        target="_blank" rel="noopener noreferrer"
                        className="btn-secondary flex-1"
                        aria-label="WhatsApp Pradeep"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 surface-elevated hairline flex items-center justify-center text-accent flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="label-text text-mid mb-1">EMAIL</h3>
                  <a
                    href="mailto:brothersfitnesszone@gmail.com"
                    className="body-text text-hi hover:text-accent transition-colors duration-fast break-all"
                  >
                    brothersfitnesszone@gmail.com
                  </a>
                </div>
              </div>

              {/* Contact form */}
              <div className="hairline-t pt-6">
                <h3 className="heading-section text-xl text-hi mb-6">SEND A MESSAGE</h3>
                <ContactFormLogic />
              </div>
            </div>
          </div>

          {/* Column 2: Map */}
          <div className="relative min-h-[450px] lg:min-h-full surface-card hairline overflow-hidden">
            <iframe
              src="https://www.google.com/maps?q=22.59908339631551,79.61152925095537&z=16&hl=en&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "450px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Brother's Fitness location on Google Maps"
            />
            <div className="absolute bottom-4 left-4 surface-modal hairline px-4 py-3 pointer-events-none max-w-[calc(100%-2rem)]">
              <p className="label-text text-hi flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                <span>Lakhnadon, 480886, MP</span>
              </p>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label-text text-mid block mb-2">Name</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field"
          placeholder="Your Name"
        />
      </div>
      <div>
        <label className="label-text text-mid block mb-2">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="input-field"
          placeholder="+91..."
        />
      </div>
      <div>
        <label className="label-text text-mid block mb-2">Email</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="input-field"
          placeholder="your@email.com"
        />
      </div>
      <div>
        <label className="label-text text-mid block mb-2">Message</label>
        <textarea
          required
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="input-field h-24 resize-none"
          placeholder="How can we help you?"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Send Message <Send className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

