import React from "react";
import { cn } from "../lib/utils";

export type AuthLayoutVariant = "default" | "brand";

function BrandAuthBackground() {
  return (
    <>
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
    </>
  );
}

export interface AuthLayoutProps {
  children: React.ReactNode;
  panel: React.ReactNode;
  variant?: AuthLayoutVariant;
  className?: string;
  panelClassName?: string;
  contentClassName?: string;
}

export function AuthLayout({
  children,
  panel,
  variant = "default",
  className,
  panelClassName,
  contentClassName,
}: AuthLayoutProps) {
  const isBrand = variant === "brand";

  return (
    <main
      className={cn(
        "min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] relative overflow-hidden",
        isBrand ? "bg-[#0a0a0f]" : "bg-slate-50",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center p-4 lg:p-12",
          isBrand && "relative"
        )}
      >
        {isBrand ? <BrandAuthBackground /> : null}
        <div
          className={cn(
            "w-full",
            isBrand ? "relative z-10 flex justify-center" : undefined
          )}
        >
          <div className={cn("w-full max-w-md", contentClassName)}>{children}</div>
        </div>
      </div>

      <div
        className={cn(
          "hidden lg:flex flex-col items-center justify-center relative overflow-hidden p-12",
          isBrand
            ? "bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-900"
            : "bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600",
          panelClassName
        )}
      >
        <div className="absolute -top-40 left-20 h-[520px] w-[520px] rounded-full border border-white/30" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/20 blur-3xl" />

        <div className="relative z-10 text-center max-w-sm">{panel}</div>
      </div>
    </main>
  );
}
