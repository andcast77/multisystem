# @multisystem/ui

Biblioteca de componentes React compartida para las apps Multisystem. **Carpeta del repo:** `packages/component-library`. **Nombre npm:** `@multisystem/ui`.

## En este monorepo

Las apps **hub**, **shopflow**, **workify** y **techservices** declaran `"@multisystem/ui": "workspace:*"`. Tras clonar, `pnpm install` en la raíz enlaza el paquete local.

El script raíz `pnpm run dev:hub` ejecuta antes `pnpm --filter @multisystem/ui build` para asegurar `dist/` actualizado.

### Consumo externo (opcional)

Fuera del monorepo se puede instalar desde releases GitHub (p. ej. `github:…/multisystem-components#v1.x`) o `file:../component-library`, según cómo publiques el paquete.

## Uso

```tsx
import { Button, Card, Input, Badge } from "@multisystem/ui";
import "@multisystem/ui/styles"; // o `@multisystem/ui/index.css` (export del paquete)

export function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button>Submit</Button>
      <Badge>New</Badge>
    </Card>
  );
}
```

En **Next.js**, suele hacer falta `transpilePackages: ["@multisystem/ui"]` en `next.config`. Las apps que usan **Tailwind** pueden incluir `./node_modules/@multisystem/ui/dist/**/*.{js,ts,jsx,tsx}` en `content` si mezclas utilidades con la UI.

## Componentes

Primitivas **Radix UI**; estilos con **SCSS** (clases tipo `ui-btn`, `ui-card`, …) compilados a un CSS único en `dist/`. Patrón cercano a shadcn (composición, `cn()` con **clsx**).

| Área | Componentes |
|------|----------------|
| Feedback | Alert, Alert Dialog, Progress, Skeleton |
| Formulario | Button, Checkbox, Input, **InputField**, Label, Select, Switch, Textarea |
| Layout / navegación | Card, Dialog, Dropdown Menu, Scroll Area, **Sidebar** (nav + tipos `NavGroup`, `SidebarUser`), Separator, Tabs |
| Datos | Badge, Table |

También se exporta **`cn`** desde `lib/utils`.

## Temas

Variables CSS y partials SCSS en `src/styles/` (`_variables.scss`, `_theme.scss`, `components/_*.scss`). Importar una vez los estilos del paquete en el entry de la app (ver arriba).

## Estructura del paquete

```
packages/component-library/
├── src/
│   ├── components/     # *.tsx
│   ├── styles/         # main.scss → bundle CSS
│   ├── lib/utils.ts
│   └── index.ts        # reexports
├── vite.config.ts      # build ES + CSS
├── tsconfig.build.json
└── package.json
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm build` | `tsc` + Vite (JS + CSS en `dist/`) |
| `pnpm dev` | Vite build en modo watch |
| `prepublishOnly` | Ejecuta `build` antes de publicar |

**Peer:** `react` y `react-dom` ≥ 19.2.4.
