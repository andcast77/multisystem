import * as React from "react";

export interface AuthBrandLoginFooterLinksProps {
  /** First line, e.g. “¿No tienes cuenta?” + link */
  signUpLine: React.ReactNode;
  /** Second line, e.g. “Volver al inicio” */
  homeLine: React.ReactNode;
}

/**
 * Standard login card footer: stacked links, centered (matches Hub).
 */
export function AuthBrandLoginFooterLinks({
  signUpLine,
  homeLine,
}: AuthBrandLoginFooterLinksProps) {
  return (
    <div className="mt-6 text-center space-y-3">
      <p className="text-sm text-white/50">{signUpLine}</p>
      <p className="text-xs text-white/40">{homeLine}</p>
    </div>
  );
}

/** Single centered footer block (e.g. register → login link). Same vertical spacing as login footers. */
export function AuthBrandFooterCenter({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 text-center">{children}</div>;
}
