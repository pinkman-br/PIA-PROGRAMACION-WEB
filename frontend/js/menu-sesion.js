// Parte del menú que cambia según quién entró (responsable: Persona 1)
//
//   Visitante      → "Iniciar sesión" y "Crear cuenta"
//   Usuario        → "Favoritos", "Mis citas" y su nombre (Mi perfil / Cerrar sesión)
//   Administrador  → "Panel admin" y su nombre (Mi perfil / Cerrar sesión)
//
// Cómo usarlo (Persona 2 lo pone dentro del menú compartido):
//   <ul class="navbar-nav ms-auto" id="menu-sesion"></ul>     ← donde van estas opciones
//   <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
//   <script src="/js/api.js"></script>
//   <script src="/js/menu-sesion.js"></script>
//
// Otras pantallas pueden saber quién está en sesión sin volver a preguntar al servidor:
//   sesionActual.then((usuario) => { if (!usuario) { /* visitante */ } });
// (por ejemplo, el botón de favorito de Persona 3 o Agendar prueba de Persona 5)

function escMenu(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function opcionesVisitante() {
  const volver = encodeURIComponent(location.pathname + location.search);
  return `
    <li class="nav-item"><a class="nav-link" href="/login?volver=${volver}">Iniciar sesión</a></li>
    <li class="nav-item ms-md-2"><a class="btn btn-sm btn-light mt-1" href="/registro">Crear cuenta</a></li>`;
}

function opcionesUsuario(usuario) {
  const esAdmin = usuario.id_rol === 1;
  const primerNombre = escMenu(usuario.nombre_completo.split(' ')[0]);
  const enlaces = esAdmin
    ? '<li class="nav-item"><a class="nav-link" href="/admin/">Panel admin</a></li>'
    : `<li class="nav-item"><a class="nav-link" href="/favoritos">Favoritos</a></li>
       <li class="nav-item"><a class="nav-link" href="/mis-citas">Mis citas</a></li>`;
  return `
    ${enlaces}
    <li class="nav-item dropdown">
      <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
        ${primerNombre}
      </a>
      <ul class="dropdown-menu dropdown-menu-end">
        <li><span class="dropdown-item-text small text-secondary">${escMenu(usuario.rol)}</span></li>
        <li><a class="dropdown-item" href="/perfil">Mi perfil</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="#" data-salir>Cerrar sesión</a></li>
      </ul>
    </li>`;
}

// Marca como activo el enlace de la página actual
function marcarActivo(contenedor) {
  const actual = location.pathname.replace(/\.html$/, '');
  contenedor.querySelectorAll('a.nav-link').forEach((a) => {
    if (a.getAttribute('href') === actual) a.classList.add('active');
  });
}

const sesionActual = (async () => {
  let usuario = null;
  try {
    ({ usuario } = await api.get('/api/auth/sesion'));
  } catch (e) {
    usuario = null; // si el servidor no responde, se muestra como visitante
  }

  const contenedor = document.getElementById('menu-sesion');
  if (contenedor) {
    contenedor.innerHTML = usuario ? opcionesUsuario(usuario) : opcionesVisitante();
    marcarActivo(contenedor);

    const salir = contenedor.querySelector('[data-salir]');
    if (salir) {
      salir.addEventListener('click', async (e) => {
        e.preventDefault();
        await api.post('/api/auth/logout').catch(() => {});
        location.href = '/';
      });
    }
  }
  return usuario;
})();
