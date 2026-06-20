"use strict";

if (window.location.pathname.includes("detalle-caso")) {
  let currentCaso = null;

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
      const detalleHtml = [
        field("Servicio", c.servicio),
        field("Categoría", c.categoria),
        field("Subcategoría", c.subcategoria),
        field("Responsable", c.responsable),
        field("Fecha límite SLA", formatDateTime(c.fechaLimite)),
        field("Prioridad", c.prioridad),
        field("SLA aplicado", c.slaAplicado || "Estándar"),
        field("Tipo de causa", c.tipoCausa || "—"),
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

    /* -------------------------------------------------------
       Renderizar comentarios
       ------------------------------------------------------- */
    function renderComentarios(comentarios) {
      $("#badgeComentarios").text(comentarios.length);
      if (!comentarios.length) {
        $("#listaComentarios").html(`
          <div class="empty-state">
            <i class="bi bi-chat-dots d-block mb-2" style="font-size:2rem; opacity:0.3;"></i>
            <p class="text-muted mb-0" style="font-size:var(--font-size-sm);">Sin comentarios aún.</p>
          </div>`);
        return;
      }
      const html = comentarios
        .map((com) => {
          const initials = com.usuario
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase();
          return `
          <div class="comment-item">
            <div class="comment-avatar">${initials}</div>
            <div class="comment-bubble">
              <div class="comment-meta">
                <strong>${com.usuario}</strong> · ${formatDateTime(com.fecha)}
              </div>
              <p class="comment-text">${com.texto}</p>
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
      $("#badgeAdjuntos").text(adjuntos.length);
      if (!adjuntos.length) {
        $("#listaAdjuntos").html(`
          <div class="empty-state">
            <i class="bi bi-paperclip d-block mb-2" style="font-size:2rem; opacity:0.3;"></i>
            <p class="text-muted mb-0" style="font-size:var(--font-size-sm);">Sin adjuntos.</p>
          </div>`);
        return;
      }
      const html = adjuntos
        .map((a) => {
          let iconClass = "bi-file-earmark";
          let colorClass = "";
          if (a.tipo === "application/pdf") {
            iconClass = "bi-file-earmark-pdf";
            colorClass = "pdf";
          } else if (a.tipo?.startsWith("image")) {
            iconClass = "bi-file-earmark-image";
            colorClass = "img";
          } else if (a.tipo?.includes("word")) {
            iconClass = "bi-file-earmark-word";
            colorClass = "docx";
          }
          return `
          <div class="attachment-item">
            <i class="bi ${iconClass} attachment-icon ${colorClass}" aria-hidden="true"></i>
            <div class="attachment-info">
              <div class="attachment-name">${a.nombre}</div>
              <div class="attachment-size">${a.tamano}</div>
            </div>
            <button class="btn btn-sm btn-outline-secondary" title="Descargar (simulado)" aria-label="Descargar ${a.nombre}">
              <i class="bi bi-download" aria-hidden="true"></i>
            </button>
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
       Agregar comentario inline
       ------------------------------------------------------- */
    $("#btnAgregarComentario").on("click", function () {
      const texto = $("#nuevoComentario").val().trim();
      if (!texto) {
        $("#nuevoComentario").addClass("is-invalid");
        return;
      }
      $("#nuevoComentario").removeClass("is-invalid");

      const user = getSessionUser();
      const nuevoComentario = {
        fecha: new Date().toISOString(),
        texto: texto,
        usuario: user ? user.nombre : "Usuario",
      };

      currentCaso.comentarios = currentCaso.comentarios || [];
      currentCaso.comentarios.push(nuevoComentario);
      currentCaso.historial.push({
        fecha: nuevoComentario.fecha,
        accion: "Comentario registrado",
        usuario: nuevoComentario.usuario,
      });

      saveCasoOverride(currentCaso);
      renderComentarios(currentCaso.comentarios);
      renderHistorial(currentCaso.historial);
      $("#nuevoComentario").val("");
      showToast("Comentario registrado exitosamente.", "success");
    });

    $("#nuevoComentario").on("input", function () {
      $(this).removeClass("is-invalid");
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
       Descarga simulada
       ------------------------------------------------------- */
    $(document).on(
      "click",
      '.btn-outline-secondary[title="Descargar (simulado)"]',
      function () {
        showToast("Descarga simulada. No hay archivo real disponible.", "info");
      }
    );

    /* -------------------------------------------------------
       Error state
       ------------------------------------------------------- */
    function showError() {
      $("#loadingState").addClass("d-none");
      $("#errorState").removeClass("d-none");
    }
  }); // end document.ready
}
