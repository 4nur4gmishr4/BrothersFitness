"use client";

import { useEffect, useRef, useState } from "react";

export default function CountdownTimer({
  duration,
  onComplete,
}: {
  duration: number;
  onComplete?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onCompleteRef = useRef(onComplete);
  const firedRef = useRef(false);

  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const progress = Math.min(100, Math.max(0, ((duration - timeLeft) / duration) * 100));

  return (
    <div className="w-full max-w-xs mx-auto space-y-2 py-2">
      <div className="flex justify-between items-center text-xs text-mid font-medium">
        <span>Processing request</span>
        <span className="tabular-nums font-semibold text-hi">{timeLeft}s remaining</span>
      </div>
      {/* iOS Linear Progress Track */}
      <div className="w-full h-2 rounded-full bg-surface-soft border border-surface-border overflow-hidden p-0.5">
        <div
          className="h-full bg-accent rounded-full transition-all duration-1000 ease-linear shadow-xs"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export { CountdownTimer };
