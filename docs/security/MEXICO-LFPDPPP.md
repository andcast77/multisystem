# Cumplimiento — México: LFPDPPP

**Versión:** 1.0 — Abril 2026  
**Responsable:** DPO / CTO  
**Referencia legal:** Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), DOF 05-07-2010; Reglamento de la LFPDPPP (DOF 21-12-2011); Lineamientos del Aviso de Privacidad (DOF 17-01-2013)

---

## 1. Marco Regulatorio

La **LFPDPPP** regula el tratamiento de datos personales en posesión de particulares (personas físicas o morales del sector privado). Aplica cuando:
- El sistema trata datos de personas ubicadas en México, **o**
- La empresa cliente tiene sede u operaciones en México.

El organismo regulador es el **INAI** (Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales).

---

## 2. Roles: Responsable vs. Encargado

| Rol | Entidad | Obligaciones |
|-----|---------|-------------|
| **Responsable** | Empresa cliente (la que recopila datos de sus empleados, clientes, etc.) | Publicar aviso de privacidad, recabar consentimiento, atender derechos ARCO |
| **Encargado** | Proveedor SaaS (el sistema) | Tratar datos solo según instrucciones del responsable, garantizar seguridad, suscribir contrato de encargo |

---

## 3. Aviso de Privacidad

### 3.1 Requisito legal

La LFPDPPP (Art. 15-17) exige que en el momento de la recopilación de datos personales, el responsable ponga a disposición del titular un **Aviso de Privacidad**.

### 3.2 Contenido mínimo del Aviso de Privacidad (Art. 16)

El aviso debe incluir:
1. Identidad y domicilio del responsable.
2. Finalidades del tratamiento (primarias y secundarias).
3. Opciones para limitar el uso de datos (opt-out para finalidades secundarias).
4. Transferencias de datos previstas.
5. Medios para ejercer derechos ARCO.
6. Procedimiento y medios para comunicar cambios al aviso.

### 3.3 Implementación requerida

**Aviso de Privacidad Simplificado** — mostrar en la pantalla de registro del Hub:

```
Aviso de Privacidad

[Nombre empresa], con domicilio en [dirección], es responsable del tratamiento de sus 
datos personales. Sus datos (nombre, correo electrónico, teléfono) serán utilizados para: 
crear y gestionar su cuenta, brindar los servicios contratados, y comunicaciones 
relacionadas con el servicio. Puede consultar el Aviso de Privacidad completo en [URL]. 
Para ejercer sus derechos ARCO, escríbanos a [email].
```

**Aviso de Privacidad Completo** — página accesible desde el Hub con todos los elementos del Art. 16.

**Estado:** ⚠️ **Pendiente de implementación en Hub** — El equipo frontend debe agregar el aviso en la pantalla de registro con enlace al aviso completo.

---

## 4. Derechos ARCO

Los titulares tienen los siguientes derechos (Art. 22-37 LFPDPPP):

| Derecho | Descripción | Implementación técnica | Plazo de respuesta |
|---------|-------------|----------------------|-------------------|
| **Acceso** | Conocer qué datos se tienen y cómo se usan | `GET /account/my-data` | Inmediato (automatizado) |
| **Rectificación** | Corregir datos inexactos o incompletos | `PUT /v1/users/:id` | Inmediato (automatizado) |
| **Cancelación** | Eliminar datos que dejen de ser necesarios | `DELETE /account/my-data` | Inmediato (automatizado) |
| **Oposición** | Oponerse al tratamiento para fines específicos | Email a DPO | **20 días hábiles** |

### 4.1 Proceso de solicitud formal ARCO (para casos no cubiertos por endpoints automáticos)

1. El titular envía solicitud a [email-arco@empresa.com] con:
   - Nombre completo e identificación.
   - Descripción del derecho que desea ejercer.
   - Documentación que ampare la solicitud si aplica.
2. El DPO acusa recibo dentro de los **3 días hábiles** siguientes.
3. El DPO resuelve y notifica dentro de los **20 días hábiles** (prorrogable 20 días más con justificación).
4. Si la solicitud es procedente, se ejecuta en los **15 días hábiles** siguientes a la notificación.

---

## 5. Consentimiento

### 5.1 Tipos de consentimiento (LFPDPPP Art. 8-10)

| Tipo | Cuándo aplica | Implementación |
|------|--------------|---------------|
| **Tácito** | Datos necesarios para la relación contractual | Registro con aviso de privacidad visible y opción de salida |
| **Expreso** | Datos sensibles; transferencias a terceros | Checkbox explícito; endpoint `POST /account/accept-privacy` |
| **Expreso por escrito** | Datos financieros, de salud, biometría | Firma o confirmación documentada |

### 5.2 Datos sensibles (LFPDPPP Art. 3 fracción VI)

Requieren **consentimiento expreso**:
- Origen racial o étnico.
- Estado de salud presente y futuro.
- Información genética.
- Creencias religiosas, filosóficas o morales.
- Afiliación sindical.
- Opiniones políticas.
- Preferencia sexual.

**Si el módulo Workify registra alguno de estos datos de empleados**, se requiere consentimiento expreso firmado. Revisar con la empresa cliente.

---

## 6. Transferencias de Datos (LFPDPPP Art. 36-37)

### Transferencias nacionales
- Requieren comunicarse en el Aviso de Privacidad.
- Si el tercero receptor no asume las mismas obligaciones, debe firmarse un contrato de encargo o cesión.

### Transferencias internacionales
El sistema transfiere datos a EE.UU. (Neon, Vercel). La LFPDPPP permite transferencias internacionales si:
- El destinatario acepta adoptar las medidas de seguridad establecidas por el INAI.
- Se formaliza mediante contrato de transferencia con cláusulas de privacidad equivalentes a la LFPDPPP.

**Acciones requeridas:**
1. Incluir cláusula de transferencia internacional en el DPA con cada empresa cliente mexicana.
2. Verificar que Neon y Vercel tienen compromisos de seguridad equivalentes (revisar sus DPAs).

---

## 7. Seguridad de Datos (LFPDPPP Art. 19)

El responsable (empresa cliente) y el encargado (sistema) deben implementar medidas de seguridad administrativas, físicas y técnicas.

**Medidas técnicas implementadas:**

| Medida | Implementación |
|--------|---------------|
| Cifrado en tránsito | HTTPS/TLS en todos los endpoints |
| Cifrado en reposo (campos sensibles) | AES-256-GCM (PLAN-21) |
| Control de acceso | Autenticación JWT + RBAC + tenant isolation |
| Hashing de contraseñas | bcrypt con cost factor 10 |
| Monitoreo de acceso | Audit logs + action history |
| Headers de seguridad HTTP | HSTS, CSP, X-Frame-Options (PLAN-22) |
| Escaneo de vulnerabilidades | pnpm audit en CI (PLAN-22) |

---

## 8. Notificación de Vulneraciones (LFPDPPP Art. 20)

En caso de vulneración a la seguridad que afecte de forma significativa los derechos patrimoniales o morales de los titulares:

1. Notificar a los titulares afectados **sin dilación**.
2. Informar: naturaleza de la vulneración, datos comprometidos, acciones correctivas tomadas, medidas que el titular puede tomar.
3. Documentar el incidente en el registro interno de incidentes.

---

## 9. Checklist de Cumplimiento México

- [ ] Aviso de Privacidad Simplificado visible en la pantalla de registro del Hub
- [ ] Aviso de Privacidad Completo accesible desde URL pública
- [ ] Mecanismo de ejercicio de derechos ARCO documentado y operativo
- [ ] Email de contacto ARCO configurado y monitoreado
- [ ] DPA (contrato de encargo) firmado con cada empresa cliente mexicana
- [ ] Transferencias internacionales documentadas en el Aviso de Privacidad y en el DPA
- [ ] Si aplica: consentimiento expreso para datos sensibles de empleados
- [ ] Proceso de notificación de vulneraciones documentado (ver INCIDENT-RESPONSE.md)
- [ ] Registro de solicitudes ARCO y resoluciones mantenido por el DPO
