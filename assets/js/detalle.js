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
      // Título de página
      document.title = `${c.id} — GestorFPQRS`;

      // Breadcrumb
      $("#breadcrumbId").text(c.id);

      // Status strip
      $("#stripId").text(c.id);
      $("#stripAsunto").text(c.asunto);
      $("#stripTipo").html(getBadgeTipo(c.tipo));
      $("#stripEstado").html(getBadgeEstado(c.estado));
      $("#stripPrioridad").html(getBadgePrioridad(c.prioridad));
      $("#stripSemaforo").html(getSemaforo(c.semaforo, c.estado));

      // Modal de cierre — ID
      $("#cerrarCasoId").text(c.id);

      // Información del asociado
      const asociadoHtml = [
        field("Nombre", c.solicitante),
        field("Identificación", c.identificacion),
        field("Correo electrónico", c.email),
        field("Teléfono celular", c.telefono),
        field("Dirección", c.direccion || "—"),
      ].join("");
      $("#asociadoFields").html(asociadoHtml);

      // Detalles del caso
      const detalleHtml = [
        field("Servicio", c.servicio),
        field("Categoría", c.categoria),
        field("Subcategoría", c.subcategoria),
        field("Responsable", c.responsable),
        field("Fecha creación", formatDateTime(c.fechaCreacion)),
        field("Límite SLA", formatDate(c.fechaLimite)),
        field("SLA aplicado", `Tiempo de respuesta estándar`),
      ].join("");
      $("#detalleFields").html(detalleHtml);

      // Descripción
      $("#caseDescripcion").text(c.descripcion);

      // Comentarios
      renderComentarios(c.comentarios || []);

      // Adjuntos
      renderAdjuntos(c.adjuntos || []);

      // Historial
      renderHistorial(c.historial || []);
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
          '<p class="text-muted text-center">Sin historial.</p>',
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
        </div>`,
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
       Acciones modales
       ------------------------------------------------------- */

    // Cambiar estado
    $("#btnConfirmarEstado").on("click", function () {
      const nuevoEstado = $("#nuevoEstado").val();
      if (!nuevoEstado) {
        $("#nuevoEstado").addClass("is-invalid");
        return;
      }

      const obs = $("#estadoObservacion").val().trim();
      const user = getSessionUser();
      currentCaso.estado = nuevoEstado;

      const histEntry = {
        fecha: new Date().toISOString(),
        accion: `Estado cambiado a ${nuevoEstado}${obs ? ": " + obs : ""}`,
        usuario: user ? user.nombre : "Usuario",
      };
      currentCaso.historial.push(histEntry);
      saveCasoOverride(currentCaso);

      bootstrap.Modal.getInstance($("#modalCambiarEstado")[0]).hide();
      $("#nuevoEstado").val("").removeClass("is-invalid");
      $("#estadoObservacion").val("");

      $("#stripEstado").html(getBadgeEstado(nuevoEstado));
      renderHistorial(currentCaso.historial);
      showToast(
        `Estado actualizado a <strong>${nuevoEstado}</strong>.`,
        "success",
      );
    });

    // Cambiar prioridad
    $("#btnConfirmarPrioridad").on("click", function () {
      const nuevaPrioridad = $("#nuevaPrioridad").val();
      if (!nuevaPrioridad) {
        $("#nuevaPrioridad").addClass("is-invalid");
        return;
      }

      const user = getSessionUser();
      currentCaso.prioridad = nuevaPrioridad;
      currentCaso.historial.push({
        fecha: new Date().toISOString(),
        accion: `Prioridad cambiada a ${nuevaPrioridad}`,
        usuario: user ? user.nombre : "Usuario",
      });
      saveCasoOverride(currentCaso);

      bootstrap.Modal.getInstance($("#modalCambiarPrioridad")[0]).hide();
      $("#nuevaPrioridad").val("").removeClass("is-invalid");

      $("#stripPrioridad").html(getBadgePrioridad(nuevaPrioridad));
      renderHistorial(currentCaso.historial);
      showToast(
        `Prioridad actualizada a <strong>${nuevaPrioridad}</strong>.`,
        "success",
      );
    });

    // Reasignar
    $("#btnConfirmarReasignar").on("click", function () {
      const nuevoResp = $("#nuevoResponsable").val();
      if (!nuevoResp) {
        $("#nuevoResponsable").addClass("is-invalid");
        return;
      }

      const user = getSessionUser();
      const anteriorResp = currentCaso.responsable;
      currentCaso.responsable = nuevoResp;
      currentCaso.historial.push({
        fecha: new Date().toISOString(),
        accion: `Caso reasignado de ${anteriorResp} a ${nuevoResp}`,
        usuario: user ? user.nombre : "Usuario",
      });
      saveCasoOverride(currentCaso);

      bootstrap.Modal.getInstance($("#modalReasignar")[0]).hide();
      $("#nuevoResponsable").val("").removeClass("is-invalid");

      // Actualizar campo en el panel de detalles
      $("#detalleFields .field-group").each(function () {
        if ($(this).find("label").text() === "Responsable") {
          $(this).find(".field-value").text(nuevoResp);
        }
      });
      renderHistorial(currentCaso.historial);
      showToast(`Caso reasignado a <strong>${nuevoResp}</strong>.`, "success");
    });

    // Observación
    $("#btnConfirmarObservacion").on("click", function () {
      const texto = $("#textoObservacion").val().trim();
      if (!texto) {
        $("#textoObservacion").addClass("is-invalid");
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

      bootstrap.Modal.getInstance($("#modalObservacion")[0]).hide();
      $("#textoObservacion").val("").removeClass("is-invalid");
      $("#notificarAsociado").prop("checked", false);

      renderComentarios(currentCaso.comentarios);
      renderHistorial(currentCaso.historial);
      showToast("Observación registrada correctamente.", "success");
    });

    $("#textoObservacion").on("input", function () {
      $(this).removeClass("is-invalid");
    });

    // Cerrar caso
    $("#btnConfirmarCierre").on("click", function () {
      const obs = $("#cierreObservacion").val().trim();
      if (!obs) {
        $("#cierreObservacion").addClass("is-invalid");
        return;
      }
      const user = getSessionUser();
      currentCaso.estado = "Cerrado";
      currentCaso.historial.push({
        fecha: new Date().toISOString(),
        accion: `Caso cerrado: ${obs}`,
        usuario: user ? user.nombre : "Usuario",
      });
      saveCasoOverride(currentCaso);

      bootstrap.Modal.getInstance($("#modalCerrar")[0]).hide();
      $("#cierreObservacion").val("").removeClass("is-invalid");

      $("#stripEstado").html(getBadgeEstado("Cerrado"));
      renderHistorial(currentCaso.historial);
      showToast("Caso cerrado exitosamente.", "success");
    });

    $("#cierreObservacion").on("input", function () {
      $(this).removeClass("is-invalid");
    });

    // Limpiar validaciones al abrir modales
    $(".modal").on("show.bs.modal", function () {
      $(this).find(".is-invalid").removeClass("is-invalid");
    });

    /* -------------------------------------------------------
       Botón de descarga (simulado)
       ------------------------------------------------------- */
    $(document).on(
      "click",
      '.btn-outline-secondary[title="Descargar (simulado)"]',
      function () {
        showToast("Descarga simulada. No hay archivo real disponible.", "info");
      },
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
