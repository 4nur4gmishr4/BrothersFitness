"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * PWA update prompt. next-pwa registers the service worker automatically
 * (`register: true` in next.config.mjs); this component only reacts to its
 * lifecycle. When a deploy ships a newer bundle, the browser installs a waiting
 * service worker — we surface a "reload to update" toast instead of silently
 * serving stale cached assets (a real issue on iOS Safari / WebKit, which can
 * keep old Workbox hashes for a long time).
 *
 * Guarded to the browser and a no-op in dev, where the SW is disabled.
 */
export default function PwaUpdateToast() {
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

        let refreshing = false;

        navigator.serviceWorker.ready
            .then((registration) => {
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener("statechange", () => {
                        // "installed" fires for both first install and updates;
                        // only prompt when a controller already exists (i.e. a
                        // real update, not the initial install).
                        if (
                            newWorker.state === "installed" &&
                            navigator.serviceWorker.controller
                        ) {
                            toast(
                                "New version available",
                                {
                                    description: "Tap Reload to get the latest update.",
                                    action: {
                                        label: "Reload",
                                        onClick: () => {
                                            refreshing = true;
                                            newWorker.postMessage({ type: "SKIP_WAITING" });
                                        },
                                    },
                                    duration: 15000,
                                }
                            );
                        }
                    });
                });
            })
            .catch(() => { /* Service worker unavailable — ignore */ });

        // After SKIP_WAITING the new SW takes over; reload to serve fresh assets.
        const onControllerChange = () => {
            if (refreshing) window.location.reload();
        };
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

        return () => {
            navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
        };
    }, []);

    return null;
}
