// Menú y protección de las pantallas del administrador (responsable: Persona 1)
//
// Cómo usarlo en una pantalla de /admin/ (Persona 4 y Persona 5 también):
//   <nav id="menu-admin"></nav>                ← donde va el menú
//   <script src="/js/api.js"></script>
//   <script src="/js/menu-admin.js"></script>
//   <script>
//     sesionAdmin.then((admin) => { /* aquí empieza su pantalla; admin = usuario en sesión */ });
//   </script>
//
// Si quien entra no es administrador, lo manda a Iniciar sesión y la pantalla no se carga.

const ENLACES_ADMIN = [
  { texto: 'Panel', ruta: '/admin/' },
  { texto: 'Automóviles', ruta: '/admin/automoviles' },
  { texto: 'Citas', ruta: '/admin/citas' },
  { texto: 'Usuarios', ruta: '/admin/usuarios' }
];

function dibujarMenuAdmin(admin) {
  const contenedor = document.getElementById('menu-admin');
  if (!contenedor) return;

  const actual = location.pathname.replace(/\.html$/, '');
  const enlaces = ENLACES_ADMIN.map(({ texto, ruta }) => {
    const activo = actual === ruta || (ruta === '/admin/' && actual === '/admin/index');
    return `<li class="nav-item"><a class="nav-link${activo ? ' active' : ''}" href="${ruta}">${texto}</a></li>`;
  }).join('');

  contenedor.className = 'navbar navbar-expand-md navbar-dark menu-admin';
  contenedor.innerHTML = `
    <div class="container">
      <a class="navbar-brand" href="/admin/">SEMINUEVOS <small class="fw-normal opacity-75">Admin</small></a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuAdminLinks"
              aria-controls="menuAdminLinks" aria-expanded="false" aria-label="Abrir menú">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="menuAdminLinks">
        <ul class="navbar-nav ms-auto">
          ${enlaces}
          <li class="nav-item"><a class="nav-link" href="/">Ver sitio</a></li>
          <li class="nav-item"><a class="nav-link" href="#" id="btnSalirAdmin">Salir</a></li>
        </ul>
      </div>
    </div>`;

  document.getElementById('btnSalirAdmin').addEventListener('click', async (e) => {
    e.preventDefault();
    await api.post('/api/auth/logout').catch(() => {});
    location.href = '/login';
  });
}

// Revisa la sesión: solo continúa si es administrador (id_rol 1)
const sesionAdmin = (async () => {
  const { usuario } = await api.get('/api/auth/sesion');
  if (!usuario || usuario.id_rol !== 1) {
    location.href = '/login?volver=' + encodeURIComponent(location.pathname);
    return new Promise(() => {}); // la pantalla nunca continúa
  }
  dibujarMenuAdmin(usuario);
  return usuario;
})();
