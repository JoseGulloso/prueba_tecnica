# GestorFPQRS — Prueba Técnica Maquetador Web · Estrategia Segura S.A.S

Sistema web de gestión de FPQRS (Felicitaciones, Peticiones, Quejas, Reclamos y Sugerencias) para una cooperativa financiera ficticia llamada **CoopFinanzas**. Desarrollado como prueba técnica con HTML, CSS y JavaScript.

---

## Demo en vivo

| Entorno | URL |
|---|---|
| Vercel (producción) | https://prueba-tecnica-five-psi.vercel.app |
| Repositorio GitHub | https://github.com/JoseGulloso/prueba_tecnica |

---

## Stack tecnológico

| Tecnología | Versión | Para qué se usa |
|---|---|---|
| HTML5 semántico | — | Estructura de todas las vistas |
| CSS3 (variables, flexbox, grid) | — | Estilos propios modulares |
| Bootstrap 5 | 5.3.3 (CDN) | Grid, componentes y utilidades responsive |
| Bootstrap Icons | 1.11.3 (CDN) | Iconografía |
| jQuery | 3.7.1 (CDN) | DOM, eventos, AJAX y validaciones |
| JavaScript ES6+ | — | Lógica de negocio modular |

Todo llega por CDN, así que no hay `npm install` ni nada por estilo.

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
│       └── logo.webp             ← Logo CoopFinanzas
├── data/
│   ├── casos.json                ← 15 casos de muestra (todos los tipos y estados)
│   ├── catalogo-fpqrs.json       ← Catálogo de servicios, categorías y subcategorías
│   └── usuarios.json             ← 3 usuarios demo (Administrador, Operador, Supervisor)
└── README.md
```

---

## ¿Cómo ejecutarlo localmente?

> **Importante:** El proyecto usa `$.getJSON()` de jQuery para cargar los archivos de datos, por lo que necesita servirse desde HTTP. Abrirlo directamente como `file://` no funciona.

### Opción recomendada — VS Code Live Server

1. Instala la extensión **Live Server** en VS Code
2. Abre la carpeta `Prueba_tecnica/` en VS Code
3. Clic derecho sobre `index.html` → **"Open with Live Server"**
4. Se abre automáticamente en `http://127.0.0.1:5500/`

---

## Vistas implementadas

### 1. `index.html` — Login / Registro

La pantalla de entrada al sistema. Tiene diseño de dos paneles: el izquierdo muestra el branding de la plataforma y el derecho alterna entre el formulario de login y el de registro sin recargar la página.

- Login con email + contraseña, checkbox "Recordar sesión" y enlace "¿Olvidó contraseña?"
- Registro con nombre, email, contraseña, confirmación y consentimiento de datos
- Validación en tiempo real campo por campo (Bootstrap Validation + jQuery)
- Credenciales cargadas desde `data/usuarios.json` vía `$.getJSON()`
- 3 botones de acceso rápido que auto-rellenan las credenciales demo (Admin, Operador, Supervisor)
- Si ya hay sesión activa → redirige directamente a la bandeja

---

### 2. `pages/bandeja-casos.html` — Bandeja de casos

El corazón del sistema. Muestra todos los casos con métricas en tiempo real, filtros avanzados y la tabla principal.

- **4 tarjetas métricas** calculadas dinámicamente: casos activos, SLA vencido, próximos a vencer, cerrados hoy
- **Tabla responsive** con 13 columnas, badges de estado/tipo/prioridad y semáforo visual de SLA
- **Búsqueda en tiempo real** con debounce de 300 ms
- **Panel de filtros** por estado, tipo, servicio, responsable, prioridad y estado de SLA
- **Ordenamiento por columna** (ascendente/descendente) con indicador visual
- **Paginación** con 10/25/50 filas por página y navegación con ellipsis
- **Exportar CSV** con los casos que estén filtrados en ese momento
- Clic en una fila → navega a `detalle-caso.html?id=FPQRS-XXXX`

---

### 3. `pages/detalle-caso.html` — Detalle del caso

Vista completa de un caso individual. Lee el parámetro `?id=` de la URL, combina el JSON base con los cambios guardados en `localStorage` y renderiza todo el caso.

- **Status strip** con ID, asunto y todos los badges del caso
- **Banner de alerta** cuando el SLA está vencido
- **Dos columnas:** información del asociado + detalles del caso a la izquierda; panel de acciones a la derecha
- **5 pestañas Bootstrap:** Descripción, Comentarios, Adjuntos, Historial, Respuestas
- **Acciones con modales:** cambiar estado, cambiar prioridad, reasignar responsable, registrar observación, cerrar caso (con observación obligatoria)
- Todos los cambios se persisten en `localStorage` y se reflejan de vuelta en la bandeja
- Botón para imprimir el caso

---

### 4. `pages/formulario-fpqrs.html` — Formulario FPQRS

Formulario de cara al público para radicar un nuevo caso. Diseñado para que cualquier asociado pueda usarlo sin necesidad de tener cuenta en el sistema.

- **Datos personales:** tipo de ID, número, nombre, email, teléfono, dirección
- **Datos del caso:** tipo, servicio, categoría y subcategoría en **cascada dinámica** (poblada desde `catalogo-fpqrs.json`)
- **Campos condicionales:** campo de urgencia aparece solo para Queja/Reclamo; área sugerida solo para Sugerencia
- **Contador de caracteres** en el campo de descripción
- **Zona de archivos drag-and-drop:** hasta 5 archivos de máximo 5 MB, con lista visual y eliminación individual
- **Consentimiento** obligatorio según Ley 1581/2012
- Al radicar: genera un ID aleatorio, guarda en `localStorage` y muestra modal con el número de radicado
- El caso nuevo aparece en la bandeja al volver

---

## Decisiones técnicas relevantes

### Inyección de navbar y sidebar
Los componentes compartidos se renderizan via template literals en `main.js` (`renderNavbar()` / `renderSidebar()`). Evita duplicar HTML entre páginas y permite resaltar el ítem activo del menú según `window.location.pathname`.

### Persistencia sin backend
- `sessionStorage` → sesión del usuario autenticado
- `localStorage["gestor_fpqrs_casos_override"]` → modificaciones a casos existentes (estado, prioridad, comentarios, historial)
- `localStorage["gestor_fpqrs_casos_nuevos"]` → casos radicados desde el formulario
- `mergeCasos()` combina el JSON base con los overrides en cada carga de página

### Rutas relativas portables
`main.js` detecta si la página corre desde `/pages/` y ajusta `BASE_PATH` y `PAGES_PATH` automáticamente. Los mismos scripts funcionan tanto desde `index.html` como desde las páginas internas sin ningún cambio.

### Catálogo en JSON externo
La cascada Tipo → Servicio → Categoría → Subcategoría se pobla desde `data/catalogo-fpqrs.json`, que cubre 12 servicios con sus respectivas categorías y subcategorías. Esto hace que el formulario sea fácilmente extensible sin tocar el JS.

### Nomenclatura CSS
Clases por componente (`.sidebar-item`, `.metric-card`, `.badge-estado`) sin BEM estricto. Mantiene el CSS legible y específico sin sobreespecificación ni capas de abstracción innecesarias.

---

## Accesibilidad

- `aria-label`, `aria-required`, `aria-expanded`, `aria-live` en todos los controles interactivos
- Roles semánticos: `role="main"`, `role="navigation"`, `role="banner"`, `role="tabpanel"`, `role="toolbar"`
- Navegación por teclado en la tabla (Enter en filas) y en la zona de carga de archivos
- Contraste de colores ≥ 4.5:1 en texto principal sobre fondos
- Mensajes de error vinculados a sus inputs con `aria-describedby`
- `aria-current="page"` en el ítem activo del sidebar
- Foco gestionado por Bootstrap 5 en todos los modales

---

## Datos de prueba

### Usuarios — `data/usuarios.json`

| Nombre | Email | Contraseña | Rol |
|---|---|---|---|
| Sofía Martínez | admin@coopfinanzas.com.co | Admin@2026! | Administrador |
| Carlos Herrera | operador@coopfinanzas.com.co | Oper@2026! | Operador |
| Laura Gómez | supervisor@coopfinanzas.com.co | Super@2026! | Supervisor |

### Casos — `data/casos.json`

15 casos de muestra (FPQRS-2024-001 al FPQRS-2024-015) que cubren:

- **Tipos:** Felicitación, Petición, Queja, Reclamo, Sugerencia
- **Estados:** Radicado, En Gestión, Pendiente de Información, Cerrado
- **Prioridades:** Baja, Normal, Alta, Crítica
- **Semáforos SLA:** verde (en tiempo), amarillo (próximo a vencer), rojo (vencido)
- **Servicios:** Crédito, Seguros, Canales Digitales, Tarjetas, Atención al Cliente, Inversiones, entre otros

Cada caso incluye historial de 2–4 entradas y varios tienen comentarios y adjuntos simulados.

### Catálogo — `data/catalogo-fpqrs.json`

Catálogo jerárquico con 12 servicios, cada uno con sus categorías y subcategorías. Alimenta los dropdowns en cascada del formulario de radicación.

---

## Responsive

| Breakpoint | Comportamiento |
|---|---|
| 320 px (móvil) | Sidebar oculto con toggle hamburguesa, tabla con scroll horizontal, métricas en grid 2×2 |
| 768 px (tablet) | Sidebar disponible, layouts de 2 columnas en formularios |
| 1280 px+ (desktop) | Layout completo con sidebar fijo y tabla con todas las columnas visibles |

---

*Prueba técnica desarrollada para el cargo de Maquetador Web · Estrategia Segura S.A.S*
