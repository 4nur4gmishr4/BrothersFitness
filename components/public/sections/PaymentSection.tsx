"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CreditCard, User, Users, Phone, QrCode, Smartphone, MessageCircle, ExternalLink, CheckCircle } from "lucide-react";
import Image from "next/image";

type PaymentStep = "plan" | "details" | "paymentChoice" | "qrCode";

export default function PaymentSection() {
  const [step, setStep] = useState<PaymentStep>("plan");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "quarterly" | null>(null);
  const [formData, setFormData] = useState({ name: "", gender: "", mobile: "" });

  // History depth the section mounted at. Every forward step calls pushState, so
  // once the flow finishes we can collapse those entries with history.go(-N) â€”
  // otherwise the browser back button later re-enters the wizard from a stale
  // paymentStep on an unrelated page (H7 fix).
  const baseIndexRef = useRef<number>(0);
  const isResettingRef = useRef(false);

  const AMAN_WHATSAPP = "919131179343";
  const UPI_ID = "annushrivastava112@okicici";
  const PAYEE_NAME = "Aman Brothers Fitness";

  const plans = [
    { id: "monthly", price: 700, duration: "1 Month", label: "MONTHLY" },
    { id: "quarterly", price: 1800, duration: "3 Months", label: "QUARTERLY", save: "Save â‚¹300" },
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

    const baseMessage = `ðŸ‹ï¸ Brothers Fitness - New Membership

Name: ${formData.name}
Gender: ${formData.gender}
Mobile: ${formData.mobile}
Plan: ${plan.label} (${plan.duration})
Amount: â‚¹${plan.price}`;

    if (includePaymentConfirm) {
      return `${baseMessage}

Status: âœ… Payment Completed
Screenshot: Attached

Please activate my membership. Thank you!`;
    }

    return baseMessage;
  };

  const openWhatsApp = (includePaymentConfirm: boolean = false) => {
    const message = generateWhatsAppMessage(includePaymentConfirm);
    const url = `https://wa.me/${AMAN_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const resetFlow = () => {
    // Collapse every payment entry we pushed since mount, so the browser back
    // button can't re-enter the wizard from a later page. history.go(-N) fires
    // popstate for each popped entry â€” suppress those with the reset flag and
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
    <section id="payment" className="surface-canvas text-hi py-16 md:py-24 relative overflow-hidden">
      {/* Subtle grid pattern - static */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 badge badge--accent mb-6">
            <CreditCard className="w-4 h-4" />
            Secure Payment
          </div>
          <h2 className="heading-display text-4xl sm:text-5xl lg:text-6xl text-hi mb-4">
            JOIN THE <span className="text-accent">BROTHERHOOD</span>
          </h2>
          <p className="label-text text-mid">
            {step === "plan" && "Select Your Plan"}
            {step === "details" && "Your Membership Details"}
            {step === "paymentChoice" && "Choose Payment Method"}
            {step === "qrCode" && "Scan QR Code"}
          </p>
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
                className={`relative p-8 cursor-pointer transition-colors duration-fast group ${
                  plan.save ? "featured-tier" : "surface-card hairline hover:border-accent"
                }`}
              >
                {plan.save && (
                  <div className="featured-tier__badge">{plan.save}</div>
                )}
                <div className="text-center">
                  <h3 className="label-text text-mid mb-4">{plan.label}</h3>
                  <p className="stat-callout__value text-hi group-hover:text-accent transition-colors duration-fast">
                    â‚¹{plan.price}
                  </p>
                  <p className="label-text text-faint mt-3">{plan.duration}</p>
                  <p className="label-text text-accent mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
                    Click to Select â†’
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 2: Membership Details Form */}
        {step === "details" && (
          <div className="max-w-2xl mx-auto">
            <div className="surface-card hairline p-8">
              {/* Selected Plan Summary */}
              <div className="surface-elevated hairline border-accent p-4 mb-6 text-center">
                <p className="label-text text-low mb-1">Selected Plan</p>
                <p className="heading-section text-2xl font-bold text-accent">
                  {selectedPlanData?.label} - â‚¹{selectedPlanData?.price}
                </p>
                <p className="label-text text-faint mt-1">{selectedPlanData?.duration}</p>
              </div>

              <h3 className="heading-section text-2xl text-hi mb-6 text-center">
                Membership Details
              </h3>

              <form onSubmit={handleDetailsSubmit} className="space-y-6">
                <div>
                  <label className="label-text text-mid flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="label-text text-mid flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" /> Gender
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Male", "Female", "Other"].map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender })}
                        className={`py-3 label-text transition-colors duration-fast ${
                          formData.gender === gender
                            ? "bg-accent text-white border border-accent"
                            : "surface-card hairline text-mid hover:border-accent"
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-text text-mid flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4" /> Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })}
                    className="input-field"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="btn-secondary flex-1"
                    aria-label="Go back to plan selection"
                  >
                    â† Back
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.name || !formData.gender || formData.mobile.length !== 10}
                    className="btn-primary flex-1"
                    aria-label="Proceed to payment options"
                  >
                    Go to Payments â†’
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STEP 3: Payment Method Choice */}
        {step === "paymentChoice" && (
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* UPI App */}
              <div
                onClick={openUPIApp}
                className="surface-card hairline hover:border-accent p-8 cursor-pointer transition-colors duration-fast group"
              >
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 surface-elevated hairline flex items-center justify-center group-hover:border-accent transition-colors duration-fast">
                    <Smartphone className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="heading-section text-2xl text-hi mb-3">Pay via UPI App</h3>
                  <p className="body-text text-sm text-mid mb-4">
                    Opens your UPI app (GPay, PhonePe, Paytm, etc.) with payment details pre-filled
                  </p>
                  <p className="label-text text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
                    Opens UPI App â†’
                  </p>
                </div>
              </div>

              {/* QR Code */}
              <div
                onClick={() => navigateToStep("qrCode")}
                className="surface-card hairline hover:border-accent p-8 cursor-pointer transition-colors duration-fast group"
              >
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 surface-elevated hairline flex items-center justify-center group-hover:border-accent transition-colors duration-fast">
                    <QrCode className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="heading-section text-2xl text-hi mb-3">Pay via QR Code</h3>
                  <p className="body-text text-sm text-mid mb-4">
                    Scan QR code to make payment instantly
                  </p>
                  <p className="label-text text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
                    Click to Continue â†’
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp Section - After Payment */}
            <div className="mt-8 surface-card hairline p-6">
              <div className="text-center">
                <p className="label-text text-mid mb-4">
                  After completing payment, send your screenshot via WhatsApp:
                </p>
                <button
                  onClick={() => openWhatsApp(true)}
                  className="btn-primary"
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
                className="label-text text-mid hover:text-hi transition-colors duration-fast"
                aria-label="Go back to membership details"
              >
                â† Back to Details
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: QR Code Payment */}
        {step === "qrCode" && (
          <div className="max-w-2xl mx-auto">
            <div className="surface-card hairline p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 surface-elevated hairline flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-accent" />
                </div>
                <h3 className="heading-display text-3xl text-hi mb-2">
                  Scan &amp; Pay â‚¹{selectedPlanData?.price}
                </h3>
                <p className="label-text text-mid">{selectedPlanData?.duration}</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="relative w-72 h-72 border-4 border-accent overflow-hidden bg-white p-4">
                  <Image
                    src="/assets/QRCode.jpeg"
                    alt="Payment QR Code"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* UPI ID Fallback */}
              <div className="surface-elevated hairline p-4 mb-6 text-center">
                <p className="label-text text-mid mb-2">Or use UPI ID</p>
                <p className="font-mono text-lg text-hi break-all">{UPI_ID}</p>
              </div>

              {/* Instructions */}
              <div className="surface-elevated hairline border-accent p-6 mb-6">
                <p className="label-text text-accent mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Payment Steps
                </p>
                <ol className="body-text text-sm text-mid space-y-3 list-decimal list-inside">
                  <li>Open any UPI app on your phone</li>
                  <li>Scan the QR code above</li>
                  <li>Pay <span className="text-accent font-semibold">â‚¹{selectedPlanData?.price}</span></li>
                  <li>Take a <span className="text-accent font-semibold">screenshot</span> of the transaction</li>
                  <li>Click below to send confirmation via WhatsApp</li>
                </ol>
              </div>

              {/* User Details */}
              <div className="surface-elevated hairline p-4 mb-6">
                <p className="label-text text-mid mb-3">Your Details:</p>
                <div className="space-y-2 body-text text-sm text-mid">
                  <p><span className="text-low">Name:</span> <span className="text-hi font-semibold">{formData.name}</span></p>
                  <p><span className="text-low">Gender:</span> <span className="text-hi font-semibold">{formData.gender}</span></p>
                  <p><span className="text-low">Mobile:</span> <span className="text-hi font-semibold">{formData.mobile}</span></p>
                </div>
              </div>

              {/* WhatsApp Button */}
              <button
                onClick={() => openWhatsApp(true)}
                className="btn-primary w-full mb-4"
                aria-label="Send payment confirmation via WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
                Send Payment Screenshot via WhatsApp
                <ExternalLink className="w-4 h-4" />
              </button>

              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="btn-secondary flex-1"
                  aria-label="Change payment method"
                >
                  â† Change Method
                </button>
                <button
                  onClick={resetFlow}
                  className="btn-secondary flex-1"
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

