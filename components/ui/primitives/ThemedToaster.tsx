"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/components/ui/providers/ThemeProvider";

// Renders sonner's Toaster with the active resolved theme so toast
// styling matches light/dark instead of being pinned to dark.
export default function ThemedToaster() {
    const { resolvedTheme, mounted } = useTheme();
    // Wait for hydration so the Toaster doesn't mount pinned to the SSR default
    // theme and flash a wrong-styled toast on first load.
    if (!mounted) return null;
    return (
        <Toaster
            theme={resolvedTheme}
            position="top-center"
            richColors
            style={{ zIndex: 70 }}
            toastOptions={{ duration: 5000 }}
        />
    );
}
