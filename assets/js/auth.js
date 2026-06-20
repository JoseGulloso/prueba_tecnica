'use strict';

$(document).ready(function () {

  /* =====================================================
     Toggle login ↔ registro
     ===================================================== */
  const $loginSection    = $('#loginSection');
  const $registerSection = $('#registerSection');

  function showLogin() {
    $registerSection.addClass('login-register-wrap').removeClass('show').attr('aria-hidden', 'true');
    $loginSection.show();
    window.scrollTo({ top: 0 });
  }

  function showRegister() {
    $loginSection.hide();
    $registerSection.addClass('login-register-wrap show').attr('aria-hidden', 'false');
    window.scrollTo({ top: 0 });
  }

  $('#goToRegister').on('click', function (e) { e.preventDefault(); showRegister(); });
  $('#goToLogin').on('click',    function (e) { e.preventDefault(); showLogin(); });

  /* =====================================================
     Mostrar / ocultar contraseña
     ===================================================== */
  $(document).on('click', '.btn-toggle-pw', function () {
    const $input = $($(this).data('target'));
    const isPass = $input.attr('type') === 'password';
    $input.attr('type', isPass ? 'text' : 'password');
    $(this).find('i').toggleClass('bi-eye bi-eye-slash');
    $(this).attr('aria-label', isPass ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });

  /* =====================================================
     Submit — Login
     ===================================================== */
  $('#loginForm').on('submit', function (e) {
    e.preventDefault();

    const email    = $('#loginEmail').val().trim();
    const password = $('#loginPassword').val();

    if (!email || !password) {
      showAuthAlert('Por favor completa todos los campos.', 'warning');
      return;
    }

    const $btn = $(this).find('[type=submit]');
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Verificando credenciales...');

    $.getJSON('./data/usuarios.json')
      .done(function (usuarios) {
        const user = usuarios.find(u =>
          u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (user) {
          setSessionUser(user);
          $btn.html('<i class="bi bi-check-circle me-2"></i>Acceso concedido');
          setTimeout(() => {
            window.location.href = './pages/bandeja-casos.html';
          }, 500);
        } else {
          $btn.prop('disabled', false).html('Ingresar al sistema');
          showAuthAlert('Credenciales incorrectas. Verifica tu correo y contraseña.', 'danger');
          $('#loginPassword').val('');
        }
      })
      .fail(function () {
        $btn.prop('disabled', false).html('Ingresar al sistema');
        showAuthAlert('Error al cargar los datos. Abre el proyecto con un servidor local (Live Server).', 'danger');
      });
  });

  /* =====================================================
     Submit — Registro
     ===================================================== */
  $('#registerForm').on('submit', function (e) {
    e.preventDefault();

    const nombre   = $('#regNombre').val().trim();
    const email    = $('#regEmail').val().trim();
    const password = $('#regPassword').val();
    const confirm  = $('#regConfirmPassword').val();

    if (!nombre || !email || !password || !confirm) {
      showAuthAlert('Por favor completa todos los campos.', 'warning');
      return;
    }
    if (password !== confirm) {
      showAuthAlert('Las contraseñas no coinciden.', 'warning');
      return;
    }

    const $btn = $(this).find('[type=submit]');
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Creando cuenta...');

    const newUser = {
      id:       Date.now(),
      nombre:   nombre,
      email:    email,
      password: password,
      rol:      'Operador',
      avatar:   nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    };

    setTimeout(() => {
      setSessionUser(newUser);
      $btn.html('<i class="bi bi-check-circle me-2"></i>Cuenta creada');
      showAuthAlert('¡Registro exitoso! Redirigiendo...', 'success');
      setTimeout(() => {
        window.location.href = './pages/bandeja-casos.html';
      }, 1000);
    }, 800);
  });

  /* =====================================================
     Tooltips Bootstrap
     ===================================================== */
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
    new bootstrap.Tooltip(el);
  });

  /* =====================================================
     Credenciales demo
     ===================================================== */
  $('.btn-demo-login').on('click', function () {
    const email = $(this).data('email');
    const pass  = $(this).data('pass');
    showLogin();
    $('#loginEmail').val(email);
    $('#loginPassword').val(pass);
  });

  /* =====================================================
     Alert de autenticación
     ===================================================== */
  function showAuthAlert(msg, type) {
    const $alert = $(`<div class="alert alert-${type} alert-dismissible fade show mb-4" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`);
    $('#authAlertArea').empty().append($alert);
  }

  /* =====================================================
     Redirigir si ya hay sesión activa
     ===================================================== */
  if (getSessionUser()) {
    window.location.href = './pages/bandeja-casos.html';
  }
});
