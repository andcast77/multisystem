# Prompt para Google Stitch — Landing del Hub (Multisystem)

Documento de referencia en el repo para copiar y pegar en [Google Stitch](https://stitch.withgoogle.com/) (o la URL actual de la herramienta). No sustituye al código del landing en `apps/hub`; sirve para generar mockups o explorar variantes de diseño.

## Uso en Google Stitch

1. Abre Google Stitch y crea un diseño nuevo.
2. Pega el bloque **Prompt (copiar y pegar)** de abajo en el campo de prompt del proyecto.
3. Si la herramienta permite **ratio o tamaño de lienzo**, genera primero una variante **desktop** (p. ej. ancho 1440px) y, en un segundo proyecto o iteración, una **móvil** (p. ej. 390px de ancho), repitiendo el mismo prompt o añadiendo al final: *“Layout optimizado para móvil, una columna, navegación compacta.”*
4. Revisa claims numéricos (500+, 50k, 99.9%, “más de 500 empresas”) frente a tu política de marketing real; la sección [Ajustes opcionales](#ajustes-opcionales) indica cómo sustituirlos.

---

## Contexto de producto

- **Multisystem Hub**: portal multi-empresa; login/registro, dashboard con empresa activa, módulos contratados y enlaces a apps satélite (`apps/hub`).
- **Módulos**: ShopFlow POS (inventario, caja, reportes); Workify (RRHH, turnos, asistencia, nómina); Tech Services (órdenes, activos, visitas); Hub Central (administración, empresas, configuración).
- **Pilares**: velocidad operativa; colaboración y roles; datos en tiempo real; seguridad empresarial.

---

## Prompt (copiar y pegar en Google Stitch)

**Diseña una landing page completa (una sola pantalla, scroll vertical) para escritorio y móvil para “Multisystem Hub”, producto B2B SaaS en español.**

**Marca y tono:** profesional, moderno, confiable; sin sensacionalismo infantil. Nombre visible: **Multisystem**.

**Estilo visual:** tema oscuro tipo “enterprise SaaS”: fondo casi negro (`#0a0a0f` o similar), acentos **índigo y violeta** con degradados suaves en titulares; tarjetas con borde sutil, fondo semitransparente y ligero **glass/blur**; rejilla o glow difuminado en el hero (ambiente tech, no caricatura). Tipografía bold en H1/H2, mucho contraste y aire en blanco.

**Estructura de la página (de arriba abajo):**

1. **Barra superior fija (sticky):** logo texto “Multisystem”; enlaces ancla “Módulos” y “Características”; a la derecha botones “Iniciar sesión” (secundario) y “Registrar empresa” (primario índigo).

2. **Hero a pantalla completa:** badge pequeño “Plataforma empresarial integrada” con icono de rayo. **H1:** “Gestiona tu negocio” + palabra destacada en gradiente “sin límites”. **Subtítulo:** “Multisystem centraliza tu punto de venta, recursos humanos y servicios técnicos en una sola plataforma. Decisiones más rápidas, operaciones más simples.” **CTAs:** primario “Registrar empresa”, secundario outline “Iniciar sesión”. Debajo, **franja de métricas** en tres columnas: “500+ Empresas activas”, “50k+ Usuarios”, “99.9% Uptime garantizado”.

3. **Sección “Módulos integrados”:** etiqueta pequeña “PLATAFORMA MODULAR”; **H2** “Módulos integrados”; subtítulo “Una plataforma, múltiples soluciones para tu negocio”. **Grid de 4 tarjetas** (2x2 en tablet, 1 columna en móvil), cada una con icono, título, descripción corta, 3 bullets y enlace tipo “Acceder →”:
   - **ShopFlow POS** — POS, inventario, caja y reportes en tiempo real. Bullets: gestión de productos, punto de venta rápido, reportes de ventas. Acento violeta.
   - **Workify** — RRHH, turnos, asistencia y nómina. Bullets: gestión de turnos, control de asistencia, nómina integrada. Acento azul cielo.
   - **Tech Services** — órdenes de servicio, activos y visitas de campo. Bullets: órdenes de trabajo, gestión de activos, visitas técnicas. Acento ámbar.
   - **Hub Central** — panel de administración, empresas y configuración. Bullets: gestión de empresas, panel de control, configuración global. Acento gris/neutro.

4. **Sección “Por qué Multisystem”:** etiqueta “POR QUÉ MULTISYSTEM”; **H2** “Todo lo que necesitas”; subtítulo “Características diseñadas para impulsar el crecimiento de tu negocio”. **Grid de 4 beneficios** con icono cada uno:
   - Velocidad operativa — automatización, interfaz sin fricción.
   - Colaboración total — equipos en tiempo real, roles y permisos por módulo.
   - Datos en tiempo real — dashboards y métricas al instante.
   - Seguridad empresarial — cifrado y estándares de seguridad (tono serio, sin jerga legal larga).

5. **Banda CTA final:** **H2** “Lleva tu negocio al siguiente nivel” con “siguiente nivel” en gradiente; texto “Únete a más de 500 empresas que ya gestionan sus operaciones con Multisystem.” Botón grande “Registrar empresa gratis →”.

6. **Footer:** columna marca + texto “Plataforma empresarial unificada. POS, RRHH y servicios técnicos en un solo lugar.”; columnas enlaces “Módulos” (ShopFlow, Workify, Servicios Técnicos) y “Cuenta” (Iniciar sesión, Registrar empresa); barra inferior © año, Términos, Privacidad.

**Restricciones de diseño para Stitch:** interfaz limpia, jerarquía clara, accesible (contraste alto sobre fondo oscuro), sin stock photos genéricas de personas a menos que sean muy sutiles; preferir ilustraciones abstractas, diagramas o mockups de UI si hace falta decoración.

---

## Ajustes opcionales

### Paleta (alinear con el Hub en código)

| Uso | Hex (aprox.) |
|-----|----------------|
| Fondo principal | `#0a0a0f` |
| Índigo (CTA, acentos) | `#6366f1` |
| Violeta (gradientes en titulares) | `#818cf8` → `#a78bfa` → `#6366f1` |

Puedes añadir al final del prompt: *“Paleta: índigo `#6366f1`, violeta `#a78bfa`, fondo `#0a0a0f`.”*

### Métricas y claims

Los números del hero (500+ empresas, 50k+ usuarios, 99.9% uptime) y el texto “más de 500 empresas” en la banda CTA son **placeholders de marketing** alineados al copy actual del frontend; **sustitúyelos** por cifras auditables o elimínalos si no están respaldados.

Alternativas en el prompt:

- **Sin métricas:** sustituye la franja de tres columnas del hero por una fila de **logos de clientes** (siluetas o “Empresa A–E”) o por una sola línea de prueba social genérica (“Confiado por equipos operativos”).
- **CTA sin número:** cambia “Únete a más de 500 empresas…” por “Únete a equipos que ya gestionan sus operaciones con Multisystem.”

### Variantes desktop / móvil

- **Desktop:** añade al prompt: *“Viewport ancho 1440px, márgenes generosos, grid de 4 columnas donde aplique.”*
- **Móvil:** *“Viewport 390px de ancho, una columna, tipografía escalada, menú hamburguesa o CTA sticky si encaja.”*
