// Lógica de la pantalla Gestión de citas (responsable: Persona 5)
// GET /api/admin/citas, PATCH /api/admin/citas/:id (Confirmar / Reprogramar / Cancelar), DELETE (Eliminar)

const URL_API = '/api/admin/citas';
const tabla = document.getElementById('tablaCitas');
const aviso = document.getElementById('aviso');
const modalReprogramar = new bootstrap.Modal('#modalReprogramar');
const modalConfirmar = new bootstrap.Modal('#modalConfirmar');
const formReprogramar = document.getElementById('formReprogramar');
let citas = [];
let citaActual = null;
let accionPendiente = null;

function mostrarAviso(texto, tipo) {
  aviso.textContent = texto;
  aviso.className = 'alert alert-' + tipo;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function cargarCitas() {
  const q = document.getElementById('q').value.trim();
  const estatus = document.getElementById('estatus').value;
  try {
    citas = await api.get(`${URL_API}?q=${encodeURIComponent(q)}&estatus=${encodeURIComponent(estatus)}`);
    dibujarTabla();
  } catch (err) {
    tabla.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">${escAuto(err.message)}</td></tr>`;
  }
}

function botones(c) {
  const b = [];
  if (c.estatus === 'Pendiente' || c.estatus === 'Reprogramada') {
    b.push(`<button class="btn btn-sm btn-outline-success" data-accion="confirmar" data-id="${c.id_cita}">Confirmar</button>`);
  }
  b.push(`<button class="btn btn-sm btn-outline-primary" data-accion="reprogramar" data-id="${c.id_cita}">Reprogramar</button>`);
  if (c.estatus !== 'Cancelada') {
    b.push(`<button class="btn btn-sm btn-outline-warning" data-accion="cancelar" data-id="${c.id_cita}">Cancelar</button>`);
  }
  b.push(`<button class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="${c.id_cita}">Eliminar</button>`);
  return b.join(' ');
}

function dibujarTabla() {
  const pendientes = citas.filter((c) => c.estatus === 'Pendiente').length;
  document.getElementById('conteo').textContent = `${citas.length} cita(s) · ${pendientes} pendiente(s) de confirmar`;
  if (citas.length === 0) {
    tabla.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-4">No hay citas con esos filtros.</td></tr>';
    return;
  }
  tabla.innerHTML = citas.map((c) => `
    <tr class="${c.estatus === 'Cancelada' ? 'cita-cancelada' : ''}">
      <td><strong>${escAuto(c.nombre_completo)}</strong><br>
          <small><a href="tel:${escAuto(c.telefono)}">${escAuto(c.telefono)}</a> · <a href="mailto:${escAuto(c.correo)}">${escAuto(c.correo)}</a></small>
          ${c.comentario ? `<br><small class="text-secondary">“${escAuto(c.comentario)}”</small>` : ''}</td>
      <td>${escAuto(nombreAuto(c))} ${c.anio}<br><small class="text-secondary">${escAuto(c.version || '')} · ${escAuto(c.color)}</small></td>
      <td class="text-nowrap">${formatoFecha(c.fecha)} · ${c.hora}${citaPasada(c) ? '<br><small class="text-secondary">Ya pasó</small>' : ''}</td>
      <td>${etiquetaEstatus(c.estatus)}</td>
      <td class="text-end"><div class="d-flex flex-wrap gap-1 justify-content-end">${botones(c)}</div></td>
    </tr>`).join('');
}

document.getElementById('formBuscar').addEventListener('submit', (e) => {
  e.preventDefault();
  cargarCitas();
});
document.getElementById('estatus').addEventListener('change', cargarCitas);

tabla.addEventListener('click', (e) => {
  const boton = e.target.closest('button[data-accion]');
  if (!boton) return;
  citaActual = citas.find((c) => c.id_cita === Number(boton.dataset.id));
  const accion = boton.dataset.accion;
  if (accion === 'confirmar') {
    cambiar({ estatus: 'Confirmada' }).then((r) => { if (r !== true) mostrarAviso(r.message, 'danger'); });
  }
  if (accion === 'reprogramar') abrirReprogramar();
  if (accion === 'cancelar') pedirConfirmacion('Cancelar cita', `¿Cancelar la cita de ${citaActual.nombre_completo}? Se le mostrará como cancelada en Mis citas.`, 'Sí, cancelar', () => cambiar({ estatus: 'Cancelada' }));
  if (accion === 'eliminar') pedirConfirmacion('Eliminar cita', `¿Eliminar la cita de ${citaActual.nombre_completo}? Se borra por completo y ya no aparecerá en su historial.`, 'Eliminar', eliminar);
});

// ---------- UPDATE: Confirmar / Cancelar / Reprogramar ----------
async function cambiar(datos) {
  try {
    const { mensaje } = await api.patch(`${URL_API}/${citaActual.id_cita}`, datos);
    mostrarAviso(mensaje, 'success');
    cargarCitas();
    return true;
  } catch (err) {
    return err;
  }
}

function abrirReprogramar() {
  formReprogramar.reset();
  document.getElementById('avisoReprogramar').classList.add('d-none');
  document.getElementById('textoReprogramar').textContent =
    `${citaActual.nombre_completo} · ${nombreAuto(citaActual)} ${citaActual.anio} · actual: ${formatoFecha(citaActual.fecha)} a las ${citaActual.hora}`;
  const nuevaFecha = document.getElementById('nuevaFecha');
  nuevaFecha.min = fechaTexto(0);
  nuevaFecha.max = fechaTexto(60);
  document.getElementById('nuevaHora').innerHTML = '<option value="">Elige la fecha</option>';
  modalReprogramar.show();
}

document.getElementById('nuevaFecha').addEventListener('change', async (e) => {
  const select = document.getElementById('nuevaHora');
  const horas = await api.get(`/api/citas/horarios?id_automovil=${citaActual.id_automovil}&fecha=${e.target.value}`).catch(() => []);
  select.innerHTML = horas.length === 0
    ? '<option value="">Sin horario ese día</option>'
    : '<option value="">Elige una hora</option>' + horas.map((h) => `<option value="${h.hora}" ${h.disponible ? '' : 'disabled'}>${h.hora}${h.disponible ? '' : ' (ocupada)'}</option>`).join('');
});

formReprogramar.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fecha = document.getElementById('nuevaFecha').value;
  const hora = document.getElementById('nuevaHora').value;
  const avisoModal = document.getElementById('avisoReprogramar');
  if (!fecha || !hora) {
    avisoModal.textContent = 'Elige la nueva fecha y hora.';
    avisoModal.classList.remove('d-none');
    return;
  }
  const resultado = await cambiar({ estatus: 'Reprogramada', fecha, hora });
  if (resultado === true) {
    modalReprogramar.hide();
  } else {
    avisoModal.textContent = resultado.message;
    avisoModal.classList.remove('d-none');
  }
});

// ---------- Confirmación genérica ----------
function pedirConfirmacion(titulo, texto, textoBoton, accion) {
  document.getElementById('tituloConfirmar').textContent = titulo;
  document.getElementById('textoConfirmar').textContent = texto;
  document.getElementById('btnConfirmar').textContent = textoBoton;
  accionPendiente = accion;
  modalConfirmar.show();
}

document.getElementById('btnConfirmar').addEventListener('click', async () => {
  modalConfirmar.hide();
  const resultado = await accionPendiente();
  if (resultado !== true && resultado instanceof Error) mostrarAviso(resultado.message, 'danger');
});

// ---------- DELETE ----------
async function eliminar() {
  try {
    const { mensaje } = await api.delete(`${URL_API}/${citaActual.id_cita}`);
    mostrarAviso(mensaje, 'success');
    cargarCitas();
    return true;
  } catch (err) {
    return err;
  }
}

sesionAdmin.then(cargarCitas);
