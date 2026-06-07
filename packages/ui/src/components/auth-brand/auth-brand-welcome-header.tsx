import * as React from "react";

export interface AuthBrandWelcomeHeaderProps {
  /** Main heading (default: “Bienvenido”) */
  title?: React.ReactNode;
  /** Subtitle under the heading */
  subtitle: React.ReactNode;
}

/**
 * Top block above the card on login/register (left column).
 */
export function AuthBrandWelcomeHeader({
  title = "Bienvenido",
  subtitle,
}: AuthBrandWelcomeHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
      <p className="mt-2 text-white/50">{subtitle}</p>
    </div>
  );
}
