"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "default";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variant === "success" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        variant === "warning" && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        variant === "danger" && "bg-red-500/10 text-red-400 border border-red-500/20",
        variant === "info" && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        variant === "default" && "bg-slate-500/10 text-slate-400 border border-slate-500/20",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
