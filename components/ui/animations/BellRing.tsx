"use client";

import React from "react";
import { Bell } from "lucide-react";

export default function BellRing({ className = "w-5 h-5 text-accent" }: { className?: string }) {
  return (
    <Bell className={`shrink-0 transition-transform duration-200 hover:rotate-12 ${className}`} />
  );
}
