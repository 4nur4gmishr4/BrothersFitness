"use client";

import { useEffect, useState } from "react";
// @ts-ignore
import SmartPreloader from "https://framer.com/m/SmartPreloader-obmWs4.js@74hWOlRp08XotKDXxDIL";

export default function SmartPreloaderWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
      <SmartPreloader 
        text="SYSTEM INITIALIZING..."
        color="#D71921"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
