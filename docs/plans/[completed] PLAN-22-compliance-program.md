# PLAN-22 - Programa de Compliance (GDPR + Seguridad Empresarial)

## Objetivo
Respaldar el claim "cumplimiento con estándares internacionales de seguridad" con cambios concretos en el sistema y documentación de procesos. Combina cambios de código (derechos de titulares de datos) con definición de procesos organizacionales.

## Alcance

El compliance no es solo código — es un programa que combina:
1. **Cambios técnicos en el sistema** (código): derechos GDPR, retención de datos, consentimiento.
2. **Procesos operacionales** (documentación): respuesta a incidentes, revisiones de acceso, gestión de riesgos.

Este plan cubre ambas dimensiones.

## Fases

### Fase 1 — Derechos GDPR en el sistema (código)

#### Derecho de acceso (Art. 15 GDPR)
- Endpoint `GET /account/my-data`: exporta todos los datos personales del usuario autenticado en formato JSON estructurado.
- Incluye: datos de perfil, historial de actividad, membresías, audit logs del usuario.

#### Derecho al olvido (Art. 17 GDPR)
- Endpoint `DELETE /account/my-data`: anonimiza o elimina datos personales del usuario.
- Implementar soft-delete con anonimización: `email → deleted_<uuid>@deleted.local`, `name → [Eliminado]`.
- Preservar registros de audit con `userId: null` (integridad del log sin PII).
- Solo procesable si el usuario no es el único `OWNER` activo de una empresa.

#### Consentimiento y política de privacidad
- Agregar campo `privacyAcceptedAt: DateTime?` en modelo `User`.
- En el flujo de registro (Hub): mostrar política y requerir aceptación explícita antes de crear la cuenta.
- Endpoint `POST /account/accept-privacy`: registrar timestamp de aceptación.

#### Retención de datos
- Definir y documentar política de retención por tipo de dato:
  - Audit logs: 12 meses activos, archivado hasta 7 años.
  - Datos de ventas: 5 años (requerimiento fiscal).
  - Datos de sesión/tokens: 90 días.
- Crear job de limpieza (integrar con PLAN-20 runner) para datos vencidos.

### Fase 2 — Procesos de seguridad (documentación)

#### Política de respuesta a incidentes
- Crear `docs/security/INCIDENT-RESPONSE.md`:
  - Definición de severidades (P1/P2/P3).
  - Pasos de contención, investigación y notificación.
  - Plazo de notificación a afectados: 72hs desde detección (GDPR Art. 33).
  - Contacto de DPO (Data Protection Officer) o responsable.

#### Revisiones de acceso
- Crear `docs/security/ACCESS-REVIEW.md`:
  - Proceso trimestral de revisión de usuarios con acceso a producción.
  - Checklist de revocación de acceso al salir un empleado.
  - Inventario de integraciones con acceso a datos (API keys, servicios terceros).

#### Gestión de riesgos
- Crear `docs/security/RISK-REGISTER.md`:
  - Inventario de activos de datos y su clasificación (público / interno / confidencial / restringido).
  - Riesgos identificados y mitigaciones en curso.
  - Vincular con planes activos (PLAN-21 para cifrado, PLAN-19 para audit log).

### Fase 3 — Hardening técnico complementario

- **Headers de seguridad**: agregar `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy` en respuestas Fastify.
- **Dependency scanning**: agregar `pnpm audit` en CI para detectar vulnerabilidades en dependencias.
- **Secrets scanning**: configurar verificación de que no hay secrets en commits (pre-commit hook o CI check).

### Fase 4 — Inventario de datos y DPIA
- Crear `docs/security/DATA-INVENTORY.md`: mapa de qué datos se recopilan, dónde se almacenan, con quién se comparten.
- Data Protection Impact Assessment (DPIA) simplificada para flujos de alto riesgo (ventas, datos de empleados).

### Fase 5 — Regulaciones de protección de datos latinoamericanas

Si el sistema opera en Argentina o México (mercados primarios del producto), aplican leyes locales **adicionales** a GDPR:

#### Argentina — Ley 25.326 (PDPA) + Decreto 1558/01
- **Registro de bases de datos**: Las bases de datos con PII deben registrarse ante la DNPDP (Dirección Nacional de Protección de Datos Personales).
- **Responsable del tratamiento**: El sistema debe identificar explícitamente al responsable del fichero (la empresa que usa el software, no solo el proveedor).
- **Transferencias internacionales**: Requiere nivel "adecuado" de protección para transferir datos fuera de Argentina. Neon (Postgres serverless) debe evaluar su región de almacenamiento.
- **Acción técnica requerida**: Agregar cláusula contractual (DPA) en onboarding de empresas clientes + documentar en `docs/security/ARGENTINA-PDPA.md`.

#### México — LFPDPPP (Ley Federal de Protección de Datos Personales en Posesión de los Particulares)
- **Aviso de privacidad simplificado y completo**: Requerido en el punto de recolección de datos (registro, formularios). Debe estar accesible en Hub.
- **Derechos ARCO** (Acceso, Rectificación, Cancelación, Oposición): Similar a GDPR; el endpoint `GET /account/my-data` y `DELETE /account/my-data` de Fase 1 los cubren tecnológicamente — agregar flujo de solicitud formal con plazo de respuesta de 20 días hábiles.
- **Consentimiento explícito para datos sensibles**: Datos de salud, biometría, origen étnico requieren consentimiento expreso (relevante para Workify si registra datos de empleados con esas características).
- **Acción técnica requerida**: Aviso de privacidad accesible desde el registro + documentar en `docs/security/MEXICO-LFPDPPP.md`.

#### Acciones transversales LatAm
- Documentar en qué jurisdicción opera cada instancia del sistema (empresa cliente) para determinar ley aplicable.
- Definir si los clientes son "responsables" y el sistema es "encargado" (proveedor de SaaS) — esto afecta las obligaciones contractuales.
- Crear plantilla de DPA (Data Processing Agreement) para contratos con clientes en Argentina y México.

## Exit criteria
- [x] Endpoint de exportación de datos personales (`GET /account/my-data`) funcionando.
- [x] Endpoint de eliminación/anonimización (`DELETE /account/my-data`) con soft-delete.
- [x] Campo `privacyAcceptedAt` en User y flujo de aceptación en registro.
- [x] Política de retención documentada y job de limpieza definido.
- [x] `INCIDENT-RESPONSE.md`, `ACCESS-REVIEW.md`, `RISK-REGISTER.md` creados.
- [x] Headers de seguridad HTTP presentes en todas las respuestas.
- [x] `pnpm audit` en CI sin vulnerabilidades críticas o altas sin mitigación.
- [x] `ARGENTINA-PDPA.md` con acciones de registro DNPDP y plantilla DPA.
- [x] `MEXICO-LFPDPPP.md` con aviso de privacidad y flujo de derechos ARCO.
- [x] Aviso de privacidad accesible desde la pantalla de registro en Hub.
