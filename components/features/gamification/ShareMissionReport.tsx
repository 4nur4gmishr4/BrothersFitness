"use client";

import html2canvas from "html2canvas";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
    targetRef: React.RefObject<HTMLElement | null>;
    filename?: string;
}

export default function ShareMissionReport({ targetRef, filename = "fitness-report" }: ShareButtonProps) {
    const handleShare = async () => {
        if (!targetRef.current) return;

        // Match the export background to the active theme so the
        // captured image reflects what the user is actually seeing.
        const root = getComputedStyle(document.documentElement);
        const canvas = root.getPropertyValue("--surface-canvas").trim() || "0 0 0";

        try {
            // Create a wrapper with padding for cleaner export
            const wrapper = document.createElement('div');
            wrapper.style.padding = '32px';
            wrapper.style.backgroundColor = `rgb(${canvas})`;
            wrapper.style.display = 'inline-block';

            // Clone the target content into the wrapper
            const clone = targetRef.current.cloneNode(true) as HTMLElement;
            wrapper.appendChild(clone);

            // Temporarily add to body (hidden) for rendering
            wrapper.style.position = 'absolute';
            wrapper.style.left = '-9999px';
            document.body.appendChild(wrapper);

            const shot = await html2canvas(wrapper, {
                scale: 2,
                backgroundColor: `rgb(${canvas})`,
                useCORS: true,
            });

            // Cleanup
            document.body.removeChild(wrapper);

            const link = document.createElement('a');
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
            link.href = shot.toDataURL('image/png');
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Fitness report generation failed:", err);
            toast.error("Failed to generate fitness report. Please try again.");
        }
    };

    return (
        <button
            onClick={handleShare}
            className="btn-secondary mt-4"
            aria-label="Download fitness report"
        >
            <Share2 className="w-4 h-4" />
            Share Result
        </button>
    );
}