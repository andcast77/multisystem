import React from "react";
import { cn } from "../lib/utils";

export interface AuthLayoutProps {
  /** Left column: form content */
  children: React.ReactNode;
  /** Right column: decorative panel content (hidden on mobile) */
  panel: React.ReactNode;
  /** Optional class overrides for the root <main> element */
  className?: string;
  /** Optional class overrides for the right decorative panel column */
  panelClassName?: string;
}

export function AuthLayout({
  children,
  panel,
  className,
  panelClassName,
}: AuthLayoutProps) {
  return (
    <main
      className={cn(
        "min-h-screen bg-slate-50 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] relative overflow-hidden",
        className
      )}
    >
      {/* Left column – form slot */}
      <div className="flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Right column – decorative panel (large screens only) */}
      <div
        className={cn(
          "hidden lg:flex flex-col items-center justify-center relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 overflow-hidden p-12",
          panelClassName
        )}
      >
        {/* Decorative circles */}
        <div className="absolute -top-40 left-20 h-[520px] w-[520px] rounded-full border border-white/30" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/20 blur-3xl" />

        {/* Panel content */}
        <div className="relative z-10 text-center max-w-sm">{panel}</div>
      </div>
    </main>
  );
}
