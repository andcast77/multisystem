# Planes de Implementación - Hub como Proxy Reverso

Esta carpeta contiene los planes detallados para implementar el sistema de proxy reverso en el hub, permitiendo integrar los monorepos (ShopFlow y Workify) de manera unificada.

## Planes Disponibles

### 0. [Organizar Proyecto Multisystem](./organizar-proyecto-multisystem.md)
**Objetivo**: Aislar el build del hub excluyendo services/ y modules/, asegurando que cada componente sea independiente y se comunique solo por HTTP.

- Excluir submodules del build del hub
- Verificar independencia entre subproyectos
- Asegurar comunicación solo por HTTP
- Eliminar dependencias directas entre componentes

### 1. [Proxy Reverse en Desarrollo](./proxy-reverse-desarrollo.md)
**Objetivo**: Configurar el hub para funcionar como proxy reverso en desarrollo usando Next.js rewrites.

- Configuración de rewrites en `next.config.js`
- Variables de entorno para desarrollo
- Alternativas con middleware de Next.js
- Limitaciones y consideraciones

### 2. [Configuración de Módulos y Variables de Entorno](./configuracion-modulos-hub.md)
**Objetivo**: Crear sistema centralizado de configuración de módulos para el hub.

- Sistema de registro de módulos
- Configuración centralizada (`config.ts`, `registry.ts`)
- Variables de entorno y templates
- Hooks para detección de módulos activos
- Extensibilidad para nuevos módulos

### 3. [Sistema de Routing y Detección de Módulos](./routing-sistema-hub.md)
**Objetivo**: Implementar sistema de routing unificado con detección de módulos activos.

- HubLayout con sidebar y header
- Navegación entre módulos
- Detección de módulo activo
- Componentes de UI (HubSidebar, HubHeader)
- Hooks para routing

## Orden de Implementación Recomendado

1. **Organizar Proyecto Multisystem** (Plan 0) - **PRIORITARIO**: Aislar builds y asegurar independencia de componentes
2. **Configuración de Módulos** (Plan 2) - Base para todo el sistema
3. **Proxy Reverse en Desarrollo** (Plan 1) - Para desarrollo local
4. **Sistema de Routing** (Plan 3) - UI y navegación

## Arquitectura General

```
┌─────────────────────────────────────────────────┐
│              Usuario Final                      │
└───────────────────┬─────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
   Desarrollo              Producción
        │                       │
   Next.js Rewrites      Vercel Rewrites
        │                       │
┌───────┴────────┐    ┌─────────┴────────┐
│  Hub Frontend  │    │  Hub Frontend    │
│  (puerto 3005) │    │  (puerto 3005)   │
└───────┬────────┘    └─────────┬────────┘
        │                       │
        ├───────────┬───────────┤
        │           │           │
┌───────┴───┐  ┌────┴────┐  ┌──┴──────┐
│ ShopFlow  │  │ Workify │  │   API   │
│ Frontend  │  │Frontend │  │Backend  │
│  (3003)   │  │  (3004) │  │  (3000) │
└───────────┘  └─────────┘  └─────────┘
```

## Documentación Relacionada

- [Arquitectura Multi-Módulo](./arquitectura-multi-modulo.md) - Visión general de la arquitectura
- [Plan Unificar Base de Datos](../plan-unificar-base-datos.md) - Integración de base de datos
