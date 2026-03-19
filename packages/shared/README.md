# @multisystem/shared

Utilidades **frontend** compartidas entre **hub**, **shopflow**, **workify** y **techservices**: cookie de sesión JWT y cliente HTTP (`fetch`) con el mismo contrato en todas las apps.

No publica `dist`: el paquete exporta **fuentes TypeScript** (`main` / `exports` → `src/*.ts`). Las apps deben resolver TS vía el bundler (p. ej. `transpilePackages` en Next.js).

## Exports

| Ruta | Contenido |
|------|-----------|
| `@multisystem/shared` | Reexporta auth + api-client |
| `@multisystem/shared/auth` | `getTokenFromCookie`, `setTokenCookie`, `clearTokenCookie` — cookie `token`, `SameSite=Strict`, `Secure` en HTTPS |
| `@multisystem/shared/api-client` | `ApiClient`, `ApiError`, `getAuthHeaders`, `createPrefixedApi`, tipos `ApiResponse`, `PaginatedResponse` |

## Uso rápido

```ts
import { ApiClient, createPrefixedApi } from '@multisystem/shared'
import { setTokenCookie } from '@multisystem/shared/auth'

const client = new ApiClient(process.env.NEXT_PUBLIC_API_URL!)
const shopflow = createPrefixedApi(client, '/api/shopflow')
```

`ApiClient` añade `Authorization: Bearer <token>` leyendo la cookie si no se pasa cabecera explícita.

## Nota respecto a `@multisystem/contracts`

Los tipos de respuesta API en backend/contratos viven en **`@multisystem/contracts`**. Aquí `ApiResponse` / `PaginatedResponse` son interfaces ligeras del cliente; alinear payloads con la API real.
