# Prueba Técnica — Maquetador Web · Estrategia Segura S.A.S

## Tecnologías utilizadas

| Tecnología | Versión | Rol |
|---|---|---|
| HTML5 semántico | — | Estructura de todas las vistas |
| CSS3 (variables, flexbox, grid) | — | Estilos propios modulares |
| Bootstrap 5 | 5.3.3 (CDN) | Grid, componentes, utilidades responsive |
| Bootstrap Icons | 1.11.3 (CDN) | Iconografía |
| jQuery | 3.7.1 (CDN) | DOM, eventos, AJAX, validaciones |
| JavaScript ES6+ | — | Lógica de negocio modular |

---

## Estructura del proyecto

```
Prueba_tecnica/
├── index.html                    ← Login / Registro (punto de entrada)
├── pages/
│   ├── bandeja-casos.html        ← Bandeja de casos con tabla, filtros y métricas
│   ├── detalle-caso.html         ← Detalle completo del caso con tabs y acciones
│   └── formulario-fpqrs.html     ← Formulario de radicación FPQRS
├── assets/
│   ├── css/
│   │   ├── main.css              ← Variables :root, reset, layout base (app-shell)
│   │   └── components.css        ← Sidebar, navbar, cards, tabla, badges, timeline
│   ├── js/
│   │   ├── main.js               ← Utilidades compartidas (loadJSON, sesión, badges, navbar/sidebar)
│   │   ├── auth.js               ← Login/registro, validación jQuery, sessionStorage
│   │   ├── casos.js              ← Carga JSON, filtros, búsqueda, paginación, exportar CSV
│   │   ├── detalle.js            ← Renderizado de caso, acciones con modales, localStorage
│   │   └── formulario.js         ← Dropdowns en cascada, drag-and-drop, radicación
│   └── img/
│       ├── logo.svg              ← Logo CoopFinanzas (SVG inline)
│       └── favicon.svg           ← Favicon SVG
├── data/
│   ├── casos.json                ← 15 casos de muestra (todos los tipos y estados)
│   └── usuarios.json             ← 3 usuarios demo (Admin, Operador, Supervisor)
└── README.md
```

---

## Instrucciones para ejecutar la solución

> **Requisito:** El proyecto debe servirse desde un servidor local porque jQuery `$.getJSON()` requiere el protocolo HTTP. No funciona si abres los HTML directamente desde el sistema de archivos (`file://`).

### Opción A — VS Code Live Server (recomendado)
1. Instala la extensión **Live Server** en VS Code
2. Abre la carpeta `Prueba_tecnica/` en VS Code
3. Clic derecho en `index.html` → **"Open with Live Server"**
4. Se abre automáticamente en `http://127.0.0.1:5500/`

### Opción B — Python (sin dependencias)
```bash
# Python 3
cd Prueba_tecnica
python -m http.server 8080
# Abrir: http://localhost:8080
```

### Opción C — Node.js (npx)
```bash
cd Prueba_tecnica
npx serve .
# Abrir la URL que indique la consola
```

---

## Vistas implementadas

### 1. `index.html` — Login / Registro
- **Login:** email + contraseña, checkbox "Recordar sesión", enlace "¿Olvidó contraseña?"
- **Registro:** nombre, email, contraseña, confirmación, consentimiento de datos
- Toggle animado entre ambos formularios sin recargar
- Validación en tiempo real campo por campo con Bootstrap Validation + jQuery
- Carga credenciales desde `data/usuarios.json` vía `$.getJSON()`
- 3 botones de acceso demo (Admin, Operador, Supervisor)
- Al autenticarse → redirige a `pages/bandeja-casos.html` (sesión en `sessionStorage`)
- Si ya hay sesión activa → redirige automáticamente a la bandeja

### 2. `pages/bandeja-casos.html` — Bandeja de casos
- **Cards métricas:** casos activos, SLA vencido, próximos a vencer, cerrados hoy (calculados dinámicamente)
- **Tabla responsive:** 13 columnas con badges de estado, tipo, prioridad y semáforo visual
- **Búsqueda en tiempo real** con debounce 300ms
- **Filtros** por estado, tipo y prioridad con limpieza en un clic
- **Ordenamiento** por columna (ascendente/descendente) con indicador visual
- **Paginación** con 10/25/50 filas, navegación por páginas con ellipsis
- **Exportar CSV** con los casos filtrados activos
- Click en fila → navega a `detalle-caso.html?id=FPQRS-XXXX`

### 3. `pages/detalle-caso.html` — Detalle del caso
- Lee `?id=` de la URL, busca en JSON + overrides de `localStorage`
- **Status strip** con ID, asunto y todos los badges
- **Paneles:** Información del Asociado + Detalles del Caso (grid responsivo)
- **Tabs Bootstrap:** Descripción, Comentarios, Adjuntos, Historial, Respuestas
- **Acciones** con modales:
  - Cambiar estado → actualiza badge en pantalla + historial
  - Cambiar prioridad → actualiza badge en pantalla + historial
  - Reasignar → actualiza panel de detalles + historial
  - Registrar observación → aparece en pestaña Comentarios + historial
  - Cerrar caso → requiere observación obligatoria
- Todos los cambios se persisten en `localStorage` y se reflejan en la bandeja
- Botón de impresión del caso

### 4. `pages/formulario-fpqrs.html` — Formulario FPQRS
- **Sección datos personales:** tipo ID, número, nombre, email, teléfono, dirección
- **Sección datos del caso:** tipo, servicio, categoría, subcategoría (en cascada), descripción
- **Dropdowns en cascada** completamente poblados (5 tipos × múltiples servicios/categorías)
- **Campos dinámicos** según tipo: campo "urgencia" para Queja/Reclamo, "área sugerida" para Sugerencia
- **Contador de caracteres** en descripción
- **Drag-and-drop simulado:** validación de tipo y tamaño, lista visual de archivos, eliminación individual
- **Consentimiento de datos** obligatorio (Ley 1581/2012)
- Al radicar: genera ID aleatorio, guarda en `localStorage`, muestra modal con número de radicado
- El nuevo caso aparece en la bandeja al volver

---

## Decisiones técnicas relevantes

### Inyección de navbar y sidebar
Los componentes compartidos (navbar y sidebar) se renderizan via template literals en `main.js` (`renderNavbar()` / `renderSidebar()`). Esto evita duplicación de HTML y permite resaltar el ítem activo del menú según `window.location.pathname`.

### Persistencia sin backend
- `sessionStorage`: sesión del usuario autenticado
- `localStorage["gestor_fpqrs_casos_override"]`: modificaciones a casos existentes (estado, prioridad, comentarios)
- `localStorage["gestor_fpqrs_casos_nuevos"]`: casos radicados desde el formulario
- Función `mergeCasos()` combina datos del JSON con los overrides en cada carga

### Rutas relativas
`main.js` detecta si la página está en `/pages/` y ajusta `BASE_PATH` y `PAGES_PATH` automáticamente, lo que permite que los mismos scripts funcionen desde `index.html` y desde las páginas internas sin cambios.

### Nomenclatura CSS
Se usa una metodología de clases por componente (`.sidebar-item`, `.metric-card`, `.badge-estado`) sin BEM estricto, lo que mantiene el CSS legible y específico sin sobreespecificación.

### Cascada de dropdowns
Los datos de la cascada Tipo → Servicio → Categoría → Subcategoría están embebidos directamente en `formulario.js` como un objeto JS, evitando una petición adicional al servidor.

---

## Consideraciones de accesibilidad

- Atributos `aria-label`, `aria-required`, `aria-expanded`, `aria-live` en todos los controles interactivos
- Roles semánticos: `role="main"`, `role="navigation"`, `role="banner"`, `role="tabpanel"`, `role="toolbar"`
- Navegación por teclado en la tabla (tecla Enter en filas) y en la zona de carga de archivos
- Contraste de colores ≥ 4.5:1 en texto principal sobre fondos
- Mensajes de error asociados a inputs con `aria-describedby`
- Paginación con `aria-label` en cada botón
- Modales con foco gestionado por Bootstrap 5
- `aria-current="page"` en el ítem activo del sidebar

---

## Datos de prueba

### Usuarios (`data/usuarios.json`)

| Email | Contraseña | Rol |
|---|---|---|
| admin@coopfinanzas.com | Admin2024* | Administrador |
| operador@coopfinanzas.com | Oper2024* | Operador |
| supervisor@coopfinanzas.com | Super2024* | Supervisor |

### Casos (`data/casos.json`)

15 casos de muestra que cubren:
- **Tipos:** Petición, Queja, Reclamo, Sugerencia, Felicitación
- **Estados:** Radicado, En Gestión, Pendiente de Información, Cerrado
- **Prioridades:** Baja, Normal, Alta, Crítica
- **Semáforos:** verde (en tiempo), amarillo (próximo a vencer), rojo (SLA vencido)
- **Servicios:** Créditos, Seguros, Canales Digitales, Tarjetas, Atención al Cliente, Inversiones

Cada caso incluye historial de 2-4 entradas y algunos tienen comentarios y adjuntos simulados.

---

## Responsive

| Breakpoint | Comportamiento |
|---|---|
| 320px (móvil) | Sidebar oculto con toggle hamburguesa, tabla con scroll horizontal, métricas 2×2 |
| 768px (tablet) | Sidebar disponible, layouts de 2 columnas en formularios |
| 1280px+ (desktop) | Layout completo con sidebar fijo y tabla con todas las columnas visibles |

---

*Prueba técnica desarrollada para el cargo de Maquetador Web · Estrategia Segura S.A.S*
