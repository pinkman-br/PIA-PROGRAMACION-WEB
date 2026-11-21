// Utilidades para mostrar automóviles (responsable: Persona 2)
// Las usan el Inicio (Persona 2) y el Catálogo y Favoritos (Persona 3).
//
//   formatoPrecio(489900)    → "$489,900"
//   formatoKm(21500)         → "21,500 km"
//   tarjetaAuto(auto)        → HTML de una tarjeta con foto, nombre, precio y "Ver más"
//   tarjetaAuto(auto, extra) → igual, con botones extra al final (por ejemplo el de favorito)

const IMAGEN_SIN_FOTO = '/img/sin-foto.svg';

function escAuto(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatoPrecio(precio) {
  return '$' + Number(precio).toLocaleString('es-MX', { maximumFractionDigits: 0 });
}

function formatoKm(km) {
  return Number(km).toLocaleString('es-MX') + ' km';
}

// La base guarda rutas como "img/autos/archivo.jpg"; se les pone "/" al inicio
function rutaImagen(auto) {
  if (!auto.imagen_url) return IMAGEN_SIN_FOTO;
  return auto.imagen_url.startsWith('/') || auto.imagen_url.startsWith('http') ? auto.imagen_url : '/' + auto.imagen_url;
}

function tarjetaAuto(auto, extra = '') {
  const nombre = `${auto.marca} ${auto.modelo}`;
  return `
    <article class="tarjeta-auto">
      <img src="${escAuto(rutaImagen(auto))}" alt="${escAuto(nombre)} ${escAuto(auto.anio)}" loading="lazy"
           onerror="this.onerror=null; this.src='${IMAGEN_SIN_FOTO}'">
      <div class="cuerpo">
        <h3 class="nombre h6">${escAuto(nombre)} ${escAuto(auto.anio)}</h3>
        <span class="version">${escAuto(auto.version || '')}${auto.color ? ' · ' + escAuto(auto.color) : ''}</span>
        <p class="precio">${formatoPrecio(auto.precio)}</p>
        <span class="datos">${formatoKm(auto.kilometraje)}${auto.transmision ? ' · ' + escAuto(auto.transmision) : ''}${auto.combustible ? ' · ' + escAuto(auto.combustible) : ''}</span>
        <div class="acciones d-flex gap-2">
          <a href="/detalle?id=${Number(auto.id_automovil)}" class="btn btn-sm btn-outline-verde flex-grow-1">Ver más</a>
          ${extra}
        </div>
      </div>
    </article>`;
}
