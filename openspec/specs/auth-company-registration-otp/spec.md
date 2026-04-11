# Auth: company registration OTP

Canonical spec (merged from change `company-registration-otp`). See PLAN-39 and API implementation.

### Requirement: OTP send before company registration

The system SHALL accept a request to send a one-time code to an email address prior to company registration, subject to server-side captcha verification and rate limits.

#### Scenario: Successful send

- **Given** a valid email format (normalized to lowercase on the server)
- **And** a valid captcha token verified with the configured provider
- **And** Redis (or configured store) is available
- **And** the send count for this email in the current challenge window is below 3
- **When** the client calls the OTP send endpoint
- **Then** the response SHALL be success with the standard API envelope
- **And** the plaintext OTP SHALL NOT appear in the response or in structured logs

#### Scenario: Send blocked — user already exists

- **Given** a user row already exists for that email
- **When** the client calls the OTP send endpoint
- **Then** the server SHALL reject the request with an error consistent with existing registration policy (e.g. duplicate email message)

#### Scenario: Send blocked — captcha invalid

- **Given** captcha verification fails
- **When** the client calls the OTP send endpoint
- **Then** the server SHALL reject the request with a stable machine-readable `code` (e.g. `CAPTCHA_FAILED`)

#### Scenario: Send blocked — limit exceeded

- **Given** the send count for this email in the current challenge window has reached 3
- **When** the client calls the OTP send endpoint
- **Then** the server SHALL reject the request with `429` or domain error with stable `code` (e.g. `OTP_SEND_LIMIT`)

#### Scenario: OTP store unavailable

- **Given** Redis (or required store) is not configured or unreachable
- **When** the client calls the OTP send endpoint
- **Then** the server SHALL NOT succeed the operation
- **And** the response SHALL use a stable error without leaking internal stack traces

---

### Requirement: OTP verify and registration ticket

The system SHALL verify the OTP with constant-time comparison, enforce at most 3 failed attempts per challenge cycle, and issue a short-lived `registrationTicket` when the code is valid.

#### Scenario: Successful verify

- **Given** a valid challenge exists for the email with matching OTP hash
- **And** failed attempt count is less than 3
- **When** the client submits the correct code
- **Then** the response SHALL include a `registrationTicket` string
- **And** the ticket SHALL bind the normalized email and purpose `company_register`

#### Scenario: Wrong code

- **Given** the submitted code does not match
- **When** the client submits verification
- **Then** the failed attempt counter SHALL increment
- **And** the response SHALL indicate failure without revealing whether the email exists in the challenge store beyond this flow

#### Scenario: Too many failed attempts

- **Given** failed attempts reach 3 for the current challenge
- **When** the client submits verification (correct or not)
- **Then** the challenge SHALL be invalidated
- **And** the client MUST start again from OTP send

---

### Requirement: Register with company requires ticket

For requests that include a non-empty `companyName`, the system SHALL require a valid `registrationTicket` whose email matches the registration body before creating `User` and `Company` rows.

#### Scenario: Register company with valid ticket

- **Given** `companyName` is non-empty
- **And** `registrationTicket` is present, signature valid, not expired, purpose `company_register`, email matches registration email
- **And** `jti` one-time use is implemented and not yet consumed
- **When** `POST /v1/auth/register` is processed
- **Then** registration SHALL proceed as today (transaction, modules, session behavior)

#### Scenario: Register company without ticket

- **Given** `companyName` is non-empty
- **And** `registrationTicket` is missing or invalid
- **When** `POST /v1/auth/register` is processed
- **Then** the server SHALL reject the request with a stable error code

#### Scenario: Register without company unchanged

- **Given** `companyName` is absent or empty
- **When** `POST /v1/auth/register` is processed
- **Then** the server SHALL NOT require `registrationTicket` (behavior aligned with pre-change registration without company)

---

### Requirement: Security and observability

The system MUST NOT log OTP plaintext, full captcha tokens, passwords, or full JWT tickets. Each request MUST remain traceable with `requestId` in logs for OTP and register steps per project observability rules.

---

### Requirement: Abuse controls

OTP endpoints SHALL have dedicated stricter rate-limit buckets (e.g. per IP / route) in addition to application-level send limits per email.
