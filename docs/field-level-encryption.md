# Field-Level Encryption

## Overview

This document describes the application-level field encryption (AES-256-GCM) implemented on top of Neon's disk-level AES-256 encryption and TLS in transit. Together, these layers ensure that a database dump alone is insufficient to read sensitive PII — the application key is required.

## Encrypted Fields

| Model | Field (DB column) | Note |
|-------|------------------|------|
| `Employee` | `idNumber` | National ID / document number — high-risk PII |
| `User` | `twoFactorSecret` | TOTP secret — encrypted via `encryptTotpSecret` when MFA is implemented (PLAN-24) |

### Search Index Fields

| Model | Field | Purpose |
|-------|-------|---------|
| `Employee` | `idNumberHash` | HMAC-SHA256 of `idNumber` for indexed searches |

Search queries against `idNumber` compute the same hash of the search term and match against `idNumberHash`. The hash is deterministic (lowercased before hashing) to support case-insensitive lookups.

## Algorithm

- **Cipher**: AES-256-GCM (authenticated encryption)
- **IV**: 12 random bytes, generated per encryption call
- **Auth tag**: 16 bytes (GCM default)
- **Storage format**: `base64(iv):base64(authTag):base64(ciphertext)` stored as `TEXT` in PostgreSQL
- **Search hash**: HMAC-SHA256 with the same key, input normalized to lowercase, output hex-encoded

## Key Configuration

`FIELD_ENCRYPTION_KEY` must be set in all deployed environments. It is a base64-encoded 32-byte (256-bit) symmetric key.

**Generate a new key:**

```bash
openssl rand -base64 32
```

**Set in environment:**

```env
FIELD_ENCRYPTION_KEY=<output of openssl rand -base64 32>
```

The server will refuse to start in production/staging/Vercel without this variable set. In development it logs a warning and field encryption is skipped gracefully (existing plaintext values are returned as-is).

## Implementation

Crypto utilities live in `packages/api/src/common/crypto/`:

| File | Purpose |
|------|---------|
| `field-encryption.ts` | Core `encryptField`, `decryptField`, `hashForSearch`, `getEncryptionKey` |
| `totp-secret.ts` | Wrappers `encryptTotpSecret`, `decryptTotpSecret` for MFA secrets |
| `index.ts` | Re-exports |

The service layer (`employees.service.ts`) calls these functions explicitly — no Prisma middleware is used, keeping encryption transparent and easy to audit.

**Read path (decrypt):** `safeDecrypt` falls back to the raw value when the key is absent or the value is in plaintext format (existing pre-encryption records).

**Write path (encrypt):** `createEmployee` and `updateEmployee` in `employees.service.ts` encrypt `idNumber` and set `idNumberHash` before any Prisma write.

## Key Rotation

Use `packages/api/scripts/rotate-field-key.ts` to re-encrypt all records with a new key.

**Prerequisites:**
- `OLD_FIELD_KEY` — the current active key (base64)
- `NEW_FIELD_KEY` — the new key to rotate to (base64)

**Steps:**

1. Dry run to validate decryption with the old key:

   ```bash
   OLD_FIELD_KEY=<current> NEW_FIELD_KEY=<new> npx tsx packages/api/scripts/rotate-field-key.ts --dry-run
   ```

2. Run in a maintenance window on staging:

   ```bash
   OLD_FIELD_KEY=<current> NEW_FIELD_KEY=<new> npx tsx packages/api/scripts/rotate-field-key.ts
   ```

3. Confirm counts match expectations, no errors reported.

4. Update `FIELD_ENCRYPTION_KEY` to the new key in environment variables and redeploy.

5. Repeat on production.

The script processes employees in batches of 100, logs per-record status, and exits with code 1 if any records fail to re-encrypt — allowing safe abort before swapping the active key.

## Verification

To verify that sensitive fields are not readable in a DB dump:

```sql
SELECT "idNumber", "idNumberHash" FROM employees WHERE "idNumber" IS NOT NULL LIMIT 5;
```

Expected output: `idNumber` values should look like `<base64>:<base64>:<base64>`, not plaintext document numbers.

## Future Scope

- `Employee.birthDate` is currently stored as a `DateTime` (Neon disk encryption covers it). If application-level encryption is required, add a `birthDateEncrypted String?` field and migrate following the same pattern as `idNumber`.
- `User.email` is an indexed unique field — encrypting it requires a deterministic cipher (not GCM) or a separate hash index, and affects login lookups. Deferred to a dedicated security review.
