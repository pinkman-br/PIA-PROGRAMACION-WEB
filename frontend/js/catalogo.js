// Lógica de la pantalla Catálogo (responsable: Persona 3)
// Usa la API de Persona 2: GET /api/marcas y GET /api/automoviles con filtros

const form = document.getElementById('formFiltros');
const resultados = document.getElementById('resultados');
const conteo = document.getElementById('conteo');
const CAMPOS = ['q', 'marca', 'precioMax', 'anioMin', 'orden'];

// Llena el selector de marcas con las que tienen unidades disponibles
async function cargarMarcas() {
  try {
    const marcas = await api.get('/api/marcas');
    form.marca.insertAdjacentHTML('beforeend', marcas
      .map((m) => `<option value="${escAuto(m.nombre)}">${escAuto(m.nombre)} (${m.disponibles})</option>`)
      .join(''));
  } catch (e) {
    // si falla, el filtro se queda solo con "Todas"
  }
}

// Pone en el formulario los filtros que vengan en la URL (ej. /catalogo?q=tiguan desde el Inicio)
function leerFiltrosDeLaUrl() {
  const params = new URLSearchParams(location.search);
  CAMPOS.forEach((campo) => {
    if (params.has(campo)) form[campo].value = params.get(campo);
  });
}

// Arma "?q=...&marca=..." solo con los filtros que tienen valor
function filtrosComoTexto() {
  const params = new URLSearchParams();
  CAMPOS.forEach((campo) => {
    const valor = form[campo].value.trim();
    if (valor && !(campo === 'orden' && valor === 'recientes')) params.set(campo, valor);
  });
  return params.toString();
}

async function buscar() {
  const filtros = filtrosComoTexto();
  // La URL guarda los filtros: si recargas o compartes el enlace, se mantienen
  history.replaceState(null, '', '/catalogo' + (filtros ? '?' + filtros : ''));

  resultados.innerHTML = '<p class="text-secondary">Buscando...</p>';
  try {
    const [autos] = await Promise.all([api.get('/api/automoviles?' + filtros), favoritosListos]);
    conteo.textContent = autos.length === 1 ? '1 unidad disponible' : `${autos.length} unidades disponibles`;

    if (autos.length === 0) {
      resultados.innerHTML = `
        <div class="col-12"><div class="tarjeta p-4 text-center">
          <p class="mb-2">No encontramos unidades con esos filtros.</p>
          <button type="button" class="btn btn-outline-verde btn-sm" onclick="limpiarFiltros()">Ver todas las unidades</button>
        </div></div>`;
      return;
    }
    resultados.innerHTML = autos
      .map((auto) => `<div class="col-sm-6 col-lg-4">${tarjetaAuto(auto, botonFavorito(auto.id_automovil))}</div>`)
      .join('');
  } catch (err) {
    conteo.textContent = '';
    resultados.innerHTML = '<p class="text-danger">No se pudo cargar el catálogo. Intenta de nuevo más tarde.</p>';
  }
}

function limpiarFiltros() {
  form.reset();
  buscar();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  buscar();
});
// Al cambiar un selector se busca solo, sin tener que dar "Buscar"
['marca', 'precioMax', 'anioMin', 'orden'].forEach((campo) => form[campo].addEventListener('change', buscar));
document.getElementById('btnLimpiar').addEventListener('click', limpiarFiltros);

(async () => {
  await cargarMarcas();
  leerFiltrosDeLaUrl();
  buscar();
})();
