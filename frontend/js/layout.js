// Menú y pie de página compartidos del sitio público (responsable: Persona 2)
//
// Cómo usarlo en cualquier página pública:
//   <header id="encabezado"></header>     ← aquí se dibuja el menú
//   ... contenido de la página ...
//   <footer id="pie"></footer>            ← aquí se dibuja el pie de página
//
//   <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
//   <script src="/js/api.js"></script>
//   <script src="/js/layout.js"></script>        ← primero el menú...
//   <script src="/js/menu-sesion.js"></script>   ← ...después la parte de sesión (Persona 1)
//
// El menú deja dentro el <ul id="menu-sesion">, que llena menu-sesion.js según quién entró.

const NOMBRE_SITIO = 'SEMINUEVOS';

const ENLACES_SITIO = [
  { texto: 'Inicio', ruta: '/' },
  { texto: 'Catálogo', ruta: '/catalogo' },
  { texto: 'Nosotros', ruta: '/nosotros' },
  { texto: 'Contacto', ruta: '/contacto' }
];

function dibujarEncabezado() {
  const encabezado = document.getElementById('encabezado');
  if (!encabezado) return;

  const actual = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
  const enlaces = ENLACES_SITIO.map(({ texto, ruta }) =>
    `<li class="nav-item"><a class="nav-link${actual === ruta ? ' active' : ''}" href="${ruta}">${texto}</a></li>`
  ).join('');

  encabezado.innerHTML = `
    <nav class="navbar navbar-expand-md navbar-dark menu-sitio">
      <div class="container">
        <a class="navbar-brand" href="/">${NOMBRE_SITIO}</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuSitio"
                aria-controls="menuSitio" aria-expanded="false" aria-label="Abrir menú">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="menuSitio">
          <ul class="navbar-nav me-auto">${enlaces}</ul>
          <ul class="navbar-nav align-items-md-center" id="menu-sesion"></ul>
        </div>
      </div>
    </nav>`;
}

function dibujarPie() {
  const pie = document.getElementById('pie');
  if (!pie) return;

  pie.className = 'pie-sitio mt-5';
  pie.innerHTML = `
    <div class="container py-4">
      <div class="row g-4">
        <div class="col-md-5">
          <h2>${NOMBRE_SITIO}</h2>
          <p class="mb-0">Autos seminuevos revisados, con información clara y prueba de manejo antes de decidir.</p>
        </div>
        <div class="col-6 col-md-3">
          <h2>Sitio</h2>
          <ul class="list-unstyled mb-0">
            ${ENLACES_SITIO.map(({ texto, ruta }) => `<li><a href="${ruta}">${texto}</a></li>`).join('')}
          </ul>
        </div>
        <div class="col-6 col-md-4">
          <h2>Visítanos</h2>
          <p class="mb-1">Lunes a viernes: 9:00 a 19:00</p>
          <p class="mb-1">Sábado: 9:00 a 14:00</p>
          <p class="mb-0"><a href="/contacto">Ver ubicación y teléfono</a></p>
        </div>
      </div>
      <hr class="border-secondary my-3">
      <p class="small mb-0">© ${new Date().getFullYear()} ${NOMBRE_SITIO} · PIA de Programación Web, FIME UANL · Equipo 1</p>
    </div>`;
}

dibujarEncabezado();
dibujarPie();
