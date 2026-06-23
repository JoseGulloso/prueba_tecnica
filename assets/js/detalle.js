"use strict";

if (window.location.pathname.includes("detalle-caso")) {
  let currentCaso = null;
  let _allComentarios = [];
  let _currentFilter = "todos";
  let _allAdjuntos = [];
  let _currentAdjuntoFilter = "todos";

  $(document).ready(function () {
    /* -------------------------------------------------------
       Leer ID de la URL
       ------------------------------------------------------- */
    const params = new URLSearchParams(window.location.search);
    const caseId = params.get("id");

    if (!caseId) {
      showError();
      return;
    }

    /* -------------------------------------------------------
       Cargar caso
       ------------------------------------------------------- */
    loadJSON("data/casos.json")
      .done(function (data) {
        const allCasos = mergeCasos(data);
        currentCaso = allCasos.find((c) => c.id === decodeURIComponent(caseId));

        if (!currentCaso) {
          showError();
          return;
        }

        renderCase(currentCaso);
        $("#loadingState").addClass("d-none");
        $("#caseContent").removeClass("d-none");
      })
      .fail(showError);

    /* -------------------------------------------------------
       Renderizar el caso completo
       ------------------------------------------------------- */
    function renderCase(c) {
      document.title = `${c.id} — GestorFPQRS`;

      // Breadcrumb
      $("#breadcrumbId").text(c.id);

      // Cabecera
      $("#caseTitle").text(c.id);
      $("#stripTipo").html(getBadgeTipo(c.tipo));
      $("#stripEstado").html(getBadgeEstado(c.estado));
      $("#stripSemaforo").html(getSemaforo(c.semaforo, c.estado));

      const subheaderParts = [`Radicado el ${formatDateTime(c.fechaCreacion)}`];
      if (c.canal) subheaderParts.push(`Canal: ${c.canal}`);
      $("#caseSubheader").text(subheaderParts.join(" · "));

      // Banner SLA
      if (c.semaforo === "rojo") {
        $("#slaAlert").removeClass("d-none");
        $("#slaAlertSub").text(
          `La fecha límite de respuesta fue ${formatDateTime(c.fechaLimite)}. Este caso requiere acción inmediata.`
        );
      }

      // Panel derecho — estado actual
      refreshPanelEstado(c);

      // Información del asociado
      const asociadoHtml = [
        field("Nombre", c.solicitante),
        field("Identificación", c.identificacion),
        field("Correo", c.email),
        field("Celular", c.telefono),
        field("Dirección", c.direccion || "—"),
      ].join("");
      $("#asociadoFields").html(asociadoHtml);

      // Detalles del caso
      const slaVencido = c.semaforo === "vencido" || c.semaforo === "rojo";
      const slaStyle = slaVencido
        ? 'style="color:var(--color-danger); font-weight:var(--font-weight-semibold);"'
        : "";
      const detalleHtml = [
        field("Servicio",          c.servicio),
        field("Categoría",         c.categoria),
        field("Subcategoría",      c.subcategoria),
        field("Responsable",       c.responsable),
        fieldHtml("Prioridad",     getBadgePrioridad(c.prioridad)),
        field("SLA aplicado",      c.slaAplicado || "Estándar"),
        fieldHtml("Fecha límite SLA", `<span ${slaStyle}>${formatDateTime(c.fechaLimite)}</span>`),
        field("Tipo de causa",     c.tipoCausa || "—"),
      ].join("");
      $("#detalleFields").html(detalleHtml);

      // Descripción
      $("#caseDescripcion").text(c.descripcion);

      // Tabs
      renderComentarios(c.comentarios || []);
      renderAdjuntos(c.adjuntos || []);
      renderHistorial(c.historial || []);
    }

    function refreshPanelEstado(c) {
      $("#panelEstado").html(getBadgeEstado(c.estado));
      $("#panelPrioridad").html(getBadgePrioridad(c.prioridad));
      $("#panelResponsable").text(c.responsable || "—");
      $("#panelSlaValor").text(formatDate(c.fechaLimite));
      $("#panelPrioridadActualBadge").html(
        `<small class="text-muted me-1">Prioridad actual:</small>${getBadgePrioridad(c.prioridad)}`
      );
    }

    function field(label, value) {
      return `
        <div class="field-group">
          <label>${label}</label>
          <div class="field-value">${value || "—"}</div>
        </div>`;
    }

    function fieldHtml(label, htmlValue) {
      return `
        <div class="field-group">
          <label>${label}</label>
          <div class="field-value">${htmlValue || "—"}</div>
        </div>`;
    }

    /* -------------------------------------------------------
       Renderizar comentarios
       ------------------------------------------------------- */
    function renderComentarios(comentarios) {
      _allComentarios = comentarios;
      $("#badgeComentarios, #badgeComentariosHeader").text(comentarios.length);

      const filtered =
        _currentFilter === "todos"
          ? comentarios
          : comentarios.filter((c) => (c.tipo || "interno") === _currentFilter);

      if (!filtered.length) {
        const msg =
          _currentFilter === "interno"
            ? "Sin comentarios internos aún."
            : _currentFilter === "visible"
            ? "Sin comentarios visibles al asociado aún."
            : "Sin comentarios aún.";
        $("#listaComentarios").html(`
          <div class="empty-state">
            <i class="bi bi-chat-dots d-block mb-2" style="font-size:2rem; opacity:0.3;"></i>
            <p class="text-muted mb-0" style="font-size:var(--font-size-sm);">${msg}</p>
          </div>`);
        return;
      }

      const html = filtered
        .map((com, i) => {
          const initials = com.usuario
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase();
          const tipo = com.tipo || "interno";
          const tipoClass = tipo === "visible" ? "comment-card--visible" : "";
          const tipoBadge =
            tipo === "visible"
              ? `<span class="comment-badge-visible"><i class="bi bi-eye-fill"></i>Visible al asociado</span>`
              : `<span class="comment-badge-interno"><i class="bi bi-lock-fill"></i>Interno</span>`;
          const ip = com.ip || "190.24.135.78";
          const collapseId = `commentBody-${i}`;

          return `
          <div class="comment-card ${tipoClass}">
            <div class="comment-card-header" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="true">
              <div class="comment-avatar">${initials}</div>
              <div class="comment-card-meta">
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <span class="comment-card-author">${com.usuario}</span>
                  ${tipoBadge}
                </div>
                <div class="comment-card-date">
                  <i class="bi bi-clock me-1"></i>${formatDateTime(com.fecha)} · IP: ${ip}
                </div>
              </div>
              <i class="bi bi-chevron-up comment-card-toggle"></i>
            </div>
            <div class="collapse show" id="${collapseId}">
              <div class="comment-card-body">${com.texto}</div>
            </div>
          </div>`;
        })
        .join("");

      $("#listaComentarios").html(html);
    }

    /* -------------------------------------------------------
       Renderizar adjuntos
       ------------------------------------------------------- */
    function renderAdjuntos(adjuntos) {
      _allAdjuntos = adjuntos;
      $("#badgeAdjuntos, #badgeAdjuntosHeader").text(adjuntos.length);

      const filtered =
        _currentAdjuntoFilter === "todos"
          ? adjuntos
          : adjuntos.filter((a) => (a.categoria || "") === _currentAdjuntoFilter);

      if (!filtered.length) {
        const msg = _currentAdjuntoFilter === "todos" ? "Sin adjuntos." : `Sin adjuntos de tipo "${_currentAdjuntoFilter}".`;
        $("#listaAdjuntos").html(`
          <div class="empty-state">
            <i class="bi bi-paperclip d-block mb-2" style="font-size:2rem; opacity:0.3;"></i>
            <p class="text-muted mb-0" style="font-size:var(--font-size-sm);">${msg}</p>
          </div>`);
        return;
      }

      const html = filtered
        .map((a, i) => {
          let iconClass = "bi-file-earmark";
          let iconWrapClass = "generic";
          if (a.tipo === "application/pdf") {
            iconClass = "bi-file-earmark-pdf";
            iconWrapClass = "pdf";
          } else if (a.tipo?.startsWith("image")) {
            iconClass = "bi-file-earmark-image";
            iconWrapClass = "img";
          } else if (a.tipo?.includes("word")) {
            iconClass = "bi-file-earmark-word";
            iconWrapClass = "docx";
          }
          const ext = a.nombre.split(".").pop().toUpperCase();
          const categoria = a.categoria || "Sin categoría";
          const visibilidad = a.visibilidad || "interno";
          const visibBadge = visibilidad === "visible"
            ? `<span class="attachment-badge-visible"><i class="bi bi-eye-fill"></i>Visible al asociado</span>`
            : `<span class="attachment-badge-interno"><i class="bi bi-eye-slash-fill"></i>Interno</span>`;
          const collapseId = `attachBody-${i}`;

          return `
          <div class="attachment-card">
            <div class="attachment-card-header" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false">
              <div class="attachment-icon-wrap ${iconWrapClass}">
                <i class="bi ${iconClass}"></i>
              </div>
              <div class="attachment-card-meta">
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <span class="attachment-card-name">${a.nombre}</span>
                  <span class="attachment-badge-categoria">${categoria}</span>
                  ${visibBadge}
                </div>
                <div class="attachment-card-sub">${a.tamano} · ${ext} · ${a.fecha || ""}</div>
              </div>
              <i class="bi bi-chevron-up attachment-card-toggle collapsed"></i>
            </div>
            <div class="collapse" id="${collapseId}">
              <div class="attachment-card-body">
                <div class="field-row">
                  <div class="field-group">
                    <label>CARGADO POR</label>
                    <div class="field-value"><i class="bi bi-person me-1"></i>${a.cargadoPor || "—"}</div>
                  </div>
                  <div class="field-group">
                    <label>FECHA DE CARGA</label>
                    <div class="field-value"><i class="bi bi-clock me-1"></i>${a.fecha || "—"}</div>
                  </div>
                  <div class="field-group">
                    <label>IP DE CARGA</label>
                    <div class="field-value">${a.ip || "190.24.135.78"}</div>
                  </div>
                  <div class="field-group">
                    <label>TIPO MIME</label>
                    <div class="field-value">${a.tipo || "—"}</div>
                  </div>
                  <div class="field-group">
                    <label>TAMAÑO</label>
                    <div class="field-value">${a.tamano || "—"}</div>
                  </div>
                  <div class="field-group">
                    <label>TIPO ADJUNTO</label>
                    <div class="field-value">${a.categoria || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>`;
        })
        .join("");

      $("#listaAdjuntos").html(html);
    }

    /* -------------------------------------------------------
       Renderizar historial
       ------------------------------------------------------- */
    function renderHistorial(historial) {
      $("#badgeHistorial").text(historial.length);
      if (!historial.length) {
        $("#listaHistorial").html(
          '<p class="text-muted text-center">Sin historial.</p>'
        );
        return;
      }
      const html = [...historial]
        .reverse()
        .map(
          (h) => `
        <div class="timeline-item">
          <div class="timeline-date">${formatDateTime(h.fecha)}</div>
          <div class="timeline-action">${h.accion}</div>
          <div class="timeline-user">Por: ${h.usuario}</div>
        </div>`
        )
        .join("");
      $("#listaHistorial").html(html);
    }

    /* -------------------------------------------------------
       Comentarios — mostrar/ocultar formulario
       ------------------------------------------------------- */
    $("#btnAgregarComentario").on("click", function () {
      const $form = $("#formNuevoComentario");
      $form.toggleClass("d-none");
      if (!$form.hasClass("d-none")) {
        $("#nuevoComentario").focus();
      }
    });

    $("#btnCancelarComentario").on("click", function () {
      $("#formNuevoComentario").addClass("d-none");
      $("#nuevoComentario").val("").removeClass("is-invalid");
      $("#charCounter").text("0 caracteres");
      $("input[name='tipoComentario'][value='interno']").prop("checked", true);
      $("#tipoComentarioHint").text("Solo visible para operadores internos del sistema.");
    });

    /* Contador de caracteres */
    $("#nuevoComentario").on("input", function () {
      const len = $(this).val().length;
      $("#charCounter").text(`${len} caracter${len === 1 ? "" : "es"}`);
      $(this).removeClass("is-invalid");
    });

    /* Hint de tipo */
    $("input[name='tipoComentario']").on("change", function () {
      const hint =
        $(this).val() === "visible"
          ? "Será visible para el asociado en su portal."
          : "Solo visible para operadores internos del sistema.";
      $("#tipoComentarioHint").text(hint);
    });

    /* Guardar comentario */
    $("#btnGuardarComentario").on("click", function () {
      const texto = $("#nuevoComentario").val().trim();
      if (!texto) {
        $("#nuevoComentario").addClass("is-invalid");
        return;
      }
      $("#nuevoComentario").removeClass("is-invalid");

      const tipo = $("input[name='tipoComentario']:checked").val() || "interno";
      const user = getSessionUser();
      const nuevoComentario = {
        fecha: new Date().toISOString(),
        texto: texto,
        usuario: user ? user.nombre : "Usuario",
        tipo: tipo,
      };

      currentCaso.comentarios = currentCaso.comentarios || [];
      currentCaso.comentarios.push(nuevoComentario);
      currentCaso.historial.push({
        fecha: nuevoComentario.fecha,
        accion: `Comentario ${tipo === "visible" ? "visible" : "interno"} registrado`,
        usuario: nuevoComentario.usuario,
      });

      saveCasoOverride(currentCaso);
      renderComentarios(currentCaso.comentarios);
      renderHistorial(currentCaso.historial);

      $("#formNuevoComentario").addClass("d-none");
      $("#nuevoComentario").val("");
      $("#charCounter").text("0 caracteres");
      $("input[name='tipoComentario'][value='interno']").prop("checked", true);
      $("#tipoComentarioHint").text("Solo visible para operadores internos del sistema.");
      showToast("Comentario registrado exitosamente.", "success");
    });

    /* Filtros */
    $("#commentFilters").on("click", ".comment-filter-btn", function () {
      $("#commentFilters .comment-filter-btn").removeClass("active");
      $(this).addClass("active");
      _currentFilter = $(this).data("filter");
      renderComentarios(_allComentarios);
    });

    /* Collapse toggle — rotar chevron */
    $(document)
      .on("hide.bs.collapse", ".comment-card .collapse", function () {
        $(this).closest(".comment-card").find(".comment-card-toggle").addClass("collapsed");
      })
      .on("show.bs.collapse", ".comment-card .collapse", function () {
        $(this).closest(".comment-card").find(".comment-card-toggle").removeClass("collapsed");
      });

    /* -------------------------------------------------------
       Panel derecho — Cambiar estado
       ------------------------------------------------------- */
    $("#btnAplicarEstado").on("click", function () {
      const nuevoEstado = $("#panelNuevoEstado").val();
      if (!nuevoEstado) {
        $("#panelNuevoEstado").addClass("is-invalid");
        return;
      }
      $("#panelNuevoEstado").removeClass("is-invalid");

      const user = getSessionUser();
      currentCaso.estado = nuevoEstado;
      currentCaso.historial.push({
        fecha: new Date().toISOString(),
        accion: `Estado cambiado a ${nuevoEstado}`,
        usuario: user ? user.nombre : "Usuario",
      });
      saveCasoOverride(currentCaso);

      $("#panelNuevoEstado").val("");
      refreshPanelEstado(currentCaso);
      $("#stripEstado").html(getBadgeEstado(nuevoEstado));
      renderHistorial(currentCaso.historial);
      showToast(`Estado actualizado a <strong>${nuevoEstado}</strong>.`, "success");
    });

    $("#panelNuevoEstado").on("change", function () {
      $(this).removeClass("is-invalid");
    });

    /* -------------------------------------------------------
       Panel derecho — Cambiar prioridad
       ------------------------------------------------------- */
    $("#panelNuevaPrioridad").on("change", function () {
      const nuevaPrioridad = $(this).val();
      if (!nuevaPrioridad) return;

      const user = getSessionUser();
      currentCaso.prioridad = nuevaPrioridad;
      currentCaso.historial.push({
        fecha: new Date().toISOString(),
        accion: `Prioridad cambiada a ${nuevaPrioridad}`,
        usuario: user ? user.nombre : "Usuario",
      });
      saveCasoOverride(currentCaso);

      $(this).val("");
      refreshPanelEstado(currentCaso);
      renderHistorial(currentCaso.historial);
      showToast(`Prioridad actualizada a <strong>${nuevaPrioridad}</strong>.`, "success");
    });

    /* -------------------------------------------------------
       Panel derecho — Reasignar
       ------------------------------------------------------- */
    $("#btnAplicarReasignar").on("click", function () {
      const nuevoResp = $("#panelNuevoResponsable").val();
      if (!nuevoResp) {
        $("#panelNuevoResponsable").addClass("is-invalid");
        return;
      }
      $("#panelNuevoResponsable").removeClass("is-invalid");

      const user = getSessionUser();
      const anteriorResp = currentCaso.responsable;
      currentCaso.responsable = nuevoResp;
      currentCaso.historial.push({
        fecha: new Date().toISOString(),
        accion: `Caso reasignado de ${anteriorResp} a ${nuevoResp}`,
        usuario: user ? user.nombre : "Usuario",
      });
      saveCasoOverride(currentCaso);

      $("#panelNuevoResponsable").val("").removeClass("is-invalid");
      refreshPanelEstado(currentCaso);

      // Actualizar campo responsable en detalles
      $("#detalleFields .field-group").each(function () {
        if ($(this).find("label").text() === "Responsable") {
          $(this).find(".field-value").text(nuevoResp);
        }
      });

      renderHistorial(currentCaso.historial);
      showToast(`Caso reasignado a <strong>${nuevoResp}</strong>.`, "success");
    });

    $("#panelNuevoResponsable").on("change", function () {
      $(this).removeClass("is-invalid");
    });

    /* -------------------------------------------------------
       Panel derecho — Registrar observación
       ------------------------------------------------------- */
    $("#btnAplicarObservacion").on("click", function () {
      const texto = $("#panelObservacion").val().trim();
      if (!texto) {
        $("#panelObservacion").addClass("is-invalid");
        return;
      }
      const user = getSessionUser();
      const entrada = {
        fecha: new Date().toISOString(),
        texto: texto,
        usuario: user ? user.nombre : "Usuario",
      };
      currentCaso.comentarios = currentCaso.comentarios || [];
      currentCaso.comentarios.push(entrada);
      currentCaso.historial.push({
        fecha: entrada.fecha,
        accion: "Observación registrada",
        usuario: entrada.usuario,
      });
      saveCasoOverride(currentCaso);

      $("#panelObservacion").val("").removeClass("is-invalid");
      $("#panelNotificarAsociado").prop("checked", false);

      renderComentarios(currentCaso.comentarios);
      renderHistorial(currentCaso.historial);
      showToast("Observación registrada correctamente.", "success");
    });

    $("#panelObservacion").on("input", function () {
      $(this).removeClass("is-invalid");
    });

    /* -------------------------------------------------------
       Panel derecho — Cerrar caso
       ------------------------------------------------------- */
    $("#btnCerrarCaso").on("click", function () {
      const obs = prompt(
        `¿Confirmas el cierre del caso ${currentCaso.id}?\n\nEscribe la observación de cierre (requerida):`
      );
      if (obs === null) return; // canceló
      if (!obs.trim()) {
        showToast("La observación de cierre es requerida.", "warning");
        return;
      }
      const user = getSessionUser();
      currentCaso.estado = "Cerrado";
      currentCaso.historial.push({
        fecha: new Date().toISOString(),
        accion: `Caso cerrado: ${obs.trim()}`,
        usuario: user ? user.nombre : "Usuario",
      });
      saveCasoOverride(currentCaso);

      refreshPanelEstado(currentCaso);
      $("#stripEstado").html(getBadgeEstado("Cerrado"));
      renderHistorial(currentCaso.historial);
      showToast("Caso cerrado exitosamente.", "success");
    });

    /* -------------------------------------------------------
       Panel derecho — Anular caso
       ------------------------------------------------------- */
    $("#btnAnularCaso").on("click", function () {
      const obs = prompt(
        `¿Confirmas la anulación del caso ${currentCaso.id}?\n\nEscribe el motivo de anulación (requerido):`
      );
      if (obs === null) return;
      if (!obs.trim()) {
        showToast("El motivo de anulación es requerido.", "warning");
        return;
      }
      const user = getSessionUser();
      currentCaso.estado = "Anulado";
      currentCaso.historial.push({
        fecha: new Date().toISOString(),
        accion: `Caso anulado: ${obs.trim()}`,
        usuario: user ? user.nombre : "Usuario",
      });
      saveCasoOverride(currentCaso);

      refreshPanelEstado(currentCaso);
      $("#stripEstado").html(getBadgeEstado("Anulado"));
      renderHistorial(currentCaso.historial);
      showToast("Caso anulado.", "warning");
    });

    /* -------------------------------------------------------
       Adjuntos — mostrar/ocultar formulario
       ------------------------------------------------------- */
    $("#btnCargarAdjunto").on("click", function () {
      $("#formNuevoAdjunto").toggleClass("d-none");
    });

    $("#btnCancelarAdjunto").on("click", function () {
      $("#formNuevoAdjunto").addClass("d-none");
      $("#adjuntoFileInput").val("");
      $("#adjuntoFileSelected").addClass("d-none");
      $("#adjuntoFileName").text("");
      $("input[name='adjuntoVisibilidad'][value='interno']").prop("checked", true);
    });

    /* Drop zone — abrir file picker */
    $("#adjuntoDropZone").on("click", function (e) {
      if (!$(e.target).is("#adjuntoFileInput")) {
        $("#adjuntoFileInput").trigger("click");
      }
    });

    /* Drag over / drop */
    $("#adjuntoDropZone").on("dragover", function (e) {
      e.preventDefault();
      $(this).addClass("drag-over");
    }).on("dragleave drop", function (e) {
      e.preventDefault();
      $(this).removeClass("drag-over");
      if (e.type === "drop") {
        const file = e.originalEvent.dataTransfer.files[0];
        if (file) mostrarArchivoSeleccionado(file.name);
      }
    });

    /* File input change */
    $("#adjuntoFileInput").on("change", function () {
      const file = this.files[0];
      if (file) mostrarArchivoSeleccionado(file.name);
    });

    function mostrarArchivoSeleccionado(nombre) {
      $("#adjuntoFileName").text(nombre);
      $("#adjuntoFileSelected").removeClass("d-none");
    }

    /* Quitar archivo */
    $("#btnRemoveFile").on("click", function () {
      $("#adjuntoFileInput").val("");
      $("#adjuntoFileSelected").addClass("d-none");
      $("#adjuntoFileName").text("");
    });

    /* Subir archivo (simulado) */
    $("#btnSubirAdjunto").on("click", function () {
      const nombre = $("#adjuntoFileName").text().trim();
      if (!nombre) {
        showToast("Selecciona un archivo antes de cargar.", "warning");
        return;
      }
      const categoria = $("#adjuntoCategoriaSelect").val();
      const visibilidad = $("input[name='adjuntoVisibilidad']:checked").val() || "interno";
      const mimeMap = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
      const ext = nombre.split(".").pop().toLowerCase();
      const tipo = mimeMap[ext] || "application/octet-stream";
      const now = new Date();
      const fecha = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

      const user = getSessionUser();
      const userName = user ? user.nombre : "Usuario";
      const nuevoAdjunto = { nombre, tipo, tamano: "—", fecha, categoria, visibilidad, cargadoPor: userName };
      currentCaso.adjuntos = currentCaso.adjuntos || [];
      currentCaso.adjuntos.push(nuevoAdjunto);
      currentCaso.historial.push({ fecha: new Date().toISOString(), accion: `Adjunto cargado: ${nombre}`, usuario: userName });

      saveCasoOverride(currentCaso);
      renderAdjuntos(currentCaso.adjuntos);
      renderHistorial(currentCaso.historial);

      $("#formNuevoAdjunto").addClass("d-none");
      $("#adjuntoFileInput").val("");
      $("#adjuntoFileSelected").addClass("d-none");
      $("#adjuntoFileName").text("");
      $("input[name='adjuntoVisibilidad'][value='interno']").prop("checked", true);
      showToast(`Adjunto "${nombre}" cargado exitosamente.`, "success");
    });

    /* Filtro por tipo */
    $("#adjuntoTipoFilter").on("change", function () {
      _currentAdjuntoFilter = $(this).val();
      renderAdjuntos(_allAdjuntos);
    });

    /* Collapse toggle — rotar chevron */
    $(document)
      .on("hide.bs.collapse", ".attachment-card .collapse", function () {
        $(this).closest(".attachment-card").find(".attachment-card-toggle").addClass("collapsed");
      })
      .on("show.bs.collapse", ".attachment-card .collapse", function () {
        $(this).closest(".attachment-card").find(".attachment-card-toggle").removeClass("collapsed");
      });


    /* -------------------------------------------------------
       Error state
       ------------------------------------------------------- */
    function showError() {
      $("#loadingState").addClass("d-none");
      $("#errorState").removeClass("d-none");
    }
  }); // end document.ready
}
