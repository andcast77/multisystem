# Explore: transactional-email-brand-layout

## Current state

- [`mailer.service.ts`](../../../packages/api/src/services/mailer.service.ts) builds minimal inline HTML per template and calls `sendMail` (text + html).
- Brand references: PLAN-27 AuthLayout / Hub Hero (`#0a0a0f`, indigo/violet accents, CTA indigo-600).
- Strict email constraints: tables ~600px, inline CSS, no flex/grid as primary layout; descriptive link text + plain text URL.

## Risks

- Client quirks (Outlook): avoid broken `font-family` quoting; use bulletproof button pattern where possible.
- XSS: escape dynamic fragments (OTP code, URLs in text nodes; attribute-escape `href`).

## Decision preview

- Implement with **TypeScript string templates** (no React Email) for minimal deps and align with PLAN-41 recommendation.
