# [completed] PLAN-26 - Auth Session Hardening

**Cerrado:** 2026-04-05.

## Objetivo
Cerrar los tres gaps de autenticación que quedan por debajo del estándar "nivel bancario": ausencia de bloqueo de cuenta por intentos fallidos, JWTs que siguen válidos después del logout, y ausencia de refresh token rotation.

## Estado (implementado)

Los gaps originales quedaron resueltos en código: `User.failedLoginAttempts` / `lockedUntil`, JWT con `jti` + blacklist Redis, access corto + refresh opaco rotado en `Session`, comprobación de sesión en cookie para revocación sin depender solo de Redis, auditoría de auth (incl. `companyId` nullable en `AuditLog`), UI Hub → Seguridad con sesiones, `deviceSummary`, `lastSeenAt` con throttle (`SESSION_LAST_SEEN_THROTTLE_SECONDS`).

**Matiz:** invalidación inmediata post-logout en flujo **cookie + fila `Session`**; clientes **solo Bearer** sin sesión en BD siguen dependiendo principalmente de Redis/blacklist para el `jti`.

---

## Fases (referencia — diseño)

### Fase 1 — Account lockout por intentos fallidos

**Schema (migración Prisma):**
```
User:
  failedLoginAttempts  Int      @default(0)
  lockedUntil          DateTime?
```

**Lógica en `auth.service.ts`:**
- Incrementar `failedLoginAttempts` en cada intento fallido.
- Si `failedLoginAttempts >= 5`: setear `lockedUntil = now() + 15 minutos`.
- Al inicio de `login`: si `lockedUntil > now()`, rechazar con 429 y tiempo restante.
- Al login exitoso: resetear `failedLoginAttempts = 0` y `lockedUntil = null`.
- Registrar en audit log (PLAN-19): `LOGIN_FAILED`, `ACCOUNT_LOCKED`, `ACCOUNT_UNLOCKED`.

**Parámetros configurables (via env):**
- `MAX_LOGIN_ATTEMPTS` (default: 5)
- `LOCKOUT_DURATION_MINUTES` (default: 15)

### Fase 2 — JWT blacklist en logout (Redis)

Usar Upstash Redis (ya disponible) para una blacklist de tokens revocados:

- Al hacer `logout`: escribir el `jti` (JWT ID) del token en Redis con TTL = tiempo restante de expiración del token.
- En `packages/api/src/core/auth.ts`, después de `jwt.verify`: verificar que el `jti` **no** esté en la blacklist Redis.
- El `jti` se genera al crear el token: agregar campo `jti: randomUUID()` al payload del JWT.
- Key en Redis: `blacklist:jwt:<jti>` con TTL automático → sin acumulación indefinida.
- Aplicar la misma lógica en `terminateOthersSessions`: blacklistear los JWTs de las sesiones terminadas.

### Fase 3 — Refresh token rotation

Reemplazar el JWT de larga vida por el patrón **access token (corto) + refresh token (largo, rotado)**:

| Token | Duración | Almacenamiento | Uso |
|-------|----------|----------------|-----|
| Access token (JWT) | 15 minutos | httpOnly cookie o memory | Cada request autenticado |
| Refresh token | 30 días | httpOnly cookie, DB Session | Solo para renovar access token |

**Cambios:**
- `generateToken`: emitir JWT con `expiresIn: '15m'`.
- `generateRefreshToken`: generar token opaco (`randomUUID()`), almacenar hash en `Session.sessionToken`, con `Session.expiresAt = now() + 30d`.
- Nuevo endpoint `POST /auth/refresh`: valida refresh token en DB, emite nuevo access token + rota el refresh token (invalida el anterior, emite uno nuevo).
- `logout`: eliminar sesión de DB + blacklistear access token actual.
- UI: interceptor en el cliente API para detectar 401 y llamar `/auth/refresh` automáticamente antes de propagar el error.

### Fase 4 — UI: gestión de sesiones activas

Exponer en Hub → Configuración → Seguridad:
- Lista de sesiones activas con: **resumen de dispositivo** (User-Agent), **IP**, **inicio de sesión** (`createdAt`), **última actividad** (`Session.lastSeenAt`, actualizada en `requireAuth` con throttle `SESSION_LAST_SEEN_THROTTLE_SECONDS`, mín. 30s; default 300s).
- Botón "Cerrar esta sesión" por sesión individual.
- Botón "Cerrar todas las otras sesiones" (ya existe `terminateOthersSessions`).

Endpoints:
- `GET /auth/sessions`: lista sesiones activas del usuario autenticado.
- `DELETE /auth/sessions/:sessionId`: cierra una sesión específica.
- `DELETE /auth/sessions` (bulk): cierra todas excepto la actual.

---

## Exit criteria
- [x] 5 intentos fallidos → cuenta bloqueada 15 minutos, mensaje informativo al usuario.
- [x] Logout invalida el JWT inmediatamente (verificable: token previo retorna 401).
- [x] Access token expira en 15 minutos; refresh token rota correctamente.
- [x] UI de sesiones activas visible en Hub → Seguridad.
- [x] `terminateOthersSessions` blacklistea JWTs de sesiones terminadas.
- [x] Eventos `LOGIN_FAILED`, `ACCOUNT_LOCKED` registrados en audit log (PLAN-19).

## Dependencias
- **PLAN-19** (Audit Log): para registrar eventos de seguridad de auth.
- No requiere nueva infra: usa Redis (Upstash) y Prisma existentes.
