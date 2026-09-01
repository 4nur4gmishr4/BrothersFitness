"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { User, Users, Phone, QrCode, Smartphone, MessageCircle, ExternalLink, CheckCircle } from "lucide-react";
import Image from "next/image";

type PaymentStep = "plan" | "details" | "paymentChoice" | "qrCode";

export default function PaymentSection() {
  const [step, setStep] = useState<PaymentStep>("plan");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "quarterly" | null>(null);
  const [formData, setFormData] = useState({ name: "", gender: "", mobile: "" });

  // History depth the section mounted at. Every forward step calls pushState, so
  // once the flow finishes we can collapse those entries with history.go(-N) —
  // otherwise the browser back button later re-enters the wizard from a stale
  // paymentStep on an unrelated page (H7 fix).
  const baseIndexRef = useRef<number>(0);
  const isResettingRef = useRef(false);

  const AMAN_WHATSAPP = "919131179343";
  const UPI_ID = "annushrivastava112@okicici";
  const PAYEE_NAME = "Aman Brother's Fitness";

  const plans = [
    { id: "monthly", price: 700, duration: "1 Month", label: "MONTHLY" },
    { id: "quarterly", price: 1800, duration: "3 Months", label: "QUARTERLY", save: "Save ₹300" },
  ];

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  // Handle browser back button - navigate to previous step. Ignored while a
  // reset is collapsing the stack so the user doesn't see every intermediate
  // step flash past.
  const handlePopState = useCallback(() => {
    if (isResettingRef.current) return;
    const state = window.history.state;
    if (state && state.paymentStep) {
      setStep(state.paymentStep);
    } else {
      setStep("plan");
    }
  }, []);

  useEffect(() => {
    baseIndexRef.current = window.history.length;
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [handlePopState]);

  // Navigate to a step with history management
  const navigateToStep = (newStep: PaymentStep) => {
    window.history.pushState({ paymentStep: newStep }, "", window.location.href);
    setStep(newStep);
  };

  // Go back to previous step
  const goBack = () => {
    window.history.back();
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.gender || !formData.mobile) {
      return;
    }
    if (formData.mobile.length !== 10) {
      return;
    }
    navigateToStep("paymentChoice");
  };

  const generateWhatsAppMessage = (includePaymentConfirm: boolean = false) => {
    let message = `*NEW MEMBERSHIP REGISTRATION*\n\n`;
    message += `*Plan:* ${selectedPlanData?.label} (₹${selectedPlanData?.price} / ${selectedPlanData?.duration})\n`;
    message += `*Name:* ${formData.name}\n`;
    message += `*Gender:* ${formData.gender}\n`;
    message += `*Mobile:* ${formData.mobile}\n`;
    
    if (includePaymentConfirm) {
      message += `\n*Status:* Payment Completed via UPI\n`;
      message += `*Note:* Screenshot attached for verification`;
    }
    
    return message;
  };

  const openUPIApp = () => {
    if (!selectedPlanData) return;
    
    // Construct UPI payment URL with standard parameters
    const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${selectedPlanData.price}&cu=INR&tn=${encodeURIComponent(`Brother's Fitness ${selectedPlanData.label} - ${formData.name}`)}`;
    
    // Open UPI app directly
    window.location.href = upiUrl;
  };

  const openWhatsApp = (includePaymentConfirm: boolean = false) => {
    const message = generateWhatsAppMessage(includePaymentConfirm);
    const url = `https://wa.me/${AMAN_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const resetFlow = () => {
    // Collapse every payment entry we pushed since mount, so the browser back
    // button can't re-enter the wizard from a later page. history.go(-N) fires
    // popstate for each popped entry — suppress those with the reset flag and
    // clear it on the next tick once the stack has settled.
    const backCount = window.history.length - baseIndexRef.current;
    if (backCount > 0) {
      isResettingRef.current = true;
      window.history.go(-backCount);
      setTimeout(() => { isResettingRef.current = false; }, 0);
    } else {
      window.history.replaceState({ paymentStep: "plan" }, "", window.location.href);
    }
    setStep("plan");
    setSelectedPlan(null);
    setFormData({ name: "", gender: "", mobile: "" });
  };

  return (
    <section id="payment" className="surface-canvas text-hi py-12 md:py-20 relative overflow-hidden select-none">
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
        
        {/* Top Display Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-14 gap-6 pb-8 border-b border-surface-border/70">
          <div>
            <span className="text-xs uppercase tracking-widest text-accent mb-2 block font-semibold">
              GYM MEMBERSHIP &amp; FEES
            </span>
            <h1 className="heading-display text-4xl sm:text-6xl md:text-7xl text-hi leading-[0.95] tracking-tight uppercase">
              SELECT YOUR <span className="text-accent">MEMBERSHIP</span>
            </h1>
          </div>

          <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-surface-border pl-4 md:pl-0 md:pr-4">
            <p className="text-sm font-medium text-hi">No Admission Fees &bull; Easy UPI Payment</p>
            <p className="text-xs text-mid">
              {step === "plan" && "Choose your 1-month or 3-month gym plan"}
              {step === "details" && "Enter your name and mobile number"}
              {step === "paymentChoice" && "Pay with Google Pay, PhonePe, Paytm or QR code"}
              {step === "qrCode" && "Scan the QR code to complete your payment"}
            </p>
          </div>
        </div>

        {/* STEP 1: Plan Selection */}
        {step === "plan" && (
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => {
                  setSelectedPlan(plan.id as "monthly" | "quarterly");
                  navigateToStep("details");
                }}
                className={`relative p-8 rounded-2xl cursor-pointer transition-all duration-200 group bg-surface-card border ${
                  plan.save
                    ? "border-accent/80 shadow-sm"
                    : "border-surface-border hover:border-surface-border/90 hover:bg-surface-elevated"
                }`}
              >
                {plan.save && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-accent text-white text-xs font-bold rounded-full shadow-sm">
                    {plan.save}
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-xs uppercase tracking-widest text-mid mb-4 font-semibold">
                    {plan.label} PASS
                  </h3>
                  <p className="text-5xl sm:text-6xl font-extrabold text-hi group-hover:text-accent transition-colors duration-150">
                    ₹{plan.price}
                  </p>
                  <p className="text-xs text-mid mt-3">{plan.duration} • Zero Admission Fee</p>
                  <p className="text-xs font-semibold text-accent mt-6 group-hover:translate-x-1 transition-transform duration-150 inline-flex items-center gap-1">
                    Select Plan →
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 2: Membership Details Form */}
        {step === "details" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-surface-card border border-surface-border rounded-2xl p-6 sm:p-8 shadow-sm">
              {/* Selected Plan Summary */}
              <div className="bg-surface-elevated border border-accent/60 rounded-xl p-4 mb-6 text-center">
                <p className="text-xs text-mid mb-1">Selected Pass</p>
                <p className="text-2xl font-bold text-accent">
                  {selectedPlanData?.label} — ₹{selectedPlanData?.price}
                </p>
                <p className="text-xs text-mid mt-1">{selectedPlanData?.duration}</p>
              </div>

              <h3 className="text-xl font-bold text-hi mb-6 text-center">
                Member Information
              </h3>

              <form onSubmit={handleDetailsSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-mid flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-accent" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-soft border border-surface-border rounded-xl text-hi text-sm focus:outline-none focus:border-accent transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-mid flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-accent" /> Gender Batch
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Male", "Female", "Other"].map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender })}
                        className={`py-3 rounded-xl text-xs font-semibold transition-all duration-150 ${
                          formData.gender === gender
                            ? "bg-accent text-white shadow-sm"
                            : "bg-surface-soft border border-surface-border text-mid hover:text-hi hover:bg-surface-elevated"
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-mid flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-accent" /> Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-4 py-3 bg-surface-soft border border-surface-border rounded-xl text-hi text-sm focus:outline-none focus:border-accent transition-colors"
                    placeholder="10-digit phone number"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold bg-surface-soft border border-surface-border text-mid hover:text-hi hover:bg-surface-elevated active:scale-95 transition-all"
                    aria-label="Go back to plan selection"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.name || !formData.gender || formData.mobile.length !== 10}
                    className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold bg-accent text-white hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    aria-label="Proceed to payment options"
                  >
                    Continue to Payment →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STEP 3: Payment Method Choice */}
        {step === "paymentChoice" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* UPI App */}
              <div
                onClick={openUPIApp}
                className="bg-surface-card border border-surface-border hover:border-accent rounded-2xl p-8 cursor-pointer transition-all duration-150 group shadow-sm text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-soft border border-surface-border flex items-center justify-center group-hover:border-accent transition-colors">
                  <Smartphone className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-hi mb-2">Pay via UPI App</h3>
                <p className="text-xs text-mid mb-4">
                  Opens Google Pay, PhonePe, Paytm, or BHIM with ₹{selectedPlanData?.price} pre-filled
                </p>
                <span className="text-xs font-semibold text-accent group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Open UPI App →
                </span>
              </div>

              {/* QR Code */}
              <div
                onClick={() => navigateToStep("qrCode")}
                className="bg-surface-card border border-surface-border hover:border-accent rounded-2xl p-8 cursor-pointer transition-all duration-150 group shadow-sm text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-soft border border-surface-border flex items-center justify-center group-hover:border-accent transition-colors">
                  <QrCode className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-hi mb-2">Pay via QR Code</h3>
                <p className="text-xs text-mid mb-4">
                  Display high-resolution scanner code to pay with any UPI scanner
                </p>
                <span className="text-xs font-semibold text-accent group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Show QR Scanner →
                </span>
              </div>
            </div>

            {/* WhatsApp Confirmation */}
            <div className="bg-surface-card border border-surface-border rounded-2xl p-6 text-center shadow-sm">
              <p className="text-xs text-mid mb-3">
                Completed payment? Send confirmation receipt directly to Coach Aman:
              </p>
              <button
                onClick={() => openWhatsApp(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#25D366] text-white hover:brightness-110 active:scale-95 transition-all shadow-sm"
                aria-label="Send payment screenshot via WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
                Send Receipt via WhatsApp
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={goBack}
                className="text-xs text-mid hover:text-hi transition-colors"
                aria-label="Go back to membership details"
              >
                ← Back to Details
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: QR Code Payment */}
        {step === "qrCode" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-surface-card border border-surface-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-hi mb-1">
                  Scan &amp; Pay ₹{selectedPlanData?.price}
                </h3>
                <p className="text-xs text-mid">{selectedPlanData?.duration} Membership Pass</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="relative w-64 h-64 border-2 border-accent rounded-2xl overflow-hidden bg-white p-3 shadow-md">
                  <Image
                    src="/assets/QRCode.jpeg"
                    alt="Payment QR Code"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* UPI ID Fallback */}
              <div className="bg-surface-soft border border-surface-border rounded-xl p-3.5 mb-6 text-center">
                <p className="text-xs text-mid mb-1">Or direct UPI ID transfer:</p>
                <p className="text-sm font-bold text-accent select-all tracking-wider">{UPI_ID}</p>
              </div>

              {/* Instructions */}
              <div className="bg-surface-soft border border-surface-border rounded-xl p-4 mb-6">
                <p className="text-xs font-semibold text-hi mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" /> Steps to Activate:
                </p>
                <ol className="text-xs text-mid space-y-2 list-decimal list-inside">
                  <li>Scan QR code with GPay, PhonePe, or Paytm</li>
                  <li>Transfer exact amount: <span className="text-hi font-bold">₹{selectedPlanData?.price}</span></li>
                  <li>Take screenshot of successful transaction</li>
                  <li>Click below to send receipt to Coach Aman on WhatsApp</li>
                </ol>
              </div>

              {/* WhatsApp Button */}
              <button
                onClick={() => openWhatsApp(true)}
                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-[#25D366] text-white hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 mb-4 shadow-sm"
                aria-label="Send payment confirmation via WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
                Send Receipt via WhatsApp
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-surface-soft border border-surface-border text-mid hover:text-hi hover:bg-surface-elevated active:scale-95 transition-all"
                  aria-label="Change payment method"
                >
                  ← Change Method
                </button>
                <button
                  onClick={resetFlow}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-surface-soft border border-surface-border text-mid hover:text-hi hover:bg-surface-elevated active:scale-95 transition-all"
                  aria-label="Start payment process over"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
