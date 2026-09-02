"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedPhoneProps {
  className?: string;
  size?: number;
}

export default function AnimatedPhone({
  className,
  size = 20,
}: AnimatedPhoneProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("group/phone shrink-0 transition-transform duration-200", className)}
    >
      <path
        d="M22 16.92V19.92C22.0011 20.1986 21.9441 20.4742 21.8326 20.7294C21.721 20.9846 21.5573 21.2137 21.3521 21.4019C21.1468 21.5902 20.9046 21.7334 20.6407 21.8224C20.3769 21.9115 20.0974 21.9444 19.82 21.92C16.7428 21.5857 13.787 20.5342 11.19 18.85C8.77382 17.3148 6.72533 15.2663 5.18999 12.85C3.49997 10.2412 2.44824 7.27103 2.11999 4.18C2.09559 3.90357 2.12836 3.62502 2.21614 3.36209C2.30393 3.09916 2.44474 2.85764 2.62957 2.65306C2.8144 2.44848 3.03923 2.28543 3.28919 2.17442C3.53915 2.06341 3.80872 2.00688 4.07999 2.01H7.07999C7.56294 2.00523 8.03157 2.17711 8.39958 2.49398C8.76759 2.81085 9.00945 3.25098 9.07999 3.73C9.2104 4.62001 9.44498 5.49221 9.77999 6.33C9.92385 6.68532 9.95724 7.0736 9.87635 7.44754C9.79545 7.82148 9.60368 8.16454 9.32499 8.43L8.04999 9.71C9.48972 12.2415 11.7585 14.5103 14.29 15.95L15.57 14.67C15.8354 14.3913 16.1785 14.1995 16.5524 14.1186C16.9264 14.0378 17.3147 14.0711 17.67 14.21C18.5078 14.545 19.38 14.7796 20.27 14.91C20.7543 14.9812 21.1989 15.2274 21.5173 15.6006C21.8357 15.9738 22.0055 16.4475 22 16.93V16.92Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover/phone:rotate-12 origin-bottom-left transition-transform duration-200"
      />
    </svg>
  );
}

export { AnimatedPhone };
