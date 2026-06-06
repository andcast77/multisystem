# Spec: transactional-email-brand-layout

## Requirements

### REQ-1 Layout shell

The system MUST wrap transactional HTML for registration OTP, registration magic link, and email verification link in a single shared layout.

### REQ-2 Markup constraints

The layout SHALL use table-based structure (~600px container), predominantly inline styles, and MUST NOT rely on Tailwind CSS, flex, or grid for primary layout.

### REQ-3 Brand tokens

The layout MUST use a dark background `#0a0a0f`, a solid headline color in the indigo/violet family (`#a78bfa` or equivalent), and a primary CTA background consistent with indigo-600 (`#4f46e5`) where a CTA is shown.

### REQ-4 Encoding

Dynamic values embedded in HTML (e.g. OTP code, URLs in body text) MUST be escaped appropriately for HTML text nodes and attribute values to avoid injection.

### REQ-5 Plain text

Plain-text parts of the same emails MUST remain human-readable and MUST include full verification URLs where a link is offered.

### REQ-6 Optional logo

If `MAIL_BRAND_LOGO_URL` is a non-empty HTTPS URL, the layout SHOULD render a header logo; if unset, the layout MUST omit the logo row.

## Scenarios

### S1 — OTP email

**Given** `sendRegistrationOtpEmail` is invoked with a code  
**When** the HTML body is produced  
**Then** it uses the shared layout and includes the escaped code prominently  
**And** the plain text still contains the raw code and disclaimer.

### S2 — Magic link

**Given** `sendRegistrationMagicLinkEmail` is invoked with a URL  
**When** the HTML body is produced  
**Then** it uses the shared layout with a descriptive CTA and `href` pointing to that URL  
**And** the plain text contains the same URL on its own line.

### S3 — Email verification

**Given** `sendEmailVerificationLink` is invoked with a URL  
**When** the HTML body is produced  
**Then** it uses the shared layout with a descriptive CTA  
**And** the plain text contains the URL.

### S4 — Logo optional

**Given** `MAIL_BRAND_LOGO_URL` is empty  
**When** any transactional email HTML is built  
**Then** no image tag for brand logo appears.
