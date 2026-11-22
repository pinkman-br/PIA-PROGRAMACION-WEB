// Botón de favorito (corazón) para Catálogo y Detalle (responsable: Persona 3)
//
// Uso:
//   botonFavorito(idAutomovil)          → HTML del botón con solo el corazón
//   botonFavorito(idAutomovil, true)    → con texto "Favorito" / "En favoritos"
//   await favoritosListos;              → antes de dibujar, para que los corazones salgan marcados
//
// Necesita antes: api.js y menu-sesion.js (de ahí sale "sesionActual").

const estadoFavoritos = { usuario: null, ids: new Set() };

// Al cargar la página: si hay sesión, se piden los id de sus favoritos
const favoritosListos = sesionActual.then(async (usuario) => {
  estadoFavoritos.usuario = usuario;
  if (!usuario) return;
  try {
    estadoFavoritos.ids = new Set(await api.get('/api/favoritos/ids'));
  } catch (e) {
    estadoFavoritos.ids = new Set();
  }
});

function botonFavorito(idAutomovil, conTexto = false) {
  const activo = estadoFavoritos.ids.has(Number(idAutomovil));
  const texto = conTexto ? `<span class="ms-1">${activo ? 'En favoritos' : 'Favorito'}</span>` : '';
  return `
    <button type="button" class="btn btn-sm btn-favorito${activo ? ' activo' : ''}" data-favorito="${Number(idAutomovil)}"
            data-con-texto="${conTexto}" aria-pressed="${activo}"
            aria-label="${activo ? 'Quitar de favoritos' : 'Guardar en favoritos'}" title="${activo ? 'Quitar de favoritos' : 'Guardar en favoritos'}">
      <span class="corazon" aria-hidden="true">${activo ? '♥' : '♡'}</span>${texto}
    </button>`;
}

// Mensaje pequeño abajo de la pantalla
function avisoFlotante(texto) {
  let caja = document.getElementById('avisoFlotante');
  if (!caja) {
    caja = document.createElement('div');
    caja.id = 'avisoFlotante';
    caja.className = 'aviso-flotante';
    caja.setAttribute('role', 'status');
    document.body.appendChild(caja);
  }
  caja.textContent = texto;
  caja.classList.add('visible');
  clearTimeout(caja._timer);
  caja._timer = setTimeout(() => caja.classList.remove('visible'), 2200);
}

// Un solo "escuchador" para todos los corazones de la página
document.addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-favorito]');
  if (!boton) return;

  // Sin sesión: se manda a Iniciar sesión y después regresa a esta misma página
  if (!estadoFavoritos.usuario) {
    location.href = '/login?volver=' + encodeURIComponent(location.pathname + location.search);
    return;
  }

  const id = Number(boton.dataset.favorito);
  const estaba = estadoFavoritos.ids.has(id);
  boton.disabled = true;
  try {
    const { mensaje } = estaba
      ? await api.delete('/api/favoritos/' + id)
      : await api.post('/api/favoritos/' + id);
    if (estaba) estadoFavoritos.ids.delete(id); else estadoFavoritos.ids.add(id);

    // Se redibujan todos los corazones de ese auto que haya en la página
    document.querySelectorAll(`[data-favorito="${id}"]`).forEach((b) => {
      b.outerHTML = botonFavorito(id, b.dataset.conTexto === 'true');
    });
    avisoFlotante(mensaje);
  } catch (err) {
    boton.disabled = false;
    avisoFlotante(err.message);
  }
});
