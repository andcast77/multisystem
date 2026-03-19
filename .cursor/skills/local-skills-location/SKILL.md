---
name: local-skills-location
description: >-
  Defines where project-local Cursor Agent Skills live in this monorepo. Use when
  creating, editing, or locating skills for multisystem, or when the user asks
  where to save a local skill.
---

# Skills locales (multisystem)

## Dónde guardarlas en este repo

| Qué | Ruta |
|-----|------|
| **Carpeta base** | `.cursor/skills/<nombre-skill>/` (raíz del repo) |
| **Archivo obligatorio** | `SKILL.md` dentro de esa carpeta |

Ejemplo:

```
.cursor/skills/revision-api/
  SKILL.md
```

## Personal vs local

| Alcance | Ruta típica (Windows) |
|---------|------------------------|
| **Local (solo este proyecto)** | `D:\Projects\multisystem\.cursor\skills\<nombre>\` |
| **Personal (todos tus proyectos)** | `%USERPROFILE%\.cursor\skills\<nombre>\` |

Usa **local** cuando la skill sea convenciones, flujos o contexto **de este repositorio**. Usa **personal** para hábitos que quieras en cualquier proyecto.

## No escribir aquí

- **`%USERPROFILE%\.cursor\skills-cursor\`** — skills internas de Cursor; no crear ni editar skills ahí.

## Estructura opcional

```
nombre-skill/
├── SKILL.md          # requerido (frontmatter name + description)
├── reference.md      # opcional
└── scripts/          # opcional
```

Al crear una skill nueva en este repo, crear la carpeta bajo `.cursor/skills/` y el `SKILL.md` con `name` (minúsculas, guiones) y `description` clara (qué hace y cuándo usarla).
