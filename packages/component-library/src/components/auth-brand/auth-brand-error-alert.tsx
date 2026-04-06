import * as React from "react";
import { cn } from "../../lib/utils";

export interface AuthBrandErrorAlertProps {
  children: React.ReactNode;
  variant?: "error" | "warning";
  className?: string;
}

/**
 * Bordered alert region above fields. Pass inner markup (e.g. &lt;p className="text-sm text-red-200"&gt;).
 */
export function AuthBrandErrorAlert({
  children,
  variant = "error",
  className,
}: AuthBrandErrorAlertProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg border",
        variant === "error" && "bg-red-500/10 border-red-400/30",
        variant === "warning" && "bg-amber-500/10 border-amber-400/30",
        className
      )}
    >
      {children}
    </div>
  );
}
