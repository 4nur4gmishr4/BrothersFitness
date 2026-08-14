"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

type Theme = "system" | "light" | "dark";

interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (t: Theme) => void;
    /** False during SSR and the first client render. Gate theme-dependent UI on
     *  this so the initial state ("system"/"dark", deterministic on both sides)
     *  never leaks a one-frame wrong-theme icon. */
    mounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "system",
    resolvedTheme: "dark",
    setTheme: () => {},
    mounted: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    // Deterministic initial state ("system"/"dark") keeps server and client
    // first renders identical — no hydration warning. The pre-paint script in
    // layout.tsx already applied data-theme, so there is no FOUC to reconcile.
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
    const [mounted, setMounted] = useState(false);

    // Hydrate from localStorage after mount
    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("brofit_theme");
        if (stored === "light" || stored === "dark" || stored === "system") {
            setThemeState(stored);
        }
    }, []);

    // Apply data-theme + resolve + persist
    useEffect(() => {
        const root = document.documentElement;
        const mq = window.matchMedia("(prefers-color-scheme: light)");

        const resolve = () => {
            root.classList.add("theme-transition");
            
            if (theme === "system") {
                root.removeAttribute("data-theme");
                const resolved = mq.matches ? "light" : "dark";
                setResolvedTheme(resolved);
                root.style.colorScheme = resolved;
            } else {
                root.setAttribute("data-theme", theme);
                setResolvedTheme(theme);
                root.style.colorScheme = theme;
            }
            
            window.setTimeout(() => {
                root.classList.remove("theme-transition");
            }, 300);
        };

        resolve();
        mq.addEventListener("change", resolve);
        localStorage.setItem("brofit_theme", theme);

        return () => mq.removeEventListener("change", resolve);
    }, [theme]);

    const setTheme = useCallback((t: Theme) => setThemeState(t), []);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
