"use client";

import AnimatedIcon from "@/components/ui/AnimatedIcon";

export default function InfoSection() {
  return (
    <section
      id="timings"
      className="surface-canvas py-16 md:py-24 relative overflow-hidden"
    >
      {/* Subtle grid pattern - static, no animation */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        
        backgroundSize: "80px 80px",
      }} />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="flex justify-center">
          {/* TIMINGS CARD - surface-card with hairline */}
          <div className="surface-card hairline p-6 md:p-8 max-w-2xl w-full">
            <h2 className="heading-display text-3xl md:text-4xl mb-8 flex items-center gap-3 text-hi">
              <AnimatedIcon
                name="clock"
                className="w-7 h-7 md:w-8 md:h-8 text-accent"
                label="Timings"
              />
              TIMINGS
            </h2>

            <div className="space-y-6">
              {/* MORNING SESSION: 6:00 AM - 10:00 AM */}
              <div className="hairline-t pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <AnimatedIcon
                    name="sunrise"
                    className="w-5 h-5 text-accent"
                    label="Morning"
                  />
                  <h3 className="label-text">MORNING SESSION</h3>
                </div>
                <p className="heading-section text-2xl md:text-3xl font-bold tracking-wide text-hi">
                  06:00 AM - 10:00 AM
                </p>
                <p className="text-sm text-mid mt-1">
                  âœ“ Men and Women Together
                </p>
              </div>

              {/* WOMEN-ONLY SESSION: 4:30 PM - 6:30 PM */}
              <div className="hairline-t pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <AnimatedIcon
                    name="sunset"
                    className="w-5 h-5 text-accent"
                    label="Women's session"
                  />
                  <h3 className="label-text">WOMEN-ONLY SESSION</h3>
                </div>
                <p className="heading-section text-2xl md:text-3xl font-bold tracking-wide text-status-warning">
                  04:30 PM - 06:30 PM
                </p>
                <p className="text-sm text-status-warning mt-1 font-medium">
                  âœ“ Women Only
                </p>
              </div>

              {/* EVENING SESSION: 6:30 PM - 10:00 PM */}
              <div className="hairline-t pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <AnimatedIcon
                    name="sunset"
                    className="w-5 h-5 text-accent"
                    label="Evening"
                  />
                  <h3 className="label-text">EVENING SESSION</h3>
                </div>
                <p className="heading-section text-2xl md:text-3xl font-bold tracking-wide text-hi">
                  06:30 PM - 10:00 PM
                </p>
                <p className="text-sm text-mid mt-1">
                  âœ“ Men and Women Together
                </p>
              </div>

              {/* SUNDAY CLOSED */}
              <div className="hairline-t pt-6">
                <h3 className="label-text mb-2">SUNDAY</h3>
                <p className="heading-section text-xl md:text-2xl font-bold text-status-danger">CLOSED</p>
              </div>

              {/* SCHEDULE SUMMARY */}
              <div className="hairline-t pt-6 surface-elevated hairline p-4">
                <p className="label-text text-accent mb-2">SCHEDULE SUMMARY</p>
                <p className="text-sm text-mid leading-relaxed">
                  <strong className="text-hi">Mixed Training:</strong> 6:00-10:00 AM &amp; 6:30-10:00 PM<br />
                  <strong className="text-hi">Women Only:</strong> 4:30-6:30 PM
                </p>
              </div>

              <p className="text-xs font-mono text-faint text-center">
                ALL TIMINGS IN IST
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

