// Lógica de la pantalla Favoritos (responsable: Persona 3)
// GET /api/favoritos para la lista y DELETE /api/favoritos/:id para "Quitar"

const lista = document.getElementById('listaFavoritos');
let favoritos = [];

function dibujarFavoritos() {
  if (favoritos.length === 0) {
    lista.innerHTML = `
      <div class="col-12"><div class="tarjeta p-4 text-center">
        <p class="mb-3">Todavía no guardas ningún automóvil. Usa el corazón ♡ del catálogo para guardarlos aquí.</p>
        <a href="/catalogo" class="btn btn-verde">Ir al catálogo</a>
      </div></div>`;
    return;
  }

  lista.innerHTML = favoritos.map((auto) => {
    const vendido = auto.estatus !== 'Disponible';
    const quitar = `<button type="button" class="btn btn-sm btn-link text-secondary text-decoration-none"
                      data-quitar="${auto.id_automovil}">Quitar ♡</button>`;
    let tarjeta = tarjetaAuto(auto, quitar);
    if (vendido) {
      // Si el auto se vendió, se avisa en la tarjeta
      tarjeta = tarjeta.replace('class="tarjeta-auto"', 'class="tarjeta-auto vendido"')
        .replace('<p class="precio">', '<span class="badge text-bg-secondary align-self-start mt-2">Vendido</span><p class="precio">');
    }
    return `<div class="col-sm-6 col-lg-4">${tarjeta}</div>`;
  }).join('');
}

// "Quitar": borra solo de favoritos; el auto sigue en el catálogo
lista.addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-quitar]');
  if (!boton) return;
  const id = Number(boton.dataset.quitar);
  boton.disabled = true;
  try {
    const { mensaje } = await api.delete('/api/favoritos/' + id);
    favoritos = favoritos.filter((a) => a.id_automovil !== id);
    dibujarFavoritos();
    avisoFlotante(mensaje);
  } catch (err) {
    boton.disabled = false;
    avisoFlotante(err.message);
  }
});

// Solo con sesión: si no hay, se manda a Iniciar sesión y luego regresa aquí
sesionActual.then(async (usuario) => {
  if (!usuario) {
    location.href = '/login?volver=/favoritos';
    return;
  }
  try {
    favoritos = await api.get('/api/favoritos');
    dibujarFavoritos();
  } catch (err) {
    lista.innerHTML = '<p class="text-danger">No se pudieron cargar tus favoritos.</p>';
  }
});
