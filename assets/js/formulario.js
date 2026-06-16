/**
 * formulario.js — Formulario de radicación FPQRS
 * GestorFPQRS · Estrategia Segura S.A.S
 */

'use strict';

$(document).ready(function () {

  /* =====================================================
     Datos de cascada: Tipo → Servicio → Categoría → Sub
     ===================================================== */
  const cascadaData = {
    'Petición': {
      'Créditos':          { 'Solicitudes': ['Nuevo crédito','Refinanciación','Certificados','Paz y salvo'], 'Documentos': ['Copia de contrato','Extracto'] },
      'Seguros':           { 'Pólizas': ['Consulta de vigencia','Copia de póliza','Beneficiarios'], 'Cobros': ['Verificación de cargo','Cancelación'] },
      'Canales Digitales': { 'App Móvil': ['Acceso','Funcionalidades','Notificaciones'], 'Banca en Línea': ['Registro','Transacciones','Contraseñas'] },
      'Atención al Cliente': { 'Actualización de datos': ['Datos personales','Datos de contacto','Dirección'], 'Certificados': ['Historial crediticio','Saldo','Extracto'] },
      'Tarjetas':          { 'Tarjeta de Crédito': ['Ampliación de cupo','Estado de cuenta','Bloqueo/Desbloqueo'], 'Tarjeta Débito': ['Activación','Reposición','Límites'] },
    },
    'Queja': {
      'Créditos':          { 'Desembolso': ['Error en monto','Error en tasa','Demora'], 'Cobros': ['Cargos no autorizados','Doble cobro'] },
      'Seguros':           { 'Seguros de Vida': ['Cobro no autorizado','Incumplimiento'], 'Pólizas': ['Error en póliza'] },
      'Canales Digitales': { 'App Móvil': ['Autenticación biométrica','Fallas técnicas','Lentitud'], 'Banca en Línea': ['Fallas en transacciones','Seguridad'] },
      'Atención al Cliente': { 'Call Center': ['Tiempos de espera','Mala atención','Información incorrecta'], 'Servicio Presencial': ['Espera prolongada','Mala atención'] },
      'Tarjetas':          { 'Tarjeta Débito': ['Bloqueo de tarjeta','Cobro indebido'], 'Tarjeta de Crédito': ['Fraude','Cargo no reconocido'] },
      'Inversiones':       { 'CDT': ['Liquidación','Renovación automática'], 'Fondos': ['Rentabilidad','Retiro'] },
    },
    'Reclamo': {
      'Créditos':          { 'Desembolso': ['Error en tasa de interés','Monto incorrecto'], 'Cuotas': ['Cobro duplicado','Reliquidación'] },
      'Seguros':           { 'Seguros de Vida': ['Cobro no autorizado','Cancelación sin aviso'], 'Siniestros': ['Demora en pago','Negación injustificada'] },
      'Canales Digitales': { 'Banca en Línea': ['Transferencia no procesada','Doble débito'], 'App Móvil': ['Transacción fallida'] },
      'Inversiones':       { 'CDT': ['Error en liquidación','Tasa incorrecta'] },
    },
    'Sugerencia': {
      'Canales Digitales': { 'App Móvil': ['Nueva funcionalidad','Notificaciones','Usabilidad'], 'Banca en Línea': ['Mejora de interfaz','Nueva función'] },
      'Atención al Cliente': { 'Call Center': ['Tiempos de espera','Horarios de atención'], 'Servicio Presencial': ['Infraestructura','Procesos'] },
      'Créditos':          { 'Proceso de aprobación': ['Digitalización','Tiempos','Comunicación'] },
    },
    'Felicitación': {
      'Atención al Cliente': { 'Servicio Presencial': ['Calidad de atención','Agilidad'], 'Call Center': ['Resolución eficaz','Amabilidad'] },
      'Créditos':          { 'Crédito Hipotecario': ['Proceso de aprobación','Acompañamiento'], 'Crédito de Consumo': ['Rapidez','Asesoría'] },
    }
  };

  /* =====================================================
     Dropdowns en cascada
     ===================================================== */
  function populateSelect($select, options, defaultText) {
    $select.empty().append(`<option value="">— ${defaultText} —</option>`);
    options.forEach(opt => $select.append(`<option value="${opt}">${opt}</option>`));
    $select.prop('disabled', false);
  }

  function resetSelect($select, defaultText) {
    $select.empty().append(`<option value="">— ${defaultText} —</option>`);
    $select.prop('disabled', true);
  }

  $('#fpqrsTipo').on('change', function () {
    const tipo = $(this).val();
    resetSelect($('#fpqrsServicio'), 'Selecciona un servicio');
    resetSelect($('#fpqrsCategoria'), 'Selecciona una categoría');
    resetSelect($('#fpqrsSubcategoria'), 'Selecciona una subcategoría');

    if (tipo && cascadaData[tipo]) {
      populateSelect($('#fpqrsServicio'), Object.keys(cascadaData[tipo]), 'Selecciona un servicio');
    }

    // Mostrar/ocultar campos adicionales según tipo
    updateDynamicFields(tipo);
  });

  $('#fpqrsServicio').on('change', function () {
    const tipo     = $('#fpqrsTipo').val();
    const servicio = $(this).val();
    resetSelect($('#fpqrsCategoria'), 'Selecciona una categoría');
    resetSelect($('#fpqrsSubcategoria'), 'Selecciona una subcategoría');

    if (tipo && servicio && cascadaData[tipo]?.[servicio]) {
      populateSelect($('#fpqrsCategoria'), Object.keys(cascadaData[tipo][servicio]), 'Selecciona una categoría');
    }
  });

  $('#fpqrsCategoria').on('change', function () {
    const tipo      = $('#fpqrsTipo').val();
    const servicio  = $('#fpqrsServicio').val();
    const categoria = $(this).val();
    resetSelect($('#fpqrsSubcategoria'), 'Selecciona una subcategoría');

    if (tipo && servicio && categoria && cascadaData[tipo]?.[servicio]?.[categoria]) {
      populateSelect($('#fpqrsSubcategoria'), cascadaData[tipo][servicio][categoria], 'Selecciona una subcategoría');
    }
  });

  function updateDynamicFields(tipo) {
    // Mostrar campo urgencia solo para Queja y Reclamo
    if (tipo === 'Queja' || tipo === 'Reclamo') {
      $('#campoUrgencia').removeClass('d-none');
    } else {
      $('#campoUrgencia').addClass('d-none');
    }
    // Mostrar campo sugerencia detalle solo para Sugerencia
    if (tipo === 'Sugerencia') {
      $('#campoSugerenciaDetalle').removeClass('d-none');
    } else {
      $('#campoSugerenciaDetalle').addClass('d-none');
    }
  }

  /* =====================================================
     File Upload — drag-and-drop simulado
     ===================================================== */
  const MAX_FILES = 5;
  const MAX_SIZE  = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const ALLOWED_EXT   = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];

  let uploadedFiles = [];

  const $dropZone   = $('#dropZone');
  const $fileInput  = $('#archivoInput');

  $dropZone.on('click', function () { $fileInput.trigger('click'); });
  $dropZone.on('dragover', function (e) { e.preventDefault(); $dropZone.addClass('drag-over'); });
  $dropZone.on('dragleave drop', function ()  { $dropZone.removeClass('drag-over'); });
  $dropZone.on('drop', function (e) {
    e.preventDefault();
    const files = e.originalEvent.dataTransfer.files;
    handleFiles(files);
  });
  $dropZone.on('keypress', function (e) { if (e.which === 13 || e.which === 32) $fileInput.trigger('click'); });
  $fileInput.on('change', function () { handleFiles(this.files); $(this).val(''); });

  function handleFiles(files) {
    const errors = [];
    Array.from(files).forEach(file => {
      if (uploadedFiles.length >= MAX_FILES) {
        errors.push(`Límite de ${MAX_FILES} archivos alcanzado.`);
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.some(e => file.name.toLowerCase().endsWith(e))) {
        errors.push(`"${file.name}": tipo no permitido. Solo PDF, JPG, PNG, DOCX.`);
        return;
      }
      if (file.size > MAX_SIZE) {
        errors.push(`"${file.name}": supera el límite de 5 MB.`);
        return;
      }
      if (uploadedFiles.some(f => f.name === file.name)) {
        errors.push(`"${file.name}": ya fue agregado.`);
        return;
      }
      uploadedFiles.push({ name: file.name, size: formatFileSize(file.size), type: file.type });
    });

    if (errors.length) {
      errors.forEach(e => showToast(e, 'warning', 5000));
    }
    renderFileList();
  }

  function formatFileSize(bytes) {
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1024*1024)  return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/1024/1024).toFixed(2) + ' MB';
  }

  function renderFileList() {
    if (!uploadedFiles.length) {
      $('#fileList').html('');
      return;
    }
    const html = uploadedFiles.map((f, idx) => {
      let icon = 'bi-file-earmark';
      if (f.type === 'application/pdf')     icon = 'bi-file-earmark-pdf text-danger';
      else if (f.type?.startsWith('image')) icon = 'bi-file-earmark-image text-success';
      else if (f.type?.includes('word'))    icon = 'bi-file-earmark-word text-primary';
      return `
        <div class="file-item">
          <i class="bi ${icon}"></i>
          <span class="file-name">${f.name}</span>
          <span class="file-size">${f.size}</span>
          <button type="button" class="btn-remove-file" data-idx="${idx}" aria-label="Eliminar ${f.name}">
            <i class="bi bi-x" aria-hidden="true"></i>
          </button>
        </div>`;
    }).join('');
    $('#fileList').html(html);
  }

  $(document).on('click', '.btn-remove-file', function () {
    const idx = parseInt($(this).data('idx'));
    uploadedFiles.splice(idx, 1);
    renderFileList();
  });

  /* =====================================================
     Validación del formulario
     ===================================================== */
  function validateField($field) {
    const val = $field.val()?.trim();
    if ($field.prop('required') && !val) {
      $field.addClass('is-invalid').removeClass('is-valid');
      return false;
    }
    if ($field.attr('type') === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      $field.addClass('is-invalid').removeClass('is-valid');
      return false;
    }
    if ($field.attr('type') === 'tel' && val && !/^[0-9]{7,15}$/.test(val.replace(/\s/g,''))) {
      $field.addClass('is-invalid').removeClass('is-valid');
      return false;
    }
    $field.addClass('is-valid').removeClass('is-invalid');
    return true;
  }

  // Validar en tiempo real
  $('#fpqrsForm').find('input, select, textarea').on('blur input change', function () {
    if ($(this).attr('type') === 'checkbox') return;
    validateField($(this));
  });

  /* =====================================================
     Submit
     ===================================================== */
  $('#fpqrsForm').on('submit', function (e) {
    e.preventDefault();

    // Validar todos los campos requeridos
    let valid = true;
    $(this).find('[required]').each(function () {
      if ($(this).attr('type') === 'checkbox') {
        if (!$(this).is(':checked')) {
          $(this).closest('.form-check').find('.invalid-feedback').show();
          valid = false;
        } else {
          $(this).closest('.form-check').find('.invalid-feedback').hide();
        }
      } else {
        if (!validateField($(this))) valid = false;
      }
    });

    if (!valid) {
      showToast('Por favor corrige los errores en el formulario.', 'danger');
      $(this).find('.is-invalid').first()[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const $btn = $(this).find('[type=submit]');
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Radicando caso…');

    setTimeout(() => {
      const radicadoId = generateRadicadoId();
      const nuevoCaso  = buildCaso(radicadoId);
      saveCasoNuevo(nuevoCaso);
      $btn.prop('disabled', false).html('<i class="bi bi-pencil-square me-2"></i>Radicar caso FPQRS');
      mostrarConfirmacion(radicadoId, nuevoCaso);
    }, 900);
  });

  function buildCaso(id) {
    return {
      id:            id,
      tipo:          $('#fpqrsTipo').val(),
      asunto:        $('#fpqrsDescripcion').val().substring(0, 60) + '…',
      servicio:      $('#fpqrsServicio').val(),
      categoria:     $('#fpqrsCategoria').val(),
      subcategoria:  $('#fpqrsSubcategoria').val(),
      estado:        'Radicado',
      prioridad:     'Normal',
      semaforo:      'verde',
      fechaCreacion: new Date().toISOString(),
      fechaLimite:   new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
      solicitante:   $('#fpqrsNombre').val().trim(),
      email:         $('#fpqrsEmail').val().trim(),
      telefono:      $('#fpqrsTelefono').val().trim(),
      identificacion:`${$('#fpqrsTipoId').val()} ${$('#fpqrsNumId').val().trim()}`,
      direccion:     $('#fpqrsDireccion').val().trim(),
      responsable:   'Por asignar',
      descripcion:   $('#fpqrsDescripcion').val().trim(),
      comentarios:   [],
      adjuntos:      uploadedFiles.map(f => ({ nombre: f.name, tipo: f.type, tamano: f.size })),
      historial: [
        { fecha: new Date().toISOString(), accion: 'Caso radicado por portal ciudadano', usuario: 'Sistema' }
      ]
    };
  }

  function mostrarConfirmacion(radicadoId, caso) {
    $('#confirmRadicadoId').text(radicadoId);
    $('#confirmFecha').text(formatDateTime(caso.fechaCreacion));
    $('#confirmLimite').text(formatDate(caso.fechaLimite));
    $('#confirmTipo').html(getBadgeTipo(caso.tipo));
    $('#confirmEmail').text(caso.email);
    new bootstrap.Modal($('#modalConfirmacion')[0]).show();
  }

  // Después de confirmar → bandeja
  $('#btnIrBandeja').on('click', function () {
    window.location.href = 'bandeja-casos.html';
  });

  // Radicar otro
  $('#btnRadicarOtro').on('click', function () {
    bootstrap.Modal.getInstance($('#modalConfirmacion')[0]).hide();
    $('#fpqrsForm')[0].reset();
    uploadedFiles = [];
    renderFileList();
    resetSelect($('#fpqrsServicio'), 'Selecciona un servicio');
    resetSelect($('#fpqrsCategoria'), 'Selecciona una categoría');
    resetSelect($('#fpqrsSubcategoria'), 'Selecciona una subcategoría');
    $('#fpqrsForm').find('.is-invalid,.is-valid').removeClass('is-invalid is-valid');
    $('#campoUrgencia, #campoSugerenciaDetalle').addClass('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

}); // end document.ready
