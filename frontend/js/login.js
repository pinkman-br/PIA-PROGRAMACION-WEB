// Lógica de la pantalla Iniciar sesión (responsable: Persona 1)

const RUTA_PANEL_ADMIN = '/admin/';   // la pantalla del panel la hace Persona 4 (frontend/admin/index.html)

const form = document.getElementById('formLogin');
const aviso = document.getElementById('aviso');
const btnEntrar = document.getElementById('btnEntrar');

function mostrarAviso(texto, tipo) {
  aviso.textContent = texto;
  aviso.className = 'alert alert-' + tipo;
}

// A dónde ir después de entrar. Ej.: /login?volver=/detalle?id=3 regresa al auto que estaba viendo.
// Solo se aceptan rutas de esta misma página (empiezan con "/" pero no con "//").
function destinoDespuesDeEntrar(usuario) {
  if (usuario.id_rol === 1) return RUTA_PANEL_ADMIN;
  const volver = new URLSearchParams(location.search).get('volver');
  if (volver && volver.startsWith('/') && !volver.startsWith('//')) return volver;
  return '/';
}

// Mensaje cuando viene de crear su cuenta
if (new URLSearchParams(location.search).get('registrado') === '1') {
  mostrarAviso('Tu cuenta se creó correctamente. Ya puedes iniciar sesión.', 'success');
}

// Si ya tiene sesión iniciada, no tiene caso mostrar el formulario
api.get('/api/auth/sesion').then(({ usuario }) => {
  if (usuario) location.href = destinoDespuesDeEntrar(usuario);
}).catch(() => {});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validación en el navegador (campos vacíos o correo mal escrito)
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  btnEntrar.disabled = true;
  btnEntrar.textContent = 'Entrando...';
  try {
    const { usuario } = await api.post('/api/auth/login', {
      correo: form.correo.value,
      contrasena: form.contrasena.value
    });
    location.href = destinoDespuesDeEntrar(usuario);
  } catch (err) {
    mostrarAviso(err.message, 'danger');
    form.contrasena.value = '';
    btnEntrar.disabled = false;
    btnEntrar.textContent = 'Entrar';
  }
});
