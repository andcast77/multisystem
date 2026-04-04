# PLAN-23 - UX: Interfaz Cero Fricción

## Objetivo
Eliminar los puntos de fricción concretos identificados en el código que rompen flujos de usuario: errores silenciosos, `alert()` nativo, estados de carga en blanco, redirecciones perdidas, y dead-ends de navegación.

## Origen
Auditoría de código de abril 2026. Todos los puntos tienen referencia de archivo y línea.

---

## Fase 1 — Errores silenciosos y `alert()` (prioridad crítica)

Estos son los defectos más visibles y de mayor impacto en la percepción de calidad.

### 1a — Reemplazar `alert()` por toasts en Shopflow

`alert()` nativo bloquea el hilo, es inaccesible, y rompe la coherencia visual. Aparece en:

| Archivo | Uso |
|---------|-----|
| `apps/shopflow/src/components/features/pos/PaymentModal.tsx` | Errores de puntos, pago, usuario (líneas 65–66, 78–79, 90–91, 118–119) |
| `apps/shopflow/src/components/features/settings/TicketConfigForm.tsx` | Errores de logo y guardado (líneas 326, 352, 359, 398) |
| `apps/shopflow/src/components/features/backup/CreateBackupButton.tsx` | Errores de backup |
| `apps/shopflow/src/components/features/backup/RestoreBackupDialog.tsx` | Errores de restauración |
| `apps/shopflow/src/components/features/backup/BackupList.tsx` | Errores de lista |
| `apps/shopflow/src/lib/services/printers.ts` | Errores de impresión (línea 224) |

Reemplazar con el sistema de toast existente en el proyecto (o implementar uno unificado si no existe).

### 1b — Login Hub: fallo silencioso

`apps/hub/src/pages/LoginPage.tsx` líneas 53–55: cuando `!res.success || !res.data` la función retorna sin mostrar error al usuario. Agregar `setErrorMessage` en ese branch.

### 1c — Company change error silenciado

`apps/shopflow/src/components/layout/Sidebar.tsx` líneas 154–155: `catch { // ignore }` en `handleCompanyChange`. Reemplazar por toast de error.

### 1d — Descripción dev-facing en LoginPage Shopflow

`apps/shopflow/src/views/LoginPage.tsx` línea 26: `CardDescription` muestra `"Acceso contra /api/auth/login"`. Reemplazar por copy orientado al usuario.

---

## Fase 2 — Redirecciones y navegación perdida

### 2a — Preservar `?next=` en Hub post-login

`apps/hub/src/components/ProtectedRoute.tsx` líneas 18–19: redirige a `/login` sin `?next=<ruta>`.
`apps/hub/src/pages/LoginPage.tsx`: no lee el parámetro `next` al completar login.

Implementar el mismo patrón que tiene Shopflow: `navigate(next ?? "/dashboard")`.

### 2b — Shopflow `?next=` ignorado en LoginPage

`apps/shopflow/src/components/auth/DashboardSessionGate.tsx` línea 22 genera `?next=...`, pero `apps/shopflow/src/views/LoginPage.tsx` líneas 50–51 siempre navega a `/dashboard` ignorando ese parámetro. Leer `searchParams.get("next")` y redirigir correctamente.

---

## Fase 3 — POS: flujo de cobro sin dead-ends

### 3a — Checkout bloqueado sin explicación

`apps/shopflow/src/components/features/pos/TotalsPanel.tsx` líneas 36–37, 87–92: el botón de checkout se deshabilita cuando `total === 0` (caso de descuento 100%) sin mensaje explicativo. Agregar tooltip o mensaje inline que explique por qué está deshabilitado.

### 3b — Cierre accidental del modal de pago

`apps/shopflow/src/components/features/pos/PaymentModal.tsx` línea 126: clic en overlay cierra el modal sin distinción entre cancelar y éxito. Agregar `onInteractOutside={(e) => e.preventDefault()}` cuando hay un pago en proceso, o pedir confirmación antes de cerrar.

### 3c — Barcode scan antes de que carguen productos

`apps/shopflow/src/components/features/pos/ProductPanel.tsx` líneas 58–66: `handleBarcodeScan` solo añade al carrito si `products.length > 0`. Si el scan llega antes de que cargue la lista, solo setea el search sin feedback. Agregar indicador visual de "buscando producto..." cuando hay una búsqueda activa por código.

---

## Fase 4 — Onboarding y primera experiencia

### 4a — Wizard de configuración inicial en Hub

Hoy el flujo post-registro es: verificar email → dashboard → ir a Settings manualmente. No hay guía de primeros pasos.

Implementar un checklist de onboarding en `DashboardPage` que aparece solo cuando la empresa está recién creada:
- [x] Completar perfil de empresa (nombre fiscal, logo)
- [x] Activar módulos
- [x] Invitar al primer miembro del equipo
- [x] Configurar primer local/tienda

El checklist se oculta automáticamente cuando todos los ítems están completados. No es un wizard bloqueante — el usuario puede usignar el dashboard libremente.

### 4b — Eliminar página de registro duplicada en Hub

`apps/hub/src/app/(auth)/register/page.tsx` existe en paralelo con `apps/hub/src/pages/RegisterPage.tsx` con comportamiento divergente:
- La versión `app/` navega a dashboard sin verificación de email y silencia errores
- La versión `pages/` muestra verificación de email correctamente

Determinar cuál es la ruta activa en `App.tsx` y eliminar o redirigir la inactiva. Alinear comportamiento post-registro.

---

## Fase 5 — Navegación y mobile

### 5a — Dead-end en módulo inactivo

`apps/shopflow/src/components/layout/ShopflowModuleGuard.tsx` líneas 13–20: muestra "módulo no activo" sin ningún enlace de acción. Agregar link a Hub settings donde el Owner puede activar el módulo.

### 5b — Selectores de empresa/tienda en mobile

`packages/component-library/src/components/sidebar.tsx`: en mobile (`lg:hidden`), el sidebar es solo íconos y los selectores de empresa/tienda desaparecen. Agregar un header compacto en el rail mobile que muestre la tienda activa y permita cambiarla.

### 5c — Estado de carga en blanco (Hub register app/)

`apps/hub/src/app/(auth)/register/page.tsx` líneas 77–78: retorna `null` mientras verifica auth — pantalla en blanco. Reemplazar por spinner o skeleton consistente con el resto del sistema.

---

## Fase 6 — Breadcrumbs y contexto de navegación

`apps/shopflow/src/views/PageFrame.tsx` y páginas de Hub solo muestran título plano sin breadcrumbs. En rutas anidadas (ej. `Inventario > Producto X > Editar`) el usuario pierde contexto.

Implementar un componente `<Breadcrumb>` en el shared `component-library` y adoptarlo en:
- Shopflow: detalle de producto, detalle de venta, configuraciones anidadas
- Hub: detalle de miembro, configuración por pestaña

---

---

## Fase 7 — Centro de notificaciones in-app

Actualmente existe `notificationService.ts` en Shopflow con `getUserNotifications` y `markAsRead`, pero **no hay UI** que lo consuma. Los jobs de PLAN-20 y los eventos colaborativos de PLAN-17 necesitan un canal de entrega visible en la interfaz.

### 7a — Componente NotificationCenter (shared)
- Campana con badge de no leídas en el header de Hub y Shopflow.
- Panel desplegable: lista de notificaciones con tipo, mensaje, timestamp y estado leído/no leído.
- Marcar como leída al abrir el panel o al hacer clic en una notificación individual.
- Marcar todas como leídas en un solo click.

### 7b — API de notificaciones in-app
- Endpoint `GET /notifications` (paginado, últimas 50): ya parcialmente implementado en el service.
- Endpoint `POST /notifications/:id/read`: marcar una notificación leída.
- Endpoint `POST /notifications/read-all`: marcar todas leídas.
- Conectar a SSE (PLAN-17): cuando llega un evento de nueva notificación, el badge se actualiza sin polling.

### 7c — Tipos de notificación por fuente
| Fuente | Tipo | Ejemplo |
|--------|------|---------|
| PLAN-20 jobs | `ALERT` | "Stock bajo: Producto X tiene 2 unidades" |
| PLAN-20 jobs | `INFO` | "Reporte diario disponible para descarga" |
| PLAN-17 colaboración | `COLLAB` | "María editó la configuración de ticket" |
| PLAN-24 MFA | `SECURITY` | "Nuevo inicio de sesión desde dispositivo desconocido" |

### 7d — Preferencias de canal
- Opción en Configuración de Cuenta: elegir qué tipos de notificación llegan in-app vs. push vs. ambos.

---

## Exit criteria
- [x] Ningún `alert()` nativo en `apps/shopflow/src/**` — reemplazados por toasts.
- [x] Hub login muestra error cuando `res.success === false`.
- [x] Hub y Shopflow preservan `?next=` y redirigen correctamente post-login.
- [x] POS: botón de checkout deshabilitado muestra razón al usuario.
- [x] Modal de pago no se cierra accidentalmente durante el proceso.
- [x] Checklist de onboarding visible para empresas recién creadas en Hub.
- [x] Página de registro duplicada en Hub eliminada o unificada.
- [x] `ShopflowModuleGuard` tiene enlace accionable para activar el módulo.
- [x] Selectores de empresa/tienda accesibles en mobile.
- [x] Zero pantallas en blanco durante estados de carga.
- [x] Centro de notificaciones con campana + badge visible en Hub y Shopflow.
- [x] Notificaciones de PLAN-20, PLAN-17 y PLAN-24 entregadas in-app (canal UI + API listo; tipos `COLLAB`/`SECURITY` y mapeo por fuente; la emisión de cada evento de negocio sigue en PLAN-17/20/24 donde aplique).
- [x] Badge de no leídas se actualiza en tiempo real via SSE (PLAN-17).

---

## Nota de cierre

Plan cerrado: capacidad de **mostrar y preferir** notificaciones in-app cumplida. Los **productores** de notificaciones por dominio (jobs, colaboración, MFA) se validan en sus planes respectivos cuando generen filas con el `type`/`data` acordados.
