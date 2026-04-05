# Política de Revisión de Accesos

**Versión:** 1.0 — Abril 2026  
**Responsable:** CTO  
**Frecuencia de revisión del proceso:** Anual  
**Frecuencia de ejecución:** Trimestral

---

## 1. Objetivo

Garantizar que solo las personas con necesidad legítima conserven acceso a sistemas, datos de producción e integraciones de terceros. Reduce la superficie de ataque por credenciales obsoletas y cumple con los principios de mínimo privilegio (GDPR, ISO 27001).

---

## 2. Revisión Trimestral de Accesos a Producción

### 2.1 Alcance

| Categoría | Incluye |
|-----------|---------|
| **Infraestructura** | Vercel dashboard, Neon (PostgreSQL), repositorio GitHub |
| **Secrets / API Keys** | Variables de entorno en Vercel, claves de servicios externos |
| **Acceso administrativo al sistema** | Usuarios con rol `SUPERADMIN` o `ADMIN` en la plataforma |
| **Integraciones de terceros** | OAuth apps, webhooks, tokens de servicio |

### 2.2 Proceso

1. **Listar accesos actuales:**
   - Vercel: Settings > Members — exportar lista de miembros y roles.
   - GitHub: Organization > People — revisar permisos por repositorio.
   - Neon: Settings > Members — revisar quién tiene acceso directo a la base de datos.
   - Sistema: ejecutar `GET /v1/users` con token SUPERADMIN para listar usuarios activos con roles elevados.

2. **Validar necesidad:**
   - ¿Esta persona aún trabaja en el proyecto/empresa?
   - ¿Su rol actual justifica el nivel de acceso?
   - ¿Ha habido actividad en los últimos 90 días?

3. **Revocar accesos no justificados:**
   - Remover de Vercel/GitHub/Neon.
   - Desactivar usuario en el sistema: `PATCH /v1/users/:id { "isActive": false }`.
   - Rotar secrets si el usuario tenía acceso a variables de entorno.

4. **Documentar resultado:**
   - Registrar en `docs/security/access-reviews/YYYY-QN.md` (crear el directorio si no existe):
     - Fecha de revisión
     - Revisores
     - Accesos evaluados
     - Accesos revocados y motivo
     - Accesos mantenidos y justificación

---

## 3. Checklist de Baja de Empleado / Colaborador

Ejecutar **el mismo día** de la salida de la persona.

### Accesos de plataforma
- [ ] Revocar acceso a Vercel (Settings > Members > Remove)
- [ ] Revocar acceso a GitHub (Organization > People > Remove)
- [ ] Revocar acceso a Neon / base de datos de producción
- [ ] Desactivar usuario en el sistema (si tenía cuenta): `isActive = false`
- [ ] Terminar sesiones activas en el sistema: `POST /v1/auth/sessions/terminate-others`

### Credenciales y secrets
- [ ] Rotar `JWT_SECRET` si la persona tenía acceso (invalidará todos los tokens activos)
- [ ] Rotar `FIELD_ENCRYPTION_KEY` si corresponde (requiere re-cifrado de datos — operación crítica, planificar)
- [ ] Revocar API keys de servicios externos que la persona administraba
- [ ] Cambiar contraseñas de cuentas compartidas (evitar cuentas compartidas en el futuro)

### Comunicaciones y accesos operacionales
- [ ] Remover de canales de Slack/Teams con acceso a información sensible
- [ ] Revocar acceso a gestor de contraseñas compartido (si aplica)
- [ ] Recuperar dispositivos corporativos (si aplica)

### Verificación
- [ ] Confirmar que el usuario ya no puede autenticarse en la plataforma
- [ ] Registrar la baja en el log de accesos: `docs/security/access-reviews/offboarding-log.md`

---

## 4. Inventario de Integraciones con Acceso a Datos

| Integración | Tipo de acceso | Datos a los que accede | Responsable | Última revisión |
|-------------|---------------|----------------------|-------------|-----------------|
| Vercel (hosting) | Infraestructura completa + env vars | Todo el stack | CTO | Trimestral |
| Neon (PostgreSQL) | Base de datos producción | Todos los datos | CTO | Trimestral |
| GitHub Actions | CI/CD, secrets de despliegue | Código + secrets de build | CTO | Trimestral |
| TruffleHog (CI) | Escaneo de código | Solo código, sin datos de BD | CTO | — |
| [Agregar otras integraciones] | — | — | — | — |

### Reglas para integraciones nuevas
Antes de agregar una nueva integración o servicio externo con acceso a datos:
1. Documentar en la tabla anterior.
2. Evaluar qué datos mínimos necesita (principio de mínimo privilegio).
3. Verificar política de privacidad del proveedor (Data Processing Agreement si aplica).
4. Aprobar con CTO.

---

## 5. Principios de Mínimo Privilegio

- Ningún usuario debe tener más acceso del estrictamente necesario para su función.
- Preferir acceso de solo lectura cuando no se necesita escritura.
- Cuentas de servicio deben tener alcance limitado (no usar credenciales de usuario humano para servicios automáticos).
- Variables de entorno sensibles (`JWT_SECRET`, `FIELD_ENCRYPTION_KEY`, `DATABASE_URL`) solo accesibles por el equipo de infraestructura.
- Acceso directo a base de datos de producción restringido al mínimo indispensable; preferir acceso vía API.
