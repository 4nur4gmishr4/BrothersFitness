"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Surface the error to the console so it isn't silently swallowed.
        console.error(error);
    }, [error]);

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
                        ERROR
                    </h1>
                    <h2 className="heading-section text-2xl md:text-3xl text-accent uppercase tracking-widest mb-6">
                        SOMETHING WENT WRONG
                    </h2>
                    <p className="label-text text-low leading-relaxed mb-8 max-w-lg mx-auto border-l-2 border-accent pl-4 text-left">
                        &gt; A PROBLEM OCCURRED WHILE LOADING THIS PAGE<br />
                        &gt; YOUR DATA IS SAFE<br />
                        &gt; PLEASE TRY AGAIN
                    </p>
                </div>

                <div>
                    <button onClick={reset} className="btn-primary">
                        <RotateCcw className="w-5 h-5" />
                        Try Again
                    </button>
                </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 text-center">
                <p className="label-text text-faint">
                    STATUS: ERROR {error.digest ? `// CODE ${error.digest}` : ""}
                </p>
            </div>
        </div>
    );
}

