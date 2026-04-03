# PLAN-21 - Encriptación a Nivel de Campo (Field-Level Encryption)

## Objetivo
Hacer técnicamente verificable el claim "encriptación de nivel bancario": los datos sensibles almacenados en la DB están cifrados en reposo a nivel de aplicación, de modo que una filtración de la base de datos no exponga datos legibles.

## Aclaración de alcance
La infraestructura ya tiene TLS (HTTPS) en tránsito y Neon tiene cifrado de disco en reposo (AES-256 a nivel de provider). El gap es **cifrado a nivel de aplicación** para campos sensibles específicos — esta es la capa adicional que implementan bancos y sistemas de salud.

## Campos candidatos a cifrar

| Modelo | Campo | Justificación |
|--------|-------|---------------|
| `Employee` | `idNumber` | Documento de identidad — PII de alto riesgo |
| `Employee` | `birthDate` | Dato personal sensible |
| `User` | `email` | PII identificador único |
| Integraciones | tokens / API keys de terceros | Secretos de negocio |

## Decisión de implementación

**Cifrado simétrico AES-256-GCM a nivel de service/repositorio**, antes de escribir a Prisma y después de leer.

- Clave de cifrado derivada de `FIELD_ENCRYPTION_KEY` en variables de entorno (rotable, base64, 32 bytes).
- No se usa middleware de Prisma para evitar acoplamiento al ORM.
- Patrón de almacenamiento: `{ ciphertext, iv, tag }` serializado como string en el campo DB.
- Campos cifrados son opacos en DB; búsquedas por esos campos requieren un **hash determinístico paralelo** (HMAC-SHA256) para índices de búsqueda.

## Fases

### Fase 1 — Utilidad de cifrado
- Crear `packages/api/src/common/crypto/field-encryption.ts`:
  - `encryptField(value: string, key: Buffer): string`
  - `decryptField(ciphertext: string, key: Buffer): string`
  - `hashForSearch(value: string, key: Buffer): string` (HMAC-SHA256 para búsquedas determinísticas)
- Validar presencia de `FIELD_ENCRYPTION_KEY` en arranque del servidor (junto a `JWT_SECRET`).

### Fase 2 — Migración de campos sensibles en Employee
- Agregar campos `idNumberHash` en schema de Prisma para búsquedas por HMAC.
- Migración Prisma: nuevos campos nullable → script de migración de datos existentes.
- Actualizar service/repositorio de employees: cifrar al escribir, descifrar al leer.
- Actualizar búsquedas que filtran por `idNumber` para usar `idNumberHash`.

### Fase 3 — Cifrado de tokens de integración
- Identificar campos donde se almacenan API keys o tokens de terceros en la DB.
- Cifrar al persistir, descifrar solo al momento de uso.
- No exponer valores cifrados en responses de API.

### Fase 4 — Rotación de claves
- Documentar proceso de rotación: nueva clave → re-encrypt todos los registros → swap de clave activa.
- Crear script utilitario `scripts/rotate-field-key.ts` para ejecución controlada en producción.

### Fase 5 — Validación y documentación
- Test: dump directo de la DB no muestra valores en texto plano para campos cifrados.
- Documentar en `docs/` qué campos están cifrados, algoritmo, y proceso de rotación.

## Exit criteria
- [x] `idNumber` de empleados almacenado cifrado en DB.
- [x] `FIELD_ENCRYPTION_KEY` requerida en arranque (servidor no arranca sin ella).
- [x] Búsquedas por campos cifrados funcionan via hash determinístico.
- [x] Script de rotación de clave documentado y probado en staging.
- [x] Dump de DB no expone PII en texto plano para los campos cubiertos.
