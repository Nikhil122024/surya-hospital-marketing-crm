"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function BrandLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return !mounted || failed ? <div className={cn("flex shrink-0 items-center justify-center rounded-xl bg-[#1473e6] font-extrabold text-white", compact ? "h-9 w-9 text-sm" : "h-12 w-12 text-lg", className)}>S</div> : <img src="/images/surya.jpg" alt="Surya Hospital" onError={() => setFailed(true)} className={cn("shrink-0 object-contain", compact ? "h-9 w-9" : "h-14 w-14", className)} />;
}
