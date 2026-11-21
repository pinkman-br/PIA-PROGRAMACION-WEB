// Lógica de la pantalla Detalle del automóvil (responsable: Persona 3)
// Usa GET /api/automoviles/:id (Persona 2). "Agendar prueba de manejo" abre la pantalla de Persona 5.

const contenido = document.getElementById('contenido');
const idAutomovil = Number(new URLSearchParams(location.search).get('id'));

function mostrarError(texto) {
  contenido.innerHTML = `
    <div class="tarjeta p-4 text-center">
      <p class="mb-3">${escAuto(texto)}</p>
      <a href="/catalogo" class="btn btn-verde">Ir al catálogo</a>
    </div>`;
}

// Fila de la ficha técnica; si el dato no existe, no se muestra la fila
function dato(nombre, valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  return `<dt class="col-5">${nombre}</dt><dd class="col-7">${escAuto(valor)}</dd>`;
}

function dibujarDetalle(auto) {
  const nombre = `${nombreAuto(auto)} ${auto.anio}`;
  const disponible = auto.estatus === 'Disponible';
  document.title = `${nombre} | Seminuevos`;

  // Para agendar se necesita sesión: sin sesión se pasa por Iniciar sesión y luego regresa a agendar
  const rutaAgendar = '/agendar?id=' + auto.id_automovil;
  const enlaceAgendar = estadoFavoritos.usuario ? rutaAgendar : '/login?volver=' + encodeURIComponent(rutaAgendar);

  contenido.innerHTML = `
    <div class="row g-4 g-lg-5">
      <div class="col-lg-6">
        <img class="detalle-foto" src="${escAuto(rutaImagen(auto))}" alt="${escAuto(nombre)}"
             onerror="this.onerror=null; this.src='${IMAGEN_SIN_FOTO}'">
      </div>
      <div class="col-lg-6">
        <h2 class="h3 fw-bold mb-1">${escAuto(nombre)}</h2>
        <p class="text-secondary mb-2">${escAuto(auto.version || '')}</p>
        ${disponible
          ? '<span class="badge text-bg-success mb-2">Disponible</span>'
          : '<span class="badge text-bg-secondary mb-2">Vendido</span>'}
        <p class="detalle-precio mb-3">${formatoPrecio(auto.precio)}</p>

        <dl class="row detalle-datos mb-4">
          ${dato('Kilometraje', formatoKm(auto.kilometraje))}
          ${dato('Transmisión', auto.transmision)}
          ${dato('Combustible', auto.combustible)}
          ${dato('Color', auto.color)}
          ${dato('Motor', auto.motor)}
          ${dato('Carrocería', auto.carroceria)}
          ${dato('Puertas', auto.puertas)}
          ${dato('Pasajeros', auto.pasajeros)}
          ${dato('Estatus', auto.estatus)}
        </dl>

        <div class="d-flex flex-wrap gap-2">
          ${disponible
            ? `<a href="${enlaceAgendar}" class="btn btn-verde btn-lg flex-grow-1">Agendar prueba de manejo</a>`
            : '<button class="btn btn-secondary btn-lg flex-grow-1" disabled>Unidad vendida</button>'}
          ${botonFavorito(auto.id_automovil, true).replace('btn-sm', 'btn-lg')}
        </div>
        ${estadoFavoritos.usuario ? '' : '<p class="small text-secondary mt-2 mb-0">Necesitas iniciar sesión para agendar o guardar en favoritos.</p>'}
      </div>
    </div>
    ${auto.descripcion ? `<div class="tarjeta p-4 mt-4"><h2 class="titulo-seccion">Descripción</h2><p class="mb-0">${escAuto(auto.descripcion)}</p></div>` : ''}`;
}

(async () => {
  if (!Number.isInteger(idAutomovil) || idAutomovil <= 0) {
    mostrarError('No se indicó qué automóvil mostrar.');
    return;
  }
  try {
    const [auto] = await Promise.all([api.get('/api/automoviles/' + idAutomovil), favoritosListos]);
    dibujarDetalle(auto);
  } catch (err) {
    mostrarError(err.status === 404 ? 'Ese automóvil no existe o ya no está publicado.' : 'No se pudo cargar el automóvil.');
  }
})();
