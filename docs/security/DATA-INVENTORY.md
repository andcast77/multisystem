# Inventario de Datos y Política de Retención

**Versión:** 1.0 — Abril 2026  
**Responsable:** CTO / DPO  
**Revisión:** Anual o ante cambios de modelos de datos

---

## 1. Mapa de Datos Recopilados

### 1.1 Datos de Usuarios (modelo `User`)

| Campo | Tipo | Propósito | Clasificación | Compartido con |
|-------|------|-----------|--------------|---------------|
| `email` | PII identificativa | Autenticación, comunicación | Confidencial | Ninguno externo |
| `firstName`, `lastName` | PII | Identificación en interfaz | Confidencial | Ninguno externo |
| `phone` | PII | Contacto opcional | Confidencial | Ninguno externo |
| `password` | Credencial | Autenticación | Restringido (bcrypt) | Nadie — hash unidireccional |
| `twoFactorSecret` | Credencial | MFA | Restringido (AES-256-GCM) | Nadie — cifrado |
| `privacyAcceptedAt` | Metadato de consentimiento | Evidencia de consentimiento GDPR | Interno | Ninguno |
| `role`, `isActive` | Estado | Control de acceso | Interno | Ninguno externo |
| `createdAt`, `updatedAt` | Timestamps | Auditoría interna | Interno | Ninguno |

**Base legal (GDPR):** Ejecución de contrato (Art. 6.1.b) para datos de autenticación y perfil. Consentimiento (Art. 6.1.a) para comunicaciones opcionales.

---

### 1.2 Datos de Empleados (módulo Workify — modelo `Employee`)

| Campo | Tipo | Propósito | Clasificación | Compartido con |
|-------|------|-----------|--------------|---------------|
| `firstName`, `lastName` | PII | Identificación | Confidencial | Empresa cliente (responsable del tratamiento) |
| `birthDate`, `gender` | PII sensible | Gestión de RRHH | Confidencial | Empresa cliente |
| `idNumber` / `idNumberHash` | PII identificativa | Nómina, documentación | Restringido (hash + cifrado) | Empresa cliente |
| `dateJoined`, `status` | Estado laboral | Gestión de RRHH | Interno/Confidencial | Empresa cliente |

**Nota:** La empresa cliente es el "responsable del tratamiento" de los datos de sus empleados. El sistema actúa como "encargado del tratamiento" (procesador de datos). Se requiere DPA (Data Processing Agreement).

---

### 1.3 Datos de Ventas y Clientes (módulo Shopflow)

| Categoría | Datos | Clasificación | Propósito | Compartido con |
|-----------|-------|--------------|-----------|---------------|
| Clientes | nombre, email, teléfono, dirección | Confidencial | Gestión comercial | Empresa cliente |
| Ventas | total, ítems, método de pago | Confidencial | Registro fiscal / operacional | Empresa cliente |
| Facturas | datos fiscales, montos | Confidencial/Restringido | Requerimiento fiscal | Empresa cliente |

**Requerimiento fiscal:** Datos de ventas/facturas deben conservarse **5 años** (requerimiento fiscal mínimo en Argentina y México).

---

### 1.4 Datos de Sesiones y Actividad

| Dato | Propósito | Retención | Clasificación |
|------|-----------|-----------|--------------|
| `Session.sessionToken` | Autenticación activa | Hasta expiración (máx. 7 días) | Restringido |
| `Session.ipAddress`, `userAgent` | Seguridad, detección de anomalías | Hasta expiración de sesión | Confidencial |
| `AuditLog` | Trazabilidad de operaciones | 12 meses activo | Interno/Confidencial |
| `ActionHistory` | Registro de acciones Shopflow | 12 meses activo | Interno |

---

### 1.5 Datos de Terceros (integraciones)

| Servicio | Datos enviados | Propósito | DPA en vigor |
|----------|---------------|-----------|-------------|
| **Neon (PostgreSQL)** | Todos los datos de BD | Almacenamiento | Revisar DPA de Neon (EEA/US) |
| **Vercel** | Código + logs de aplicación | Hosting | Revisar DPA de Vercel |
| **GitHub** | Código fuente | Control de versiones y CI | Revisar ToS GitHub |

---

## 2. Política de Retención de Datos

| Tipo de dato | Retención activa | Acción al vencer |
|--------------|-----------------|-----------------|
| **Sesiones de usuario** | Hasta expiración (7 días por defecto) | Eliminación automática por job diario (03:00 AM) |
| **Audit logs** | 12 meses | Eliminación automática por job de retención (PLAN-22) |
| **Action history (Shopflow)** | 12 meses | Eliminación automática por job de retención |
| **Datos de ventas / facturas** | 5 años | Retención por requerimiento fiscal — no eliminación automática |
| **Datos de empleados (activos)** | Duración de la relación laboral + 5 años | Manual / gestión empresa cliente |
| **Datos de usuarios anonimizados** | Indefinido (solo datos anonimizados) | No aplica (no hay PII) |
| **Tokens de verificación / reset** | 24 horas (expiración explícita) | Automático por lógica de autenticación |

### 2.1 Job de retención automática

El job `data-retention` se ejecuta **diariamente a las 03:00 AM** y realiza:
1. Eliminación de sesiones expiradas.
2. Eliminación de audit logs con más de 12 meses de antigüedad.
3. Eliminación de action history con más de 12 meses de antigüedad.

**Archivado a largo plazo (audit logs — hasta 7 años):** El archivado fuera de la base de datos activa es una operación operacional que debe planificarse por separado (export a almacenamiento frío como S3/Blob antes de la eliminación). Pendiente de implementar si requerido por regulación.

---

## 3. Flujos de Datos

```
Usuario (Hub) → API (Vercel Serverless) → PostgreSQL (Neon)
                     ↓
              Neon almacena todos los datos en la región configurada
              (verificar región: us-east-1 por defecto — revisar para cumplimiento LatAm)
```

**Transferencias internacionales a considerar:**
- Neon opera en AWS us-east-1 por defecto. Si los usuarios son de Argentina o México, los datos se transfieren fuera del país.
- Argentina Ley 25.326: requiere nivel "adecuado" de protección para transferencias al exterior. Verificar con Neon si tienen Standard Contractual Clauses (SCCs).
- México LFPDPPP: requiere cláusulas contractuales para transferencia internacional.

---

## 4. Data Protection Impact Assessment (DPIA) — Flujos de Alto Riesgo

### 4.1 Datos de empleados (Workify)

- **Riesgo:** Datos laborales sensibles (salarios, licencias, evaluaciones).
- **Necesidad de DPIA:** Alta (datos de categoría especial si incluye salud o datos biométricos en el futuro).
- **Medidas:** Cifrado de campos sensibles (PLAN-21), tenant isolation, acceso restringido a ADMIN/OWNER.
- **Estado:** DPIA simplificada — pendiente formalización si aplica biometría o salud.

### 4.2 Historial de ventas con datos de clientes (Shopflow)

- **Riesgo:** Perfil de comportamiento de consumo de personas naturales.
- **Necesidad de DPIA:** Media.
- **Medidas:** Acceso limitado por companyId, no se comparte con terceros, datos de clientes opcionales (solo nombre/email/teléfono).
- **Estado:** Cubierto por arquitectura multi-tenant.

---

## 5. Ejercicio de Derechos de Titulares

| Derecho | Endpoint disponible | Plazo de respuesta |
|---------|--------------------|--------------------|
| Acceso (Art. 15 GDPR / ARCO) | `GET /account/my-data` | Inmediato (exportación automática) |
| Supresión/Olvido (Art. 17 GDPR / ARCO Cancelación) | `DELETE /account/my-data` | Inmediato (anonimización automática) |
| Consentimiento | `POST /account/accept-privacy` | Inmediato |
| Rectificación | `PUT /v1/users/:id` (con autenticación) | Inmediato |
| Solicitud formal México (ARCO) | Email a DPO + proceso interno | 20 días hábiles (LFPDPPP) |
| Solicitud formal Argentina | Email a DPO + proceso interno | 30 días hábiles (Ley 25.326) |
