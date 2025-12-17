"use client";
import DecryptedText from "@/components/react-bits/DecryptedText";

export default function HeroLoopManager() {
  return (
    <div className="flex flex-col items-center justify-center leading-[0.9] md:leading-[0.85] w-full">
        {/* LINE 1: BROTHER'S */}
        <DecryptedText 
            text="BROTHER'S"
            speed={50}
            maxIterations={20}
            delay={0}
            className="text-black dark:text-white block"
            parentClassName="block"
        />

        {/* LINE 2: FITNESS */}
        <DecryptedText 
            text="FITNESS"
            speed={50}
            maxIterations={20}
            delay={1500} 
            className="bg-gradient-to-r from-gym-red via-gym-yellow to-gym-red bg-clip-text text-transparent animate-gradient-text block pr-4 pb-1"
            parentClassName="block"
        />
    </div>
  );
}