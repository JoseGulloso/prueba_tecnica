"use strict";

/* ============================================================
   Rutas relativas según ubicación de la página
   ============================================================ */
const isInPages = window.location.pathname.includes("/pages/");
const BASE_PATH = isInPages ? "../" : "./";
const PAGES_PATH = isInPages ? "./" : "./pages/";

/* ============================================================
   Carga de archivos JSON locales
   ============================================================ */
function loadJSON(path) {
  return $.getJSON(BASE_PATH + path);
}

/* ============================================================
   Gestión de sesión (sessionStorage)
   ============================================================ */
const SESSION_KEY = "gestor_fpqrs_session";

function getSessionUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSessionUser(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function redirectIfNotAuth() {
  if (!getSessionUser()) {
    window.location.href = BASE_PATH + "index.html";
  }
}

/* ============================================================
   localStorage para casos (sobreescrituras / nuevos)
   ============================================================ */
const LS_CASOS_KEY = "gestor_fpqrs_casos_override";

function getCasosOverride() {
  try {
    return JSON.parse(localStorage.getItem(LS_CASOS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCasoOverride(caso) {
  const overrides = getCasosOverride();
  overrides[caso.id] = caso;
  localStorage.setItem(LS_CASOS_KEY, JSON.stringify(overrides));
}

function getCasosNuevos() {
  try {
    return JSON.parse(localStorage.getItem("gestor_fpqrs_casos_nuevos")) || [];
  } catch {
    return [];
  }
}

function saveCasoNuevo(caso) {
  const nuevos = getCasosNuevos();
  nuevos.unshift(caso);
  localStorage.setItem("gestor_fpqrs_casos_nuevos", JSON.stringify(nuevos));
}

/* ============================================================
   Merge casos JSON + overrides localStorage
   ============================================================ */
function mergeCasos(casosBase) {
  const overrides = getCasosOverride();
  const nuevos = getCasosNuevos();
  const merged = casosBase.map((c) => (overrides[c.id] ? overrides[c.id] : c));
  return [...nuevos, ...merged];
}

/* ============================================================
   Helpers de badges
   ============================================================ */
function getBadgeEstado(estado) {
  const map = {
    Radicado: "radicado",
    "En Gestión": "en-gestion",
    "Pendiente de Información": "pendiente-info",
    Cerrado: "cerrado",
    Anulado: "anulado",
  };
  const cls = map[estado] || "radicado";
  return `<span class="badge-estado ${cls}">${estado}</span>`;
}

function getBadgeTipo(tipo) {
  const cls = tipo
    .toLowerCase()
    .replace(/ó/g, "o")
    .replace(/é/g, "e")
    .replace(/í/g, "i");
  return `<span class="badge-tipo ${cls}">${tipo}</span>`;
}

function getBadgePrioridad(prioridad) {
  const map = {
    Baja: { cls: "baja" },
    Normal: { cls: "normal" },
    Alta: { cls: "alta" },
    Crítica: { cls: "critica" },
  };
  const m = map[prioridad] || { cls: "normal" };
  return `<span class="badge-prioridad ${m.cls}">${prioridad}</span>`;
}

function normalizeSemaforo(valor, estado) {
  const raw = String(valor || "")
    .trim()
    .toLowerCase();
  const status = String(estado || "")
    .trim()
    .toLowerCase();

  if (status === "cerrado" || raw === "cerrado") return "cerrado";
  if (raw === "verde" || raw === "en tiempo" || raw === "en-tiempo")
    return "en-tiempo";
  if (
    raw === "amarillo" ||
    raw === "proximo a vencer" ||
    raw === "próximo a vencer" ||
    raw === "proximo-a-vencer"
  )
    return "proximo-a-vencer";
  if (raw === "rojo" || raw === "vencido") return "vencido";

  return "en-tiempo";
}

function getSemaforo(valor, estado) {
  const key = normalizeSemaforo(valor, estado);
  const meta = {
    cerrado: { label: "Cerrado", cls: "cerrado" },
    "en-tiempo": { label: "En tiempo", cls: "en-tiempo" },
    "proximo-a-vencer": { label: "Proximo a vencer", cls: "proximo-a-vencer" },
    vencido: { label: "Vencido", cls: "vencido" },
  }[key] || { label: "En tiempo", cls: "en-tiempo" };

  return `<span class="semaforo-badge ${meta.cls}" title="${meta.label}"><span class="semaforo-dot" aria-hidden="true"></span><span class="semaforo-text">${meta.label}</span></span>`;
}

function getSemaforoLabel(valor, estado) {
  const key = normalizeSemaforo(valor, estado);
  return (
    {
      cerrado: "Cerrado",
      "en-tiempo": "En tiempo",
      "proximo-a-vencer": "Proximo a vencer",
      vencido: "Vencido",
    }[key] || "En tiempo"
  );
}

/* ============================================================
   Formateo de fechas
   ============================================================ */
function formatDate(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ============================================================
   Toast notifications
   ============================================================ */
function showToast(message, type = "success", duration = 4000) {
  const icons = {
    success: "bi-check-circle-fill",
    danger: "bi-x-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    info: "bi-info-circle-fill",
  };
  const icon = icons[type] || icons.info;
  const id = "toast-" + Date.now();

  const $container = $(".toast-container-custom");
  if (!$container.length) {
    $("body").append('<div class="toast-container-custom"></div>');
  }

  const $toast = $(`
    <div id="${id}" class="toast align-items-center text-bg-${type} border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icon}"></i> ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `);

  $(".toast-container-custom").append($toast);
  const bsToast = new bootstrap.Toast($toast[0], { delay: duration });
  bsToast.show();
  $toast[0].addEventListener("hidden.bs.toast", () => $toast.remove());
}

/* ============================================================
   Inyección de navbar y sidebar compartidos
   ============================================================ */
function renderNavbar(pageTitle) {
  const user = getSessionUser();
  if (!user) return;

  const avatarLetters = user.nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const html = `
    <div class="d-flex flex-column ms-2 d-none d-lg-flex">
      <span class="navbar-brand-title">GestorFPQRS</span>
      ${pageTitle ? `<span class="navbar-page-title">${pageTitle}</span>` : ""}
    </div>
    <div class="navbar-actions">
      <button class="navbar-icon-btn" aria-label="Notificaciones">
        <i class="bi bi-bell"></i>
        <span class="notification-dot"></span>
      </button>
      <div class="dropdown">
        <button class="navbar-avatar dropdown-toggle" style="border:none;" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Menú de usuario">
          ${avatarLetters}
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow-sm">
          <li><span class="dropdown-item-text fw-semibold">${user.nombre}</span></li>
          <li><span class="dropdown-item-text text-muted" style="font-size:0.8rem;">${user.rol}</span></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-person me-2"></i>Mi perfil</a></li>
          <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión</a></li>
        </ul>
      </div>
    </div>
  `;
  $("#navbar-placeholder").html(html);

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    clearSession();
    window.location.href = BASE_PATH + "index.html";
  });
}

function renderSidebar(activePage) {
  const user = getSessionUser();
  if (!user) return;
  const avatarLetters = user.nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const items = [
    {
      key: "bandeja",
      icon: "bi-inbox",
      label: "Bandeja de Casos",
      href: PAGES_PATH + "bandeja-casos.html",
      section: "Operación",
    },
    {
      key: "detalle",
      icon: "bi-file-text",
      label: "Detalle de Caso",
      href: PAGES_PATH + "detalle-caso.html",
      section: "Operación",
    },
    {
      key: "formulario",
      icon: "bi-pencil-square",
      label: "Crear Caso (Operador)",
      href: PAGES_PATH + "formulario-fpqrs.html",
      section: "Operación",
    },
    {
      key: "metricas",
      icon: "bi-bar-chart-line",
      label: "Métricas",
      href: "#",
      section: "Operación",
    },
    {
      key: "analitica",
      icon: "bi-graph-up",
      label: "Analítica",
      href: "#",
      section: "Operación",
    },
    {
      key: "exportar",
      icon: "bi-cloud-download",
      label: "Reportar Casos",
      href: "#",
      section: "Operación",
    },
    {
      key: "auditoria",
      icon: "bi-shield-check",
      label: "Auditoría",
      href: "#",
      section: "Administración",
    },
    {
      key: "params",
      icon: "bi-gear",
      label: "Parametrización",
      href: "#",
      section: "Administración",
    },
    {
      key: "paramsalt",
      icon: "bi-sliders",
      label: "Parámetros Alt.",
      href: "#",
      section: "Administración",
    },
    {
      key: "modelo",
      icon: "bi-diagram-3",
      label: "Modelo Cat. Resp.",
      href: "#",
      section: "Administración",
    },
  ];

  const sections = ["Operación", "Administración"];
  let navHtml = "";
  sections.forEach((sec) => {
    navHtml += `<p class="sidebar-section-title">${sec}</p>`;
    items
      .filter((i) => i.section === sec)
      .forEach((item) => {
        const isActive = item.key === activePage ? "active" : "";
        navHtml += `
        <a href="${item.href}" class="sidebar-item ${isActive}" aria-current="${isActive ? "page" : "false"}">
          <i class="bi ${item.icon}"></i>
          <span>${item.label}</span>
        </a>`;
      });
  });

  const sidebarHtml = `
    <div href="${BASE_PATH}index.html" class="sidebar-brand" aria-label="GestorFPQRS inicio">
      <img src="${BASE_PATH}assets/img/logo.webp" alt="Logo CoopFinanzas" width="36" height="36">
      <div class="sidebar-brand-text">
        <span class="sidebar-brand-name">GestorFPQRS</span>
      </div>
    </div>
    <nav class="sidebar-nav" aria-label="Navegación principal">
      ${navHtml}
    </nav>
    <div class="sidebar-footer">
      <a href="#" class="sidebar-item">
        <i class="bi bi-bell"></i>
        <span>Notificaciones</span>
      </a>
      <div class="sidebar-user-info">
        <div class="sidebar-avatar"><i class="bi bi-person-fill"></i></div>
        <div>
          <div class="sidebar-user-name">${user.nombre}</div>
          <div class="sidebar-user-role">${user.rol}</div>
        </div>
      </div>
      <a href="#" class="sidebar-item sidebar-item-logout" id="sidebarLogoutBtn" aria-label="Cerrar sesión">
        <i class="bi bi-box-arrow-right"></i>
        <span>Cerrar sesión</span>
      </a>
    </div>
  `;

  $("#sidebar-placeholder").html(sidebarHtml);

  if (!$("#sidebarDesktopToggle").length) {
    $("body").append(`
      <button id="sidebarDesktopToggle" class="sidebar-desktop-toggle d-none d-lg-flex" aria-label="Contraer menú" aria-expanded="true" type="button">
        <i class="bi bi-chevron-left"></i>
      </button>`);
  }

  $("#sidebarLogoutBtn").on("click", function (e) {
    e.preventDefault();
    clearSession();
    window.location.href = BASE_PATH + "index.html";
  });

  function setSidebarState(collapsed) {
    const $shell = $(".app-shell");
    const $desktopToggle = $("#sidebarDesktopToggle");
    const sidebarWidth = collapsed ? 64 : 260;
    $shell.toggleClass("sidebar-collapsed", collapsed);
    $desktopToggle.attr("aria-expanded", String(!collapsed));
    $desktopToggle.find("i").attr("class", collapsed ? "bi bi-chevron-right" : "bi bi-chevron-left");
    $desktopToggle.css("left", (sidebarWidth - 14) + "px");
  }

  const savedCollapsed =
    localStorage.getItem("gestor_fpqrs_sidebar_collapsed") === "true";
  if ($(window).width() >= 992) {
    setSidebarState(savedCollapsed);
  }

  if (!$("#mobileSidebarToggle").length) {
    $("body").append(`
      <button id="mobileSidebarToggle" class="mobile-sidebar-toggle d-lg-none" aria-label="Abrir menú">
        <i class="bi bi-list"></i>
      </button>`);
  }
  $("#mobileSidebarToggle")
    .off("click")
    .on("click", function () {
      $(".app-sidebar").toggleClass("show");
      $(".sidebar-overlay").toggleClass("show");
    });
  $(".sidebar-overlay")
    .off("click")
    .on("click", function () {
      $(".app-sidebar, .sidebar-overlay").removeClass("show");
    });

  $("#sidebarDesktopToggle")
    .off("click")
    .on("click", function () {
      if ($(window).width() < 992) return;
      const collapsed = !$(".app-shell").hasClass("sidebar-collapsed");
      setSidebarState(collapsed);
      localStorage.setItem("gestor_fpqrs_sidebar_collapsed", String(collapsed));
    });
}

/* ============================================================
   Inicialización común de páginas internas
   ============================================================ */
function initPage(activePage, pageTitle) {
  redirectIfNotAuth();
  $(document).ready(function () {
    renderSidebar(activePage);
  });
}

/* ============================================================
   Generador de ID de radicado
   ============================================================ */
function generateRadicadoId() {
  const year = new Date().getFullYear();
  const num = String(Math.floor(10000 + Math.random() * 90000));
  return `FPQRS-${year}-${num}`;
}
