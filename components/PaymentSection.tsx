"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, User, Users, Phone, QrCode, Smartphone, MessageCircle, ExternalLink, CheckCircle } from "lucide-react";
import Image from "next/image";

type PaymentStep = "plan" | "details" | "paymentChoice" | "qrCode";

export default function PaymentSection() {
  const [step, setStep] = useState<PaymentStep>("plan");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "quarterly" | null>(null);
  const [formData, setFormData] = useState({ name: "", gender: "", mobile: "" });

  const AMAN_WHATSAPP = "919131179343";
  const UPI_ID = "annushrivastava112@okicici";
  const PAYEE_NAME = "Aman Brothers Fitness";

  const plans = [
    { id: "monthly", price: 700, duration: "1 Month", label: "MONTHLY" },
    { id: "quarterly", price: 1800, duration: "3 Months", label: "QUARTERLY", save: "Save ₹300" }
  ];

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  // Handle browser back button - navigate to previous step
  const handlePopState = useCallback(() => {
    const state = window.history.state;
    if (state && state.paymentStep) {
      setStep(state.paymentStep);
    } else {
      setStep("plan");
    }
  }, []);

  useEffect(() => {
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [handlePopState]);

  // Navigate to a step with history management
  const navigateToStep = (newStep: PaymentStep) => {
    // Push new state to history
    window.history.pushState({ paymentStep: newStep }, "", window.location.href);
    setStep(newStep);
  };

  // Go back to previous step
  const goBack = () => {
    window.history.back();
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.gender && formData.mobile.length === 10) {
      navigateToStep("paymentChoice");
    }
  };

  // Generate UPI deep link that opens UPI apps with pre-filled payment details
  const openUPIApp = () => {
    if (!selectedPlanData) return;

    const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${selectedPlanData.price}&cu=INR&tn=${encodeURIComponent(`Brothers Fitness ${selectedPlanData.label} Membership - ${formData.name}`)}`;

    window.location.href = upiUrl;
  };

  const generateWhatsAppMessage = (includePaymentConfirm: boolean = false) => {
    const plan = selectedPlanData;
    if (!plan) return "";

    const baseMessage = `🏋️ Brothers Fitness - New Membership

Name: ${formData.name}
Gender: ${formData.gender}
Mobile: ${formData.mobile}
Plan: ${plan.label} (${plan.duration})
Amount: ₹${plan.price}`;

    if (includePaymentConfirm) {
      return `${baseMessage}

Status: ✅ Payment Completed
Screenshot: Attached

Please activate my membership. Thank you!`;
    }

    return baseMessage;
  };

  const openWhatsApp = (includePaymentConfirm: boolean = false) => {
    const message = generateWhatsAppMessage(includePaymentConfirm);
    const url = `https://wa.me/${AMAN_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const resetFlow = () => {
    // Replace current state instead of pushing
    window.history.replaceState({ paymentStep: "plan" }, "", window.location.href);
    setStep("plan");
    setSelectedPlan(null);
    setFormData({ name: "", gender: "", mobile: "" });
  };

  return (
    <section id="payment" className="relative min-h-screen bg-black text-white py-20 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(215,25,33,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(215,25,33,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gym-red/10 border border-gym-red/20 rounded-full mb-6">
            <CreditCard className="w-4 h-4 text-gym-red" />
            <span className="text-xs font-mono uppercase tracking-wider text-gym-red">Secure Payment</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black uppercase tracking-tighter mb-4">
            JOIN THE BROTHERHOOD
          </h2>
          <p className="text-gray-300 font-mono text-sm uppercase tracking-wide">
            {step === "plan" && "Select Your Plan"}
            {step === "details" && "Your Membership Details"}
            {step === "paymentChoice" && "Choose Payment Method"}
            {step === "qrCode" && "Scan QR Code"}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Plan Selection */}
          {step === "plan" && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {plans.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => {
                    setSelectedPlan(plan.id as "monthly" | "quarterly");
                    navigateToStep("details");
                  }}
                  className="relative border-2 border-white/10 bg-white/5 hover:border-gym-red/50 rounded-lg p-8 cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(215,25,33,0.2)] group"
                >
                  {plan.save && (
                    <div className="absolute -top-3 right-6 bg-gym-red px-3 py-1 rounded-full">
                      <span className="text-xs font-bold uppercase">{plan.save}</span>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-gray-300 mb-2">
                      {plan.label}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1 mb-1">
                      <span className="text-5xl font-black text-white group-hover:text-gym-red transition-colors">₹{plan.price}</span>
                    </div>
                    <p className="text-gray-500 font-mono text-xs uppercase mb-4">
                      {plan.duration}
                    </p>
                    <div className="text-gym-red font-mono text-xs uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to Select →
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* STEP 2: Membership Details Form */}
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="border border-gym-red/20 rounded-lg p-8 bg-white/5 backdrop-blur-sm">
                {/* Selected Plan Summary */}
                <div className="bg-gym-red/10 border border-gym-red/20 rounded-lg p-4 mb-6 text-center">
                  <p className="text-xs font-mono uppercase text-gray-400 mb-1">Selected Plan</p>
                  <p className="text-2xl font-display font-black text-gym-red">
                    {selectedPlanData?.label} - ₹{selectedPlanData?.price}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{selectedPlanData?.duration}</p>
                </div>

                <h3 className="text-2xl font-display font-bold uppercase tracking-tight mb-6 text-center">
                  Membership Details
                </h3>

                <form onSubmit={handleDetailsSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-mono uppercase tracking-wide text-gray-400 mb-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white focus:border-gym-red focus:outline-none transition-colors"
                      placeholder="Enter your name"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-mono uppercase tracking-wide text-gray-400 mb-2">
                      <Users className="w-4 h-4" />
                      Gender
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Male", "Female", "Other"].map((gender) => (
                        <button
                          key={gender}
                          type="button"
                          onClick={() => setFormData({ ...formData, gender })}
                          className={`py-3 rounded border-2 font-mono text-sm uppercase tracking-wide transition-all ${formData.gender === gender
                            ? "border-gym-red bg-gym-red/10 text-gym-red"
                            : "border-white/10 text-gray-400 hover:border-white/30"
                            }`}
                        >
                          {gender}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-mono uppercase tracking-wide text-gray-300 mb-2">
                      <Phone className="w-4 h-4" />
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })}
                      className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white focus:border-gym-red focus:outline-none transition-colors"
                      placeholder="10-digit mobile number"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 border border-white/20 hover:border-gym-red text-white font-mono uppercase tracking-wide py-3 rounded transition-all"
                      aria-label="Go back to plan selection"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={!formData.name || !formData.gender || formData.mobile.length !== 10}
                      className="flex-1 bg-gym-red hover:bg-gym-red/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-display font-bold uppercase tracking-wider py-3 rounded transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                      aria-label="Proceed to payment options"
                    >
                      Go to Payments →
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Payment Method Choice */}
          {step === "paymentChoice" && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* UPI App - Opens UPI app directly with pre-filled payment */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  onClick={openUPIApp}
                  className="border-2 border-white/10 bg-white/5 hover:border-gym-red/50 rounded-lg p-8 cursor-pointer transition-all group"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gym-red/10 rounded-full flex items-center justify-center group-hover:bg-gym-red/20 transition-colors">
                      <Smartphone className="w-10 h-10 text-gym-red" />
                    </div>
                    <h3 className="text-2xl font-display font-bold uppercase mb-3">
                      Pay via UPI App
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Opens your UPI app (GPay, PhonePe, Paytm, etc.) with payment details pre-filled
                    </p>
                    <div className="text-gym-red font-mono text-xs uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                      Opens UPI App →
                    </div>
                  </div>
                </motion.div>

                {/* QR Code */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigateToStep("qrCode")}
                  className="border-2 border-white/10 bg-white/5 hover:border-gym-red/50 rounded-lg p-8 cursor-pointer transition-all group"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gym-red/10 rounded-full flex items-center justify-center group-hover:bg-gym-red/20 transition-colors">
                      <QrCode className="w-10 h-10 text-gym-red" />
                    </div>
                    <h3 className="text-2xl font-display font-bold uppercase mb-3">
                      Pay via QR Code
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Scan QR code to make payment instantly
                    </p>
                    <div className="text-gym-red font-mono text-xs uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to Continue →
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* WhatsApp Section - After Payment */}
              <div className="mt-8 border border-[#25D366]/30 rounded-lg p-6 bg-[#25D366]/5">
                <div className="text-center">
                  <p className="text-gray-400 font-mono text-xs uppercase mb-4">
                    After completing payment, send your screenshot via WhatsApp:
                  </p>
                  <button
                    onClick={() => openWhatsApp(true)}
                    className="bg-[#25D366] hover:bg-[#20BA5A] text-white font-display font-bold uppercase tracking-wider py-3 px-8 rounded transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 mx-auto"
                    aria-label="Send payment screenshot via WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Send Payment Screenshot
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={goBack}
                  className="text-gray-300 hover:text-white font-mono text-sm uppercase tracking-wide transition-colors"
                  aria-label="Go back to membership details"
                >
                  ← Back to Details
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: QR Code Payment */}
          {step === "qrCode" && (
            <motion.div
              key="qrCode"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="border border-gym-red/20 rounded-lg p-8 bg-white/5 backdrop-blur-sm">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gym-red/10 rounded-full flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-gym-red" />
                  </div>
                  <h3 className="text-3xl font-display font-black uppercase mb-2">
                    Scan & Pay ₹{selectedPlanData?.price}
                  </h3>
                  <p className="text-gray-400 font-mono text-sm">
                    {selectedPlanData?.duration}
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-72 h-72 border-4 border-gym-red/20 rounded-lg overflow-hidden bg-white p-4">
                    <Image
                      src="/assets/QRCode.jpeg"
                      alt="Payment QR Code"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* UPI ID Fallback */}
                <div className="bg-black/50 border border-white/10 rounded-lg p-4 mb-6 text-center">
                  <p className="text-gray-400 font-mono text-xs uppercase mb-2">Or use UPI ID</p>
                  <p className="text-white font-mono text-lg break-all">
                    {UPI_ID}
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-gym-red/5 border border-gym-red/20 rounded-lg p-6 mb-6">
                  <p className="text-xs font-mono uppercase text-gray-400 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Payment Steps
                  </p>
                  <ol className="text-sm text-gray-300 space-y-3 list-decimal list-inside">
                    <li>Open any UPI app on your phone</li>
                    <li>Scan the QR code above</li>
                    <li>Pay <span className="text-gym-red font-semibold">₹{selectedPlanData?.price}</span></li>
                    <li>Take a <span className="text-gym-red font-semibold">screenshot</span> of the transaction</li>
                    <li>Click below to send confirmation via WhatsApp</li>
                  </ol>
                </div>

                {/* User Details */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                  <p className="text-xs font-mono uppercase text-gray-400 mb-3">Your Details:</p>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-400">Name:</span> <span className="text-white font-semibold">{formData.name}</span></p>
                    <p><span className="text-gray-400">Gender:</span> <span className="text-white font-semibold">{formData.gender}</span></p>
                    <p><span className="text-gray-400">Mobile:</span> <span className="text-white font-semibold">{formData.mobile}</span></p>
                  </div>
                </div>

                {/* WhatsApp Button */}
                <button
                  onClick={() => openWhatsApp(true)}
                  className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-display font-bold uppercase tracking-wider py-4 rounded transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 mb-4"
                  aria-label="Send payment confirmation via WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send Payment Screenshot via WhatsApp
                  <ExternalLink className="w-4 h-4" />
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={goBack}
                    className="flex-1 border border-white/20 hover:border-gym-red text-white font-mono uppercase text-sm py-3 rounded transition-all"
                    aria-label="Change payment method"
                  >
                    ← Change Method
                  </button>
                  <button
                    onClick={resetFlow}
                    className="flex-1 border border-white/20 hover:border-gym-red text-white font-mono uppercase text-sm py-3 rounded transition-all"
                    aria-label="Start payment process over"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}