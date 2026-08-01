"use client";



export default function HeroLoopManager() {
  return (
    <div className="text-center">
      <span className="text-5xl md:text-7xl lg:text-8xl font-display font-black uppercase tracking-wider block inline-block">
        BROTHER&apos;S
      </span>

      <div className="mt-4">
        <span className="text-6xl md:text-8xl lg:text-9xl font-display font-black uppercase tracking-wider block animated-gradient-text inline-block italic">
          FITNESS
        </span>
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
            #ff4d55 30%,
            #FFFFFF 55%,
            #ff4d55 80%,
            #D71921 100%
          );
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-flow 3s ease infinite;
        }
      `}</style>
    </div >
  );
}
