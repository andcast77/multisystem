# PLAN-24 - MFA / Autenticación de Dos Factores (TOTP)

## Objetivo
Completar la implementación de MFA para respaldar el claim "seguridad de nivel bancario". El schema ya tiene `twoFactorEnabled` y `twoFactorSecret` en el modelo `User`, pero no existe ninguna implementación en el API ni en el frontend.

## Estado actual
- `packages/database/prisma/schema.prisma`: campos `twoFactorEnabled: Boolean @default(false)` y `twoFactorSecret: String?` en modelo `User`.
- Búsqueda de `totp`, `2fa`, `mfa`, `speakeasy`, `otplib` en `packages/api/src/` → **0 resultados**.
- No hay UI de MFA en Hub (`apps/hub/src/`).

## Decisión de stack
- **TOTP** (Time-based One-Time Password, RFC 6238): estándar compatible con Google Authenticator, Authy, 1Password, Microsoft Authenticator.
- Librería: `otplib` (soporte TOTP nativo en Node, sin dependencias pesadas, ESM compatible).
- El `twoFactorSecret` se almacena **cifrado** en DB usando la utilidad de PLAN-21 (`encryptField`) — nunca en texto plano.
- QR code para setup: generar con `qrcode` (ya disponible en ecosistema Node) desde el URI `otpauth://`.

## Flujo de usuario

```
Setup MFA:
  1. Usuario va a Configuración de Cuenta → Seguridad
  2. Solicita activar MFA → API genera secret + URI otpauth
  3. UI muestra QR para escanear con app autenticadora
  4. Usuario ingresa código TOTP para verificar
  5. API valida, guarda secret cifrado, activa twoFactorEnabled
  6. Se muestran códigos de recuperación (backup codes)

Login con MFA activo:
  1. Usuario completa email + contraseña
  2. API responde con status 200 + { mfaRequired: true, tempToken }
  3. Frontend muestra pantalla de código TOTP
  4. Usuario ingresa código → API verifica y emite JWT definitivo

Desactivar MFA:
  1. Usuario va a Seguridad → Desactivar MFA
  2. Requiere confirmar con código TOTP actual o código de recuperación
  3. API limpia twoFactorSecret, pone twoFactorEnabled = false
```

## Fases

### Fase 1 — Backend: setup y verificación TOTP
- Instalar `otplib` en `packages/api`.
- Crear `packages/api/src/services/mfa.service.ts`:
  - `generateSecret(userId)`: genera secret TOTP, devuelve URI `otpauth://` para QR.
  - `verifyToken(secret, token)`: valida código TOTP (ventana de 1 paso de tolerancia).
  - `generateBackupCodes()`: genera 8 códigos de recuperación de un solo uso (hash almacenado en DB).
- Almacenar `twoFactorSecret` cifrado con `encryptField` de PLAN-21 (dependencia de ese plan).
- Agregar modelo `MfaBackupCode` al schema o campo `backupCodes: String[]` en User.

### Fase 2 — Backend: flujo de login modificado
- Modificar `auth.service.ts` / `auth.controller.ts`:
  - Si `user.twoFactorEnabled === true` después de validar contraseña: no emitir JWT definitivo.
  - Emitir **temp token** (JWT de corta vida, 5 min, scope: `mfa-pending`) con solo `userId`.
  - Nuevo endpoint `POST /auth/mfa/verify`: recibe `{ tempToken, totpCode }` y emite JWT definitivo si el código es válido.
  - Endpoint `POST /auth/mfa/verify-backup`: acepta código de recuperación (invalida ese código tras uso).
- Actualizar audit log (PLAN-19): registrar `MFA_VERIFIED`, `MFA_FAILED`, `MFA_BACKUP_USED`.

### Fase 3 — Backend: gestión de MFA (rutas protegidas)
- `POST /account/mfa/setup` → genera y devuelve URI otpauth + QR data URL.
- `POST /account/mfa/confirm` → confirma setup con primer código TOTP.
- `DELETE /account/mfa` → desactiva MFA (requiere código TOTP o backup code).
- `GET /account/mfa/backup-codes` → lista códigos de recuperación (con indicación de cuáles ya se usaron).
- `POST /account/mfa/backup-codes/regenerate` → regenera todos los backup codes (requiere TOTP).

### Fase 4 — Frontend: cuenta (Hub) y login MFA en todas las apps
- **Hub — gestión MFA:** nueva sección en [`apps/hub/src/pages/AccountPage.tsx`](apps/hub/src/pages/AccountPage.tsx) (ruta `/dashboard/account`), pestaña o bloque **Seguridad**:
  - Estado actual de MFA (activo/inactivo).
  - Botón "Activar MFA" → flujo con QR + campo de verificación.
  - Una vez activo: mostrar backup codes, opción de desactivar.
- **Login con MFA (segundo factor) en todos los frontends** que usan el API de auth compartido — cuando el API devuelve `mfaRequired: true`, mostrar formulario TOTP (y flujo de código de recuperación vía endpoint correspondiente) antes de sesión completa:
  - Hub — [`apps/hub/src/pages/LoginPage.tsx`](apps/hub/src/pages/LoginPage.tsx)
  - Shopflow — [`apps/shopflow/src/views/LoginPage.tsx`](apps/shopflow/src/views/LoginPage.tsx)
  - Workify — [`apps/workify/src/components/forms/LoginForm.tsx`](apps/workify/src/components/forms/LoginForm.tsx)
  - **Techservices** — [`apps/techservices/src/app/login/page.tsx`](apps/techservices/src/app/login/page.tsx)

### Fase 5 — Hardening
- Rate limit estricto en `/auth/mfa/verify` (máximo 5 intentos, luego bloqueo temporal).
- Backup codes son de un solo uso y se invalidan al usarse.
- Expiración del temp token: 5 minutos máximo.
- Nunca devolver el `twoFactorSecret` en ningún endpoint después del setup inicial.

## Exit criteria
- [x] `otplib` instalado, `mfa.service.ts` con generate + verify + backup codes.
- [x] `twoFactorSecret` cifrado en DB (integración con PLAN-21).
- [x] Login con MFA activo requiere segundo factor antes de emitir JWT.
- [x] UI en Hub permite activar, verificar y desactivar MFA.
- [x] Login con MFA funciona en Hub, Shopflow, Workify y Techservices (respuesta `mfaRequired` + paso TOTP).
- [x] Backup codes funcionales y se invalidan tras uso.
- [x] Rate limiting en endpoints MFA.
- [x] Eventos MFA registrados en audit log (PLAN-19).

## Dependencias
- **PLAN-21** (Field-level Encryption): para cifrar `twoFactorSecret` en DB.
- **PLAN-19** (Audit Log): para registrar eventos MFA.
