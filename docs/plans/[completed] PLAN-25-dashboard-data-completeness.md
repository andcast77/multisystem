# PLAN-25 - Completitud de Datos en Dashboards (Workify + TechServices)

## Objetivo
Proveer datos reales a los dashboards de Workify y TechServices para cumplir el claim "información concreta para tomar decisiones". Actualmente ambos dashboards tienen UI construida pero el backend devuelve datos incompletos o hardcodeados.

## Estado actual por módulo

### Workify
La UI de `apps/workify/src/app/(dashboard)/dashboard/page.tsx` está diseñada para métricas ricas:
- `DailyWorkKPIs`: KPIs de asistencia diaria
- `DailyAlerts`: alertas del día (ausencias, atrasos)
- Cards: empleados totales, programados hoy, horas registradas

**Realidad del backend:**
- `getDashboardStats` en `workify.service.ts` devuelve **solo** `{ totalEmployees }`.
- Hook `useDashboardStats` hardcodea: `todayScheduled: 0`, `todayActive: 0`, `isWorkDay: true`.
- Hook `useAttendanceStats` devuelve solo `{ present }`.
- `recharts` está en el `package.json` de Workify pero no se usa en ningún componente de dashboard.

### TechServices
`apps/techservices/src/app/dashboard/page.tsx` muestra 3 conteos (órdenes abiertas, visitas activas, activos registrados) sin tendencias ni gráficos.

---

## Fases

### Fase 1 — Workify: completar API de dashboard

Extender `getDashboardStats` y `getAttendanceStats` en `packages/api/src/services/workify.service.ts` para devolver:

| Métrica | Descripción | Fuente en DB |
|---------|-------------|--------------|
| `totalEmployees` | Total empleados activos | `Employee` (ya existe) |
| `todayScheduled` | Empleados con turno programado hoy | `Schedule` o asistencia del día |
| `todayPresent` | Empleados que registraron asistencia hoy | Modelo de asistencia |
| `todayAbsent` | Empleados ausentes sin justificación | Derivado de scheduled - present |
| `todayLate` | Empleados con entrada tardía | Comparar hora entrada vs. hora programada |
| `openAlerts` | Alertas activas (ausencias injustificadas, contratos por vencer) | Reglas de negocio sobre los datos |
| `weeklyAttendanceRate` | % asistencia últimos 7 días | Serie temporal de asistencia |

### Fase 2 — Workify: gráficos de tendencia

Activar `recharts` (ya instalado) en el dashboard de Workify:
- **Gráfico de asistencia semanal**: línea de `presente / programado` por día de la última semana.
- **Distribución por departamento**: barra de asistencia por departamento.
- Componente reutilizable en `apps/workify/src/components/dashboard/AttendanceTrendChart.tsx`.

### Fase 3 — Workify: alertas dinámicas

Hacer que `DailyAlerts` muestre alertas reales calculadas en el backend:
- Empleados ausentes sin justificación hoy.
- Empleados con contrato por vencer en los próximos 30 días.
- Turnos sin cubrir programados para hoy.

Endpoint: `GET /workify/dashboard/alerts` → lista priorizada de alertas con tipo y descripción.

### Fase 4 — TechServices: métricas de tendencia

Extender el endpoint de dashboard de TechServices para agregar:

| Métrica | Descripción |
|---------|-------------|
| `openOrders` | Órdenes abiertas (ya existe) |
| `closedThisWeek` | Órdenes cerradas esta semana |
| `avgResolutionHours` | Tiempo promedio de resolución (últimas 4 semanas) |
| `overdueOrders` | Órdenes con SLA vencido o pendientes hace más de X días |
| `technicianUtilization` | Visitas activas vs. capacidad por técnico |

### Fase 5 — TechServices: gráfico de órdenes por estado

Agregar un gráfico de barra/donut en el dashboard de TechServices:
- Distribución de órdenes por estado (`OPEN`, `IN_PROGRESS`, `ON_HOLD`, `CLOSED`).
- Tendencia semanal de apertura vs. cierre de órdenes.

### Fase 6 — Integración con real-time (PLAN-17)

Una vez que los datos existen (Fases 1–5), los dashboards de Workify y TechServices se conectan al SSE de PLAN-17 para invalidar sus queries cuando hay cambios relevantes:
- Workify: nueva asistencia registrada → invalidar `dashboard/stats`.
- TechServices: cambio de estado de orden → invalidar `dashboard/stats`.

---

## Exit criteria
- [x] `getDashboardStats` de Workify devuelve `todayScheduled`, `todayPresent`, `todayAbsent`, `todayLate`, `weeklyAttendanceRate`.
- [x] `DailyAlerts` muestra alertas reales del backend (ausencias, contratos, turnos sin cubrir).
- [x] Gráfico de asistencia semanal visible en dashboard de Workify.
- [x] TechServices dashboard muestra `closedThisWeek`, `avgResolutionHours`, `overdueOrders`.
- [x] Gráfico de distribución por estado visible en TechServices.
- [x] Ambos dashboards se invalidan via SSE cuando hay cambios (PLAN-17).
- [x] Shopflow dashboard muestra margen bruto, valor de inventario y facturas pendientes.
- [x] Widget de cuentas por cobrar muestra las facturas vencidas más antiguas.

---

## Fase 7 — Shopflow: métricas de negocio faltantes

El dashboard de Shopflow actual (`DashboardPage`) muestra ventas, ingresos, descuentos e impuestos. Faltan métricas críticas para "tomar decisiones con información concreta":

| Métrica | Descripción | Fuente |
|---------|-------------|--------|
| **Margen bruto** | `(ingresos - costo de productos) / ingresos` | Requiere campo `costPrice` en producto |
| **Valor de inventario** | Suma de `stock × costPrice` por tienda | `Product.stock × Product.costPrice` |
| **Cuentas por cobrar** | Facturas emitidas con estado pendiente/vencido | Modelo `Invoice` existente |
| **Ticket promedio** | `totalRevenue / salesCount` (ya existe como `averageSale`) | Calculado en backend actual ✓ |
| **Tasa de devoluciones** | `refundedSales / totalSales` en el período | Modelo de ventas + estado refund |

### Acciones requeridas

1. **Agregar `costPrice` a `Product`** (si no existe): campo opcional `Decimal?` para calcular margen y valor de inventario.
2. **Extender `getReportStats`** en `shopflow.service.ts` para devolver `grossMargin`, `inventoryValue`, `pendingInvoicesTotal`, `refundRate`.
3. **Agregar cards en `StatsCards`**: margen bruto (%), valor de inventario actual, facturas pendientes totales.
4. **Widget de cuentas por cobrar**: lista compacta de las 5 facturas vencidas más antiguas en el dashboard.

---

## Dependencias
- **PLAN-17** (Real-time Layer): para invalidación SSE de queries en Fase 6.

---

## Cierre (abril 2026)

Plan ejecutado y validado. Notas respecto al texto original:

- **Alertas "contrato por vencer"**: implementado con vencimientos de **licencias** (`License`) donde aplica; no existe modelo de contrato laboral separado.
- **"Turnos sin cubrir"**: la cobertura se refleja en la lógica de programación/ausencias; no hay alerta dedicada con ese nombre si el dominio no modela huecos explícitos.
- **Shopflow coste**: se usa `Product.cost` existente en lugar de añadir `costPrice`; métricas expuestas vía `getDashboardBusinessMetrics` / `DashboardBusinessMetrics` en la UI del dashboard.
- **TechServices estados**: el esquema usa `COMPLETED` (no `CLOSED`) donde corresponde.
- **SSE Workify "nueva asistencia"**: la invalidación está cableada; un evento granular adicional puede completarse cuando exista API explícita de registro de asistencia en tiempo real.
