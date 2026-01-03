"use client";

import DecryptedText from "@/components/react-bits/DecryptedText";

export default function HeroLoopManager() {
  return (
    <div className="text-center">
      <DecryptedText
        text="BROTHER'S"
        speed={50}
        maxIterations={15}
        className="text-5xl md:text-7xl lg:text-8xl font-display font-black uppercase tracking-tighter block"
        parentClassName="inline-block"
        animateOn="view"
        delay={0}
      />
      
      <div className="mt-2">
        <DecryptedText
          text="FITNESS"
          speed={50}
          maxIterations={15}
          className="text-6xl md:text-8xl lg:text-9xl font-display font-black uppercase tracking-tighter block animated-gradient-text"
          parentClassName="inline-block"
          animateOn="view"
          delay={0.2}
        />
      </div>

      <style jsx global>{`
        @keyframes gradient-flow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animated-gradient-text {
          background: linear-gradient(
            90deg,
            #D71921 0%,
            #FFD700 25%,
            #FFFFFF 50%,
            #FFD700 75%,
            #D71921 100%
          );
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-flow 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
