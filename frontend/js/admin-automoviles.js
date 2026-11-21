// Lógica de la pantalla Gestión de automóviles (responsable: Persona 4)
// CRUD: Create (Agregar → formulario), Read (tabla y Buscar), Update (Editar, Vendido/Activar), Delete (Eliminar)

const URL_API = '/api/admin/automoviles';
const tabla = document.getElementById('tablaAutos');
const aviso = document.getElementById('aviso');
const modalEliminar = new bootstrap.Modal('#modalEliminar');
let autos = [];
let idEliminando = null;

function mostrarAviso(texto, tipo) {
  aviso.textContent = texto;
  aviso.className = 'alert alert-' + tipo;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mensaje que deja el formulario al guardar (llega como ?guardado=1)
const parametros = new URLSearchParams(location.search);
if (parametros.get('guardado')) {
  mostrarAviso(parametros.get('guardado') === 'nuevo' ? 'Automóvil agregado.' : 'Cambios guardados.', 'success');
  history.replaceState(null, '', '/admin/automoviles');
}

// ---------- READ ----------
async function cargarAutos() {
  const q = document.getElementById('q').value.trim();
  try {
    autos = await api.get(URL_API + '?q=' + encodeURIComponent(q));
    dibujarTabla();
  } catch (err) {
    tabla.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">${escAuto(err.message)}</td></tr>`;
  }
}

function dibujarTabla() {
  const disponibles = autos.filter((a) => a.estatus === 'Disponible').length;
  document.getElementById('conteo').textContent = `${autos.length} unidad(es), ${disponibles} disponible(s)`;

  if (autos.length === 0) {
    tabla.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">No se encontraron automóviles.</td></tr>';
    return;
  }

  tabla.innerHTML = autos.map((a) => {
    const vendido = a.estatus === 'Vendido';
    return `
      <tr>
        <td><img class="miniatura" src="${escAuto(rutaImagen(a))}" alt="" onerror="this.onerror=null; this.src='${IMAGEN_SIN_FOTO}'"></td>
        <td>
          <strong>${escAuto(nombreAuto(a))} ${a.anio}</strong> ${a.destacado ? '<span class="estrella" title="Destacado">★</span>' : ''}<br>
          <small class="text-secondary">${escAuto(a.version || '')} · ${escAuto(a.color)}</small>
        </td>
        <td>${formatoPrecio(a.precio)}</td>
        <td>${formatoKm(a.kilometraje)}</td>
        <td>${vendido ? '<span class="badge text-bg-secondary">Vendido</span>' : '<span class="badge text-bg-success">Disponible</span>'}</td>
        <td class="text-end text-nowrap">
          <a class="btn btn-sm btn-outline-primary" href="/admin/automovil?id=${a.id_automovil}">Editar</a>
          <button class="btn btn-sm btn-outline-warning" data-accion="estatus" data-id="${a.id_automovil}">${vendido ? 'Activar' : 'Vendido'}</button>
          <button class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="${a.id_automovil}">Eliminar</button>
        </td>
      </tr>`;
  }).join('');
}

document.getElementById('formBuscar').addEventListener('submit', (e) => {
  e.preventDefault();
  cargarAutos();
});

tabla.addEventListener('click', (e) => {
  const boton = e.target.closest('button[data-accion]');
  if (!boton) return;
  const id = Number(boton.dataset.id);
  if (boton.dataset.accion === 'estatus') cambiarEstatus(id);
  if (boton.dataset.accion === 'eliminar') pedirEliminar(id);
});

// ---------- UPDATE: Vendido / Activar ----------
async function cambiarEstatus(id) {
  const auto = autos.find((a) => a.id_automovil === id);
  const nuevo = auto.estatus === 'Vendido' ? 'Disponible' : 'Vendido';
  try {
    const { mensaje } = await api.patch(`${URL_API}/${id}/estatus`, { estatus: nuevo });
    mostrarAviso(mensaje, 'success');
    cargarAutos();
  } catch (err) {
    mostrarAviso(err.message, 'danger');
  }
}

// ---------- DELETE ----------
function pedirEliminar(id) {
  idEliminando = id;
  const auto = autos.find((a) => a.id_automovil === id);
  document.getElementById('nombreEliminar').textContent = `${nombreAuto(auto)} ${auto.anio} (${auto.color})`;
  modalEliminar.show();
}

document.getElementById('btnConfirmarEliminar').addEventListener('click', async () => {
  modalEliminar.hide();
  try {
    const { mensaje } = await api.delete(`${URL_API}/${idEliminando}`);
    mostrarAviso(mensaje, 'success');
    cargarAutos();
  } catch (err) {
    // Por ejemplo: "tiene citas registradas y no se puede eliminar"
    mostrarAviso(err.message, 'danger');
  }
});

sesionAdmin.then(cargarAutos);
