import * as React from "react";

export interface AuthBrandDecorativePanelProps {
  /** Content inside the pill badge (e.g. module name or icon + label) */
  badge: React.ReactNode;
  /** Main marketing title (rendered as h2) */
  title: React.ReactNode;
  /** Lead paragraph under the title */
  description: React.ReactNode;
  /** Italic quote line in the footer strip */
  quote: React.ReactNode;
}

/**
 * Right column (lg+) decorative panel: badge, title, description, divider, quote.
 * Copy changes per app; structure and classes are fixed.
 */
export function AuthBrandDecorativePanel({
  badge,
  title,
  description,
  quote,
}: AuthBrandDecorativePanelProps) {
  return (
    <>
      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-indigo-200 font-medium mb-6">
        {badge}
      </div>
      <h2 className="text-4xl font-bold text-white mb-4">{title}</h2>
      <p className="text-white/80 text-lg leading-relaxed">{description}</p>
      <div className="mt-8 pt-8 border-t border-white/30">
        <p className="text-white/60 text-sm italic">{quote}</p>
      </div>
    </>
  );
}
