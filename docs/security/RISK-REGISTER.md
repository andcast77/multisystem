# Registro de Riesgos de Seguridad

**Versión:** 1.0 — Abril 2026  
**Responsable:** CTO  
**Revisión:** Trimestral o tras cambios arquitectónicos significativos

---

## 1. Clasificación de Activos de Datos

| Clasificación | Descripción | Ejemplos en el sistema |
|--------------|-------------|----------------------|
| **Público** | Información que puede ser conocida por cualquier persona sin riesgo | Nombres de módulos, catálogos de productos públicos |
| **Interno** | Información operacional no sensible, de uso interno | Configuraciones de empresa, reportes de ventas agregados |
| **Confidencial** | Datos personales o de negocio cuya exposición tiene impacto moderado | Emails de usuarios, datos de empleados, historial de ventas, facturas |
| **Restringido** | Datos cuya exposición tiene impacto crítico legal, financiero o de seguridad | Contraseñas (hashed), secrets de 2FA, tokens JWT, claves de cifrado, datos fiscales (RFC/CUIT) |

---

## 2. Mapa de Activos Críticos

| Activo | Clasificación | Almacenamiento | Cifrado en reposo | Cifrado en tránsito |
|--------|--------------|---------------|-------------------|---------------------|
| Contraseñas de usuarios | Restringido | PostgreSQL (Neon) — `users.password` | bcrypt (unidireccional) | HTTPS/TLS |
| Secrets de 2FA (TOTP) | Restringido | PostgreSQL — `users.twoFactorSecret` | AES-256-GCM (PLAN-21) | HTTPS/TLS |
| JWT_SECRET | Restringido | Vercel Environment Variables | Vercel-managed | N/A |
| FIELD_ENCRYPTION_KEY | Restringido | Vercel Environment Variables | Vercel-managed | N/A |
| Emails y datos de perfil | Confidencial | PostgreSQL — `users` | En tránsito (TLS) | HTTPS/TLS |
| Datos de empleados (DNI/CUIT) | Confidencial/Restringido | PostgreSQL — `employees` | AES-256-GCM (PLAN-21) | HTTPS/TLS |
| Historial de ventas | Confidencial | PostgreSQL — `sales`, `sale_items` | TLS | HTTPS/TLS |
| Facturas | Confidencial | PostgreSQL — `invoices` | TLS | HTTPS/TLS |
| Audit logs | Interno/Confidencial | PostgreSQL — `audit_logs` | TLS | HTTPS/TLS |
| Credenciales de BD | Restringido | Vercel Environment Variables | Vercel-managed | TLS |

---

## 3. Registro de Riesgos

### R-01 — Compromiso de credenciales de producción

| Campo | Detalle |
|-------|---------|
| **Descripción** | Acceso no autorizado a Vercel, GitHub o Neon mediante credenciales comprometidas |
| **Probabilidad** | Media |
| **Impacto** | Crítico |
| **Nivel de riesgo** | Alto |
| **Mitigaciones activas** | MFA en GitHub y Vercel, revisión trimestral de accesos (ACCESS-REVIEW.md), secrets almacenados en Vercel env vars |
| **Plan vinculado** | PLAN-22, PLAN-26 |
| **Responsable** | CTO |
| **Estado** | En mitigación |

---

### R-02 — Exfiltración de datos personales (PII)

| Campo | Detalle |
|-------|---------|
| **Descripción** | Acceso no autorizado a datos personales de usuarios o empleados mediante inyección SQL, IDOR o explotación de API |
| **Probabilidad** | Baja |
| **Impacto** | Crítico |
| **Nivel de riesgo** | Alto |
| **Mitigaciones activas** | Tenant isolation en todas las queries (PLAN arquitectura), cifrado de campos sensibles (PLAN-21), Prisma ORM (no SQL raw en rutas críticas), validación de body con Zod |
| **Plan vinculado** | PLAN-21, PLAN-22 |
| **Responsable** | CTO / Backend |
| **Estado** | En mitigación |

---

### R-03 — Vulnerabilidades en dependencias (supply chain)

| Campo | Detalle |
|-------|---------|
| **Descripción** | Dependencia npm con CVE explotable que afecte al sistema |
| **Probabilidad** | Media |
| **Impacto** | Variable (bajo a crítico según CVE) |
| **Nivel de riesgo** | Medio |
| **Mitigaciones activas** | `pnpm audit --audit-level=high` en CI (PLAN-22), revisión manual de dependencias en PRs críticos |
| **Plan vinculado** | PLAN-22 |
| **Responsable** | Backend |
| **Estado** | Mitigado en CI |

---

### R-04 — Secrets en código fuente

| Campo | Detalle |
|-------|---------|
| **Descripción** | API keys, passwords o tokens hardcodeados en commits del repositorio |
| **Probabilidad** | Baja |
| **Impacto** | Crítico |
| **Nivel de riesgo** | Alto |
| **Mitigaciones activas** | TruffleHog en CI (PLAN-22), `.gitignore` para archivos `.env`, variables de entorno nunca en código |
| **Plan vinculado** | PLAN-22 |
| **Responsable** | Todos los desarrolladores |
| **Estado** | Mitigado en CI |

---

### R-05 — Ataques de fuerza bruta / credential stuffing

| Campo | Detalle |
|-------|---------|
| **Descripción** | Intentos masivos de autenticación con credenciales filtradas de otras brechas |
| **Probabilidad** | Alta |
| **Impacto** | Medio |
| **Nivel de riesgo** | Medio |
| **Mitigaciones activas** | Rate limiting en endpoints de auth (`rate-limit.plugin.ts`), bcrypt con cost factor 10, MFA/TOTP disponible (PLAN-24) |
| **Plan vinculado** | PLAN-22, PLAN-24 |
| **Responsable** | Backend |
| **Estado** | En mitigación |

---

### R-06 — Cross-tenant data leak

| Campo | Detalle |
|-------|---------|
| **Descripción** | Un usuario de empresa A accede a datos de empresa B mediante manipulación de IDs en requests |
| **Probabilidad** | Baja |
| **Impacto** | Crítico |
| **Nivel de riesgo** | Alto |
| **Mitigaciones activas** | `companyId` scope obligatorio en todas las queries (multi-tenant-architecture.mdc), tests de regresión de aislamiento de tenant (`__tests__/integration/`) |
| **Plan vinculado** | Arquitectura base |
| **Responsable** | Backend |
| **Estado** | Mitigado estructuralmente |

---

### R-07 — Incumplimiento de derechos GDPR / LFPDPPP / PDPA Argentina

| Campo | Detalle |
|-------|---------|
| **Descripción** | Imposibilidad de responder a solicitudes de derechos de titulares de datos en plazos legales |
| **Probabilidad** | Media |
| **Impacto** | Alto (sanciones regulatorias) |
| **Nivel de riesgo** | Alto |
| **Mitigaciones activas** | `GET /account/my-data`, `DELETE /account/my-data`, `POST /account/accept-privacy` (PLAN-22); documentación LatAm (PLAN-22) |
| **Plan vinculado** | PLAN-22 |
| **Responsable** | DPO / CTO |
| **Estado** | En mitigación |

---

## 4. Matriz de Riesgo Residual

| Riesgo | Nivel inicial | Mitigaciones | Nivel residual |
|--------|--------------|--------------|----------------|
| R-01 Compromiso credenciales | Alto | MFA + acceso reviews | Medio |
| R-02 Exfiltración PII | Alto | Cifrado + tenant isolation | Bajo |
| R-03 Supply chain | Medio | pnpm audit en CI | Bajo |
| R-04 Secrets en código | Alto | TruffleHog CI | Bajo |
| R-05 Fuerza bruta | Medio | Rate limiting + bcrypt | Bajo |
| R-06 Cross-tenant leak | Alto | Tenant isolation estructural | Bajo |
| R-07 Incumplimiento regulatorio | Alto | Endpoints GDPR + docs LatAm | Medio |

---

## 5. Próximas acciones

- [ ] Implementar PLAN-26 (hardening de sesiones auth) para reducir R-01
- [ ] Implementar PLAN-24 (MFA/TOTP) para reducir R-05
- [ ] Registrar bases de datos ante DNPDP (Argentina) — ver ARGENTINA-PDPA.md
- [ ] Publicar aviso de privacidad en Hub (México) — ver MEXICO-LFPDPPP.md
- [ ] Evaluar Data Protection Impact Assessment (DPIA) para módulos de empleados y ventas
