# Proposal: transactional-email-brand-layout (PLAN-41)

## Intent

Unify Hub-branded HTML for API transactional emails (Resend) using a single table-based, inline-styled layout that mirrors Hero/Auth tokens without Tailwind or web-only effects.

## Scope

- `packages/api`: new email layout helper, wire `sendRegistrationOtpEmail`, `sendRegistrationMagicLinkEmail`, `sendEmailVerificationLink`.
- Optional env `MAIL_BRAND_LOGO_URL` (documented in `.env.example`).
- User-visible copy in HTML/plain text for those flows; no HTTP contract change.

## Rollback

Revert the commit restoring previous minimal HTML in `mailer.service.ts` and remove the layout module; Resend transport unchanged.

## Affected modules

- `packages/api/src/services/mailer.service.ts`
- `packages/api/src/services/email-templates/transactional-email-layout.ts`
- `packages/api/src/core/config.ts`
- `packages/api/.env.example`
- Unit tests
