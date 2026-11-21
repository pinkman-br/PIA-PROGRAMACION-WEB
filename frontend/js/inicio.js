// Lógica de la pantalla de Inicio (responsable: Persona 2)
// Carga las unidades destacadas desde GET /api/automoviles/destacados

async function cargarDestacadas() {
  const contenedor = document.getElementById('destacadas');
  try {
    const autos = await api.get('/api/automoviles/destacados');
    if (autos.length === 0) {
      contenedor.innerHTML = '<p class="text-secondary">Por ahora no hay unidades destacadas. <a href="/catalogo">Ver catálogo</a></p>';
      return;
    }
    contenedor.innerHTML = autos
      .map((auto) => `<div class="col-sm-6 col-lg-4">${tarjetaAuto(auto)}</div>`)
      .join('');
  } catch (err) {
    contenedor.innerHTML = '<p class="text-danger">No se pudieron cargar las unidades. Intenta de nuevo más tarde.</p>';
  }
}

cargarDestacadas();
