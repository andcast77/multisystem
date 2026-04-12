"use client";

import dynamic from "next/dynamic";

const Turnstile = dynamic(() => import("@marsidev/react-turnstile").then((m) => m.Turnstile), {
  ssr: false,
});

/** Clave pública de prueba “siempre pasa” (visible). @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/ */
const DEFAULT_SITE_KEY = "1x00000000000000000000AA";
const MISTAKEN_SECRET_AS_SITEKEY = "1x0000000000000000000000000000000AA";

export function getTurnstileSiteKey(): string {
  const raw = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!raw || raw === MISTAKEN_SECRET_AS_SITEKEY) return DEFAULT_SITE_KEY;
  return raw;
}

type Props = {
  onToken: (token: string | null) => void;
  /** Reservado para espaciado; el tamaño del widget es `flexible` en ambos. */
  variant?: "default" | "compact";
};

/**
 * Cloudflare Turnstile — `interaction-only`: la caja solo aparece cuando hace falta interacción.
 * `flexible`: cuando se muestra, usa el ancho del card (mín. ~300px según Cloudflare).
 */
export function RegistrationTurnstile({ onToken, variant = "default" }: Props) {
  const siteKey = getTurnstileSiteKey();
  const compact = variant === "compact";

  return (
    <div
      className={
        "flex w-full min-h-0 justify-center " +
        (compact ? "py-1" : "py-2") +
        " [&_iframe]:block [&_iframe]:min-h-[65px] [&_iframe]:min-w-[300px] [&_iframe]:w-full [&_iframe]:max-w-none"
      }
    >
      <Turnstile
        siteKey={siteKey}
        onSuccess={(t) => onToken(t)}
        onExpire={() => onToken(null)}
        onError={() => onToken(null)}
        options={{
          appearance: "interaction-only",
          theme: "dark",
          language: "es",
          size: "flexible",
        }}
      />
    </div>
  );
}
