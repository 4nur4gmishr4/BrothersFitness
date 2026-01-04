"use client";

import html2canvas from "html2canvas";
import { Share2 } from "lucide-react";

interface ShareButtonProps {
    targetRef: React.RefObject<HTMLElement | null>;
    filename?: string;
}

export default function ShareMissionReport({ targetRef, filename = "mission-report" }: ShareButtonProps) {
    const handleShare = async () => {
        if (!targetRef.current) return;

        try {
            // Create a wrapper with padding for cleaner export
            const wrapper = document.createElement('div');
            wrapper.style.padding = '32px';
            wrapper.style.backgroundColor = '#000000';
            wrapper.style.display = 'inline-block';

            // Clone the target content into the wrapper
            const clone = targetRef.current.cloneNode(true) as HTMLElement;
            wrapper.appendChild(clone);

            // Temporarily add to body (hidden) for rendering
            wrapper.style.position = 'absolute';
            wrapper.style.left = '-9999px';
            document.body.appendChild(wrapper);

            const canvas = await html2canvas(wrapper, {
                scale: 2,
                backgroundColor: "#000000",
                useCORS: true,
            });

            // Cleanup
            document.body.removeChild(wrapper);

            const link = document.createElement('a');
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Mission Report generation failed:", err);
            alert("Failed to generate Mission Report. Please try again.");
        }
    };

    return (
        <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-gym-red hover:border-gym-red transition-all mt-4"
            aria-label="Download Mission Report"
        >
            <Share2 className="w-4 h-4" />
            Share Result
        </button>
    );
}
