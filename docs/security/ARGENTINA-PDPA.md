# Cumplimiento — Argentina: Ley 25.326 (PDPA) + Decreto 1558/01

**Versión:** 1.0 — Abril 2026  
**Responsable:** DPO / CTO  
**Referencia legal:** Ley 25.326 de Protección de Datos Personales, Decreto 1558/01, Disposiciones DNPDP

---

## 1. Marco Regulatorio Aplicable

La **Ley 25.326** (Protección de Datos Personales) es la ley federal argentina que regula el tratamiento de datos personales. Aplica cuando:
- El sistema recopila datos de personas físicas ubicadas en Argentina, **o**
- La empresa cliente opera en Argentina.

El organismo regulador es la **DNPDP** (Dirección Nacional de Protección de Datos Personales), dependiente del Ministerio de Justicia.

---

## 2. Roles: Responsable vs. Encargado del Tratamiento

En el modelo SaaS del sistema:

| Rol | Entidad | Obligaciones principales |
|-----|---------|------------------------|
| **Responsable del fichero/tratamiento** | Empresa cliente (la que usa el sistema para gestionar sus empleados, ventas, clientes) | Registrar bases de datos ante DNPDP, garantizar derechos ARCO, definir finalidad del tratamiento |
| **Encargado del tratamiento (procesador)** | Proveedor del sistema (desarrollador/SaaS) | Tratar datos solo según instrucciones del responsable, garantizar seguridad técnica, no subcontratar sin autorización |

**Acción requerida:** El contrato con cada empresa cliente debe incluir un **Contrato de Procesamiento de Datos (DPA)** que formalice esta relación. Ver sección 5.

---

## 3. Obligaciones Técnicas Implementadas

| Obligación legal | Implementación en el sistema |
|-----------------|------------------------------|
| Consentimiento informado | Campo `privacyAcceptedAt` en `User` + endpoint `POST /account/accept-privacy` |
| Derecho de acceso (Art. 14) | `GET /account/my-data` — exportación de todos los datos personales |
| Derecho de rectificación (Art. 16) | `PUT /v1/users/:id` con autenticación |
| Derecho de supresión/cancelación (Art. 17) | `DELETE /account/my-data` — anonimización inmediata |
| Seguridad de los datos (Art. 9) | Cifrado de campos sensibles (PLAN-21), HTTPS/TLS, bcrypt para contraseñas |
| Confidencialidad (Art. 10) | Acceso restringido por roles, tenant isolation, no exposición de datos a terceros sin DPA |
| Limitación de finalidad | Datos usados solo para los fines declarados en la política de privacidad |

---

## 4. Registro de Bases de Datos ante la DNPDP

### ¿Qué registrar?

La Ley 25.326 (Art. 21) exige que las bases de datos con datos personales sean registradas ante la DNPDP.

**Bases de datos a registrar (como encargado o responsable):**

| Base de datos | Responsable del registro | Datos personales incluidos |
|---------------|-------------------------|---------------------------|
| Usuarios de la plataforma | Proveedor SaaS (si aplica) o empresa cliente | Email, nombre, teléfono |
| Empleados (Workify) | Empresa cliente | Nombre, DNI, datos laborales |
| Clientes de ventas (Shopflow) | Empresa cliente | Nombre, email, teléfono |

### Proceso de registro
1. Acceder al [Sistema de Gestión de Bases de Datos de la DNPDP](https://www.argentina.gob.ar/aaip/datospersonales).
2. Crear cuenta o usar cuenta existente.
3. Registrar cada base de datos declarando: nombre, finalidad, categorías de datos, destinatarios, transferencias internacionales, medidas de seguridad.
4. Renovar el registro anualmente.

**Estado:** ⚠️ **Pendiente de acción** — El equipo legal / DPO debe coordinar el registro con cada empresa cliente que opera en Argentina.

---

## 5. Transferencias Internacionales de Datos

### Situación actual

El sistema utiliza **Neon (PostgreSQL)** en región `us-east-1` (AWS, EE.UU.). Los datos de usuarios argentinos se transfieren fuera de Argentina.

### Requisito legal (Art. 12, Ley 25.326)

Las transferencias internacionales están permitidas solo a países con "nivel adecuado de protección" o con garantías contractuales equivalentes.

### Acciones requeridas

1. **Verificar con Neon:** Si Neon ofrece Standard Contractual Clauses (SCCs) o garantías equivalentes para transferencias desde Argentina.
   - Contacto: [Neon Legal/Compliance](https://neon.tech/docs/introduction/privacy-policy)
2. **Considerar región alternativa:** Si la empresa cliente requiere datos en Argentina, evaluar si Neon ofrece región en Latinoamérica o si se debe considerar otro proveedor.
3. **Incluir en el DPA:** La cláusula de transferencia internacional y las garantías aplicadas.

---

## 6. Plantilla de DPA (Data Processing Agreement)

El siguiente es un esquema base del DPA que debe firmarse con cada empresa cliente argentina:

---

**CONTRATO DE PROCESAMIENTO DE DATOS PERSONALES**

Entre:
- **Responsable del Tratamiento:** [Nombre empresa cliente], CUIT [CUIT], con domicilio en [dirección] ("el Responsable")
- **Encargado del Tratamiento:** [Nombre empresa proveedora del sistema], CUIT [CUIT], con domicilio en [dirección] ("el Encargado")

**Cláusulas:**

1. **Objeto:** El Encargado tratará datos personales en nombre del Responsable para prestar los servicios de software (Workify / Shopflow / Techservices) según lo acordado en el contrato de servicio.

2. **Instrucciones del Responsable:** El Encargado tratará los datos únicamente conforme a las instrucciones documentadas del Responsable y no los utilizará para fines propios.

3. **Seguridad:** El Encargado implementará medidas técnicas y organizativas apropiadas para garantizar la seguridad de los datos, incluyendo: cifrado en tránsito (HTTPS/TLS), cifrado de campos sensibles en reposo (AES-256-GCM), control de acceso por roles.

4. **Subencargados:** El Encargado utiliza los siguientes subencargados para prestar el servicio: Neon Inc. (almacenamiento de base de datos), Vercel Inc. (infraestructura de hosting). Cualquier nuevo subencargado será notificado al Responsable con [X] días de anticipación.

5. **Derechos de los titulares:** El Encargado asistirá al Responsable en atender solicitudes de derechos ARCO dentro de los plazos legales. Se proporcionan endpoints técnicos para exportación y eliminación de datos.

6. **Transferencias internacionales:** Los datos pueden ser transferidos a EE.UU. (Neon/Vercel). Esta transferencia se realiza bajo [SCCs / Binding Corporate Rules / adequacy decision — completar según aplique].

7. **Notificación de incidentes:** El Encargado notificará al Responsable dentro de las [48] horas de conocer cualquier brecha de seguridad que afecte los datos del Responsable.

8. **Devolución/eliminación de datos:** Al terminar la relación contractual, el Encargado entregará al Responsable una copia de sus datos y los eliminará de sus sistemas dentro de los [30] días.

9. **Duración:** Este contrato tiene la misma duración que el contrato de servicio principal.

**Firma:** [Firmas de ambas partes con fecha]

---

## 7. Checklist de Cumplimiento Argentina

- [ ] DPA firmado con cada empresa cliente que opera en Argentina
- [ ] Bases de datos registradas ante DNPDP (por empresa cliente o proveedor según rol)
- [ ] Aviso de privacidad visible en el registro de Hub con referencia a Ley 25.326
- [ ] Mecanismo de ejercicio de derechos ARCO disponible (documentado y funcional)
- [ ] Transferencias internacionales documentadas y con garantías contractuales
- [ ] Registro de incidentes con notificación en plazo a DNPDP (si corresponde)
- [ ] Renovación anual del registro ante DNPDP agendada
