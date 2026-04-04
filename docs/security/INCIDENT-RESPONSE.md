# Política de Respuesta a Incidentes de Seguridad

**Versión:** 1.0 — Abril 2026  
**Responsable:** CTO / DPO (Data Protection Officer)  
**Revisión:** Anual o tras cualquier incidente P1/P2

---

## 1. Definición de Severidades

| Nivel | Descripción | Ejemplos | Tiempo de respuesta inicial |
|-------|-------------|----------|-----------------------------|
| **P1 — Crítico** | Incidente activo con impacto directo en datos de usuarios o disponibilidad total del sistema | Exfiltración de datos, ransomware, acceso no autorizado a producción | **15 minutos** |
| **P2 — Alto** | Potencial exposición de datos o degradación severa del servicio | Vulnerability explotada sin confirmación de exfiltración, caída parcial, credenciales comprometidas | **1 hora** |
| **P3 — Medio/Bajo** | Anomalía de seguridad sin impacto confirmado en datos o servicio | Intentos de fuerza bruta bloqueados, configuración incorrecta detectada, dependencia con CVE sin explotar | **24 horas** |

---

## 2. Roles y Responsabilidades

| Rol | Responsabilidades durante un incidente |
|-----|----------------------------------------|
| **Coordinador de incidente** (CTO) | Declarar nivel de severidad, coordinar equipos, comunicación externa |
| **Técnico de respuesta** (Backend/DevOps) | Contención técnica, análisis forense inicial, aplicación de parches |
| **DPO / Responsable legal** | Evaluación de obligaciones de notificación (GDPR Art. 33, LFPDPPP, Ley 25.326) |

---

## 3. Proceso de Respuesta

### 3.1 Detección y Evaluación

1. El incidente es reportado o detectado por monitoring, alerta automática o reporte interno.
2. El técnico de guardia evalúa la severidad (P1/P2/P3) en los primeros **15 minutos**.
3. Se abre un canal de incidente dedicado (Slack/Teams: `#incident-YYYY-MM-DD`).
4. Se escala a Coordinador si severidad es P1 o P2.

### 3.2 Contención

**Para P1:**
- Revocar credenciales y tokens afectados de inmediato.
- Aislar servicios comprometidos (escalar a Vercel support si aplica).
- Preservar logs antes de cualquier acción que pueda sobrescribirlos.
- Notificar al DPO dentro de **1 hora** de la confirmación del incidente.

**Para P2:**
- Evaluar si es necesario revocar accesos.
- Activar auditoría adicional en módulos afectados.
- Determinar alcance de datos expuestos.

**Para P3:**
- Documentar y seguir en la siguiente revisión de seguridad.

### 3.3 Investigación

- Recolectar audit logs (`AuditLog`, `ActionHistory`) del período afectado.
- Identificar IPs, user agents y secuencias de acciones anómalas.
- Determinar qué datos fueron accedidos, modificados o exfiltrados.
- Documentar timeline del incidente con evidencias.

### 3.4 Notificación

#### GDPR (Art. 33 — Notificación a autoridad supervisora)
- **Plazo:** Dentro de las **72 horas** desde la detección del incidente.
- **A quién:** Autoridad de protección de datos competente (según jurisdicción).
- **Qué incluir:** Naturaleza de la brecha, categorías y número aproximado de afectados, consecuencias probables, medidas tomadas.

#### Notificación a usuarios afectados (GDPR Art. 34)
- Si la brecha es probable que resulte en alto riesgo para los derechos de las personas, notificar **sin dilación indebida**.
- Comunicación clara sobre qué datos se vieron afectados y qué medidas tomar.

#### Ley Argentina 25.326 / LFPDPPP México
- Ver `ARGENTINA-PDPA.md` y `MEXICO-LFPDPPP.md` para obligaciones específicas.

### 3.5 Recuperación

- Aplicar parches o configuraciones correctivas.
- Restablecer servicios de forma controlada.
- Verificar integridad de datos.
- Monitoreo intensificado durante 72 horas post-recuperación.

### 3.6 Post-Mortem

- Redactar post-mortem dentro de los **5 días hábiles** siguientes al cierre.
- Incluir: timeline, causa raíz, impacto, medidas correctivas, lecciones aprendidas.
- Registrar en `docs/security/incidents/` (crear directorio si no existe).

---

## 4. Contactos Clave

| Rol | Contacto | Disponibilidad |
|-----|----------|---------------|
| CTO / Coordinador | [Completar] | 24/7 para P1 |
| DPO / Responsable legal | [Completar] | Horas hábiles + on-call P1 |
| DevOps / Infra | [Completar] | 24/7 para P1/P2 |
| Vercel Support | https://vercel.com/support | Según plan contratado |
| Neon (PostgreSQL) | https://neon.tech/docs/introduction/support | Según plan contratado |

---

## 5. Herramientas de Apoyo

- **Logs de aplicación:** Vercel Function logs / observabilidad configurada.
- **Audit log del sistema:** `GET /v1/audit-logs` (requiere autenticación ADMIN/SUPERADMIN).
- **Revocación de sesiones:** `DELETE /v1/auth/sessions` + rotación de `JWT_SECRET` en Vercel env vars.
- **Secrets rotation:** Rotar `JWT_SECRET`, `FIELD_ENCRYPTION_KEY`, database URL en Vercel Dashboard > Settings > Environment Variables.

---

## 6. Lista de Verificación Rápida (P1)

- [ ] Incidente detectado y documentado con timestamp
- [ ] Severidad declarada: P1
- [ ] Canal de incidente abierto
- [ ] Técnico + Coordinador notificados
- [ ] Logs preservados
- [ ] Credenciales comprometidas revocadas
- [ ] DPO notificado (dentro de 1h de confirmación)
- [ ] Alcance de datos evaluado
- [ ] Autoridad de protección de datos notificada (si aplica, dentro de 72h)
- [ ] Usuarios afectados notificados (si aplica)
- [ ] Recuperación completada y verificada
- [ ] Post-mortem agendado
