"use client";

import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen surface-canvas text-hi flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Static grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    
                    backgroundSize: "80px 80px",
                }}
            />

            <div className="relative z-10 text-center max-w-2xl mx-auto space-y-8">
                <div className="inline-flex items-center justify-center w-24 h-24 surface-card hairline border-accent mb-6">
                    <AlertTriangle className="w-12 h-12 text-accent" />
                </div>

                <div>
                    <h1 className="heading-display font-black text-6xl md:text-8xl text-hi mb-2">
                        404
                    </h1>
                    <h2 className="heading-section text-2xl md:text-3xl text-accent uppercase tracking-widest mb-6">
                        PAGE NOT FOUND
                    </h2>
                    <p className="label-text text-low leading-relaxed mb-8 max-w-lg mx-auto border-l-2 border-accent pl-4 text-left">
                        &gt; THE PAGE YOU REQUESTED DOES NOT EXIST<br />
                        &gt; IT MAY HAVE BEEN MOVED OR RENAMED<br />
                        &gt; CHECK THE ADDRESS AND TRY AGAIN
                    </p>
                </div>

                <div>
                    <Link href="/" className="btn-primary">
                        <Home className="w-5 h-5" />
                        Back to Home
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 text-center">
                <p className="label-text text-faint">
                    STATUS: 404
                </p>
            </div>
        </div>
    );
}

