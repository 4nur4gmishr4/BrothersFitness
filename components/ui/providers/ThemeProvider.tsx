"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

type Theme = "system" | "light" | "dark";

interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (t: Theme) => void;
    /** False during SSR and the first client render. */
    mounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "system",
    resolvedTheme: "dark",
    setTheme: () => {},
    mounted: false,
});

function applyThemeToDOM(theme: Theme): "light" | "dark" {
    if (typeof window === "undefined") return "dark";
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    let resolved: "light" | "dark" = "dark";
    if (theme === "system") {
        root.removeAttribute("data-theme");
        resolved = mq.matches ? "light" : "dark";
    } else {
        root.setAttribute("data-theme", theme);
        resolved = theme;
    }
    root.style.colorScheme = resolved;
    root.classList.toggle("dark", resolved === "dark");
    root.classList.toggle("light", resolved === "light");
    try {
        localStorage.setItem("brofit_theme", theme);
    } catch {}
    return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
    const [mounted, setMounted] = useState(false);

    // Hydrate from localStorage after mount
    useEffect(() => {
        setMounted(true);
        try {
            const stored = localStorage.getItem("brofit_theme");
            if (stored === "light" || stored === "dark" || stored === "system") {
                setThemeState(stored as Theme);
                const resolved = applyThemeToDOM(stored as Theme);
                setResolvedTheme(resolved);
            } else {
                const resolved = applyThemeToDOM("system");
                setResolvedTheme(resolved);
            }
        } catch {}
    }, []);

    // Listen for OS system theme changes when in "system" mode
    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: light)");
        const handler = () => {
            if (theme === "system") {
                const resolved = applyThemeToDOM("system");
                setResolvedTheme(resolved);
            }
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    const setTheme = useCallback((t: Theme) => {
        // Synchronously update DOM attributes and classes before any paint (0ms instant toggle)
        const resolved = applyThemeToDOM(t);
        setThemeState(t);
        setResolvedTheme(resolved);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);

