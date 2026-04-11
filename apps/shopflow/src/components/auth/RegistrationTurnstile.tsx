"use client";

import dynamic from "next/dynamic";

const Turnstile = dynamic(() => import("@marsidev/react-turnstile").then((m) => m.Turnstile), {
  ssr: false,
});

const DEFAULT_SITE_KEY = "1x00000000000000000000AA";
const MISTAKEN_SECRET_AS_SITEKEY = "1x0000000000000000000000000000000AA";

export function getTurnstileSiteKey(): string {
  const raw = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!raw || raw === MISTAKEN_SECRET_AS_SITEKEY) return DEFAULT_SITE_KEY;
  return raw;
}

type Props = {
  onToken: (token: string | null) => void;
  variant?: "default" | "compact";
};

export function RegistrationTurnstile({ onToken, variant = "default" }: Props) {
  const siteKey = getTurnstileSiteKey();
  const compact = variant === "compact";

  return (
    <div
      className={
        compact
          ? "flex w-full min-h-0 justify-center py-0 leading-none [&_iframe]:block [&_iframe]:max-w-[300px]"
          : "flex min-h-0 w-full justify-center py-1 [&_iframe]:max-w-full"
      }
    >
      <Turnstile
        className={compact ? "!min-h-0 !p-0 [&>div]:!min-h-0" : undefined}
        siteKey={siteKey}
        onSuccess={(t) => onToken(t)}
        onExpire={() => onToken(null)}
        onError={() => onToken(null)}
        options={{
          appearance: "interaction-only",
          theme: "dark",
          language: "es",
          size: "normal",
        }}
      />
    </div>
  );
}
