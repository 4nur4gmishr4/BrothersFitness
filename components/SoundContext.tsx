"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SoundContextType {
  isEnabled: boolean;
  toggleSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false);

  const toggleSound = () => {
    setIsEnabled((prev) => !prev);
  };

  return (
    <SoundContext.Provider value={{ isEnabled, toggleSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}
