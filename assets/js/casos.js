/**
 * casos.js — Bandeja de casos y detalle
 * GestorFPQRS · Estrategia Segura S.A.S
 */

'use strict';

/* ============================================================
   BANDEJA DE CASOS
   ============================================================ */
if (window.location.pathname.includes('bandeja-casos')) {

  let allCasos     = [];
  let filteredCasos = [];
  let currentPage  = 1;
  let rowsPerPage  = 10;
  let sortField    = 'fechaCreacion';
  let sortDir      = 'desc';

  $(document).ready(function () {

    /* --------------------------------------------------
       Cargar datos
       -------------------------------------------------- */
    loadJSON('data/casos.json')
      .done(function (data) {
        allCasos = mergeCasos(data);
        filteredCasos = [...allCasos];
        renderMetrics(allCasos);
        populateFilterOptions();
        applyFilters();
      })
      .fail(function () {
        $('#tableBody').html(`
          <tr><td colspan="13" class="text-center text-danger py-4">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Error al cargar casos. Usa un servidor local (Live Server o python -m http.server).
          </td></tr>`);
      });

    /* --------------------------------------------------
       Métricas
       -------------------------------------------------- */
    function renderMetrics(casos) {
      const activos    = casos.filter(c => c.estado !== 'Cerrado' && c.estado !== 'Anulado').length;
      const proxVencer = casos.filter(c => normalizeSemaforo(c.semaforo, c.estado) === 'proximo-a-vencer').length;
      const sinAsignar = casos.filter(c => !c.responsable || c.responsable.trim() === '').length;
      const escalados  = casos.filter(c => normalizeSemaforo(c.semaforo, c.estado) === 'vencido').length;

      $('#metricActivos').text(activos);
      $('#metricProxVencer').text(proxVencer);
      $('#metricSinAsignar').text(sinAsignar);
      $('#metricEscalados').text(escalados);

      const now = new Date();
      $('#lastUpdated').text(now.toLocaleDateString('es-CO') + ' ' + now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
    }

    /* --------------------------------------------------
       Filtros y búsqueda
       -------------------------------------------------- */
    function populateFilterOptions() {
      // Responsables únicos
      const responsables = [...new Set(allCasos
        .map(c => c.responsable)
        .filter(r => r && r.trim() !== '')
      )].sort();
      
      const responsableSelect = $('#filterResponsable');
      responsables.forEach(r => {
        responsableSelect.append(`<option value="${r}">${r}</option>`);
      });
    }

    let searchTimeout;
    $('#searchInput').on('input', function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(applyFilters, 300);
    });

    $('#filterEstado, #filterTipo, #filterPrioridad, #filterServicio, #filterResponsable, #filterSlaVencidos, #filterSlaProximos').on('change', applyFilters);

    $('#btnFiltrar').on('click', function () {
      const panel = $('#filterPanel');
      panel.toggle();
      $(this).toggleClass('active');
    });

    $('#btnLimpiarFiltros').on('click', function () {
      $('#searchInput').val('');
      $('#filterEstado, #filterTipo, #filterPrioridad, #filterServicio, #filterResponsable').val('');
      $('#filterSlaVencidos, #filterSlaProximos').prop('checked', false);
      applyFilters();
    });

    function applyFilters() {
      const search   = $('#searchInput').val().toLowerCase().trim();
      const estado   = $('#filterEstado').val();
      const tipo     = $('#filterTipo').val();
      const prioridad = $('#filterPrioridad').val();
      const servicio = $('#filterServicio').val();
      const responsable = $('#filterResponsable').val();
      const slaVencidos = $('#filterSlaVencidos').is(':checked');
      const slaProximos = $('#filterSlaProximos').is(':checked');

      const now = new Date();

      filteredCasos = allCasos.filter(c => {
        const matchSearch = !search || [
          c.id, c.asunto, c.solicitante, c.responsable, c.servicio, c.categoria
        ].some(f => f && f.toLowerCase().includes(search));

        const matchEstado    = !estado    || c.estado === estado;
        const matchTipo      = !tipo      || c.tipo === tipo;
        const matchPrioridad = !prioridad || c.prioridad === prioridad;
        const matchServicio  = !servicio  || c.servicio === servicio;
        const matchResponsable = !responsable || c.responsable === responsable;

        // SLA filters
        let matchSla = true;
        if (slaVencidos || slaProximos) {
          const fechaLimite = new Date(c.fechaLimite);
          const daysUntilExpiry = Math.ceil((fechaLimite - now) / (1000 * 60 * 60 * 24));
          
          if (slaVencidos && slaProximos) {
            matchSla = daysUntilExpiry <= 0 || (daysUntilExpiry > 0 && daysUntilExpiry <= 3);
          } else if (slaVencidos) {
            matchSla = daysUntilExpiry <= 0;
          } else if (slaProximos) {
            matchSla = daysUntilExpiry > 0 && daysUntilExpiry <= 3;
          }
        }

        return matchSearch && matchEstado && matchTipo && matchPrioridad && matchServicio && matchResponsable && matchSla;
      });

      currentPage = 1;
      sortTable();
    }

    /* --------------------------------------------------
       Ordenamiento
       -------------------------------------------------- */
    $(document).on('click', '.sortable-th', function () {
      const field = $(this).data('field');
      if (sortField === field) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortField = field;
        sortDir   = 'asc';
      }
      $('.sortable-th').removeClass('sort-asc sort-desc');
      $(this).addClass('sort-' + sortDir);
      sortTable();
    });

    function sortTable() {
      filteredCasos.sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';
        if (sortField === 'fechaCreacion' || sortField === 'fechaLimite') {
          valA = new Date(valA);
          valB = new Date(valB);
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
        }
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ?  1 : -1;
        return 0;
      });
      renderTable();
    }

    /* --------------------------------------------------
       Filas por página
       -------------------------------------------------- */
    $('#rowsPerPage').on('change', function () {
      rowsPerPage  = parseInt($(this).val());
      currentPage  = 1;
      renderTable();
    });

    /* --------------------------------------------------
       Renderizar tabla
       -------------------------------------------------- */
    function renderTable() {
      const total = filteredCasos.length;
      const start = (currentPage - 1) * rowsPerPage;
      const end   = Math.min(start + rowsPerPage, total);
      const page  = filteredCasos.slice(start, end);

      if (!page.length) {
        $('#tableBody').html(`
          <tr><td colspan="13" class="text-center text-muted py-5">
            <i class="bi bi-search me-2"></i>No se encontraron casos con los filtros actuales.
          </td></tr>`);
      } else {
        $('#tableBody').html(page.map(renderRow).join(''));
      }

      $('#tableInfo').text(`Mostrando ${total ? start + 1 : 0}–${end} de ${total} casos`);
      renderPagination(total);
    }

    function renderRow(c) {
      return `
        <tr class="caso-row" data-id="${c.id}" role="button" tabindex="0" aria-label="Ver caso ${c.id}">
          <td><a href="${PAGES_PATH}detalle-caso.html?id=${encodeURIComponent(c.id)}" class="case-id-link" onclick="event.stopPropagation()">${c.id}</a></td>
          <td class="text-nowrap">${formatDate(c.fechaCreacion)}</td>
          <td>${getBadgeTipo(c.tipo)}</td>
          <td class="text-truncate" style="max-width:110px;" title="${c.servicio || ''}">${c.servicio || '—'}</td>
          <td class="text-truncate" style="max-width:110px;" title="${c.categoria || ''}">${c.categoria || '—'}</td>
          <td class="text-truncate" style="max-width:110px;" title="${c.subcategoria || ''}">${c.subcategoria || '—'}</td>
          <td class="text-truncate" style="max-width:110px;" title="${c.solicitante || ''}">${c.solicitante || '—'}</td>
          <td class="text-nowrap">${c.responsable || '—'}</td>
          <td>${getBadgePrioridad(c.prioridad)}</td>
          <td>${getBadgeEstado(c.estado)}</td>
          <td class="text-nowrap">${formatDate(c.fechaLimite)}</td>
          <td class="text-start">${getSemaforo(c.semaforo, c.estado)}</td>
          <td class="text-center">
            <a href="${PAGES_PATH}detalle-caso.html?id=${encodeURIComponent(c.id)}"
               class="btn btn-sm btn-outline-primary py-0 px-2"
               title="Ver detalle del caso"
               aria-label="Ver detalle del caso ${c.id}"
               onclick="event.stopPropagation()">
              <i class="bi bi-eye"></i>
            </a>
          </td>
        </tr>`;
    }

    /* --------------------------------------------------
       Click en fila → detalle
       -------------------------------------------------- */
    $(document).on('click keypress', '.caso-row', function (e) {
      if (e.type === 'keypress' && e.which !== 13) return;
      if ($(e.target).is('a, button') || $(e.target).closest('a, button').length) return;
      const id = $(this).data('id');
      window.location.href = `${PAGES_PATH}detalle-caso.html?id=${encodeURIComponent(id)}`;
    });

    /* --------------------------------------------------
       Paginación
       -------------------------------------------------- */
    function renderPagination(total) {
      const pages = Math.ceil(total / rowsPerPage);
      if (pages <= 1) { $('#pagination').html(''); return; }

      let html = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Anterior"><i class="bi bi-chevron-left"></i></a>
        </li>`;

      const delta = 2;
      let from = Math.max(1, currentPage - delta);
      let to   = Math.min(pages, currentPage + delta);
      if (from > 1) html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>${from > 2 ? '<li class="page-item disabled"><span class="page-link">…</span></li>' : ''}`;
      for (let p = from; p <= to; p++) {
        html += `<li class="page-item ${p === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${p}">${p}</a></li>`;
      }
      if (to < pages) {
        html += `${to < pages - 1 ? '<li class="page-item disabled"><span class="page-link">…</span></li>' : ''}`;
        html += `<li class="page-item"><a class="page-link" href="#" data-page="${pages}">${pages}</a></li>`;
      }
      html += `
        <li class="page-item ${currentPage === pages ? 'disabled' : ''}">
          <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Siguiente"><i class="bi bi-chevron-right"></i></a>
        </li>`;

      $('#pagination').html(html);
    }

    $(document).on('click', '#pagination .page-link', function (e) {
      e.preventDefault();
      const p = parseInt($(this).data('page'));
      const pages = Math.ceil(filteredCasos.length / rowsPerPage);
      if (!p || p < 1 || p > pages) return;
      currentPage = p;
      renderTable();
      $('html,body').animate({ scrollTop: $('#casosTable').offset().top - 80 }, 200);
    });

    /* --------------------------------------------------
       Exportar CSV simulado
       -------------------------------------------------- */
    $('#btnExportar').on('click', function () {
      const headers = ['Radicado','Fecha Rad.','Tipo','Servicio','Categoría','Subcategoría','Asociado','Responsable','Prioridad','Estado','Límite SLA','Semáforo'];
      const rows    = filteredCasos.map(c => [
        c.id, formatDate(c.fechaCreacion), c.tipo, c.servicio, c.categoria,
        c.subcategoria, c.solicitante, c.responsable, c.prioridad, c.estado, 
        formatDate(c.fechaLimite), getSemaforoLabel(c.semaforo, c.estado)
      ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
      const csv     = [headers.join(','), ...rows].join('\n');
      const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url     = URL.createObjectURL(blob);
      const a       = document.createElement('a');
      a.href = url; a.download = 'casos_fpqrs.csv'; a.click();
      URL.revokeObjectURL(url);
      showToast('Exportación generada correctamente.', 'success');
    });

    /* --------------------------------------------------
       Actualizar tabla
       -------------------------------------------------- */
    $('#btnActualizar').on('click', function () {
      allCasos = mergeCasos(allCasos);
      filteredCasos = [...allCasos];
      renderMetrics(allCasos);
      applyFilters();
      showToast('Bandeja actualizada.', 'info');
    });

  }); // end document.ready
}
