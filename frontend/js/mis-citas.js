// Lógica de la pantalla Mis citas (responsable: Persona 5)
// GET /api/citas/mias y PATCH /api/citas/:id/cancelar

const tabla = document.getElementById('tablaCitas');
const aviso = document.getElementById('aviso');
const modalVer = new bootstrap.Modal('#modalVer');
const modalCancelar = new bootstrap.Modal('#modalCancelar');
let citas = [];
let idCancelando = null;

function mostrarAviso(texto, tipo) {
  aviso.textContent = texto;
  aviso.className = 'alert alert-' + tipo;
}

function sePuedeCancelar(cita) {
  return cita.estatus !== 'Cancelada' && !citaPasada(cita);
}

async function cargarCitas() {
  try {
    citas = await api.get('/api/citas/mias');
    dibujarTabla();
  } catch (err) {
    tabla.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">${escAuto(err.message)}</td></tr>`;
  }
}

function dibujarTabla() {
  if (citas.length === 0) {
    tabla.innerHTML = `<tr><td colspan="5" class="text-center py-4">Todavía no solicitas pruebas de manejo.
      Elige un auto en el <a href="/catalogo">catálogo</a> y da clic en "Agendar prueba de manejo".</td></tr>`;
    return;
  }
  tabla.innerHTML = citas.map((c) => `
    <tr class="${c.estatus === 'Cancelada' ? 'cita-cancelada' : ''}">
      <td><strong>${escAuto(nombreAuto(c))} ${c.anio}</strong><br><small class="text-secondary">${escAuto(c.version || '')} · ${escAuto(c.color)}</small></td>
      <td>${formatoFecha(c.fecha)}</td>
      <td>${c.hora}</td>
      <td>${etiquetaEstatus(c.estatus)}${citaPasada(c) && c.estatus !== 'Cancelada' ? '<br><small class="text-secondary">Ya pasó</small>' : ''}</td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-secondary" data-accion="ver" data-id="${c.id_cita}">Ver</button>
        ${sePuedeCancelar(c) ? `<button class="btn btn-sm btn-outline-danger" data-accion="cancelar" data-id="${c.id_cita}">Cancelar</button>` : ''}
      </td>
    </tr>`).join('');
}

tabla.addEventListener('click', (e) => {
  const boton = e.target.closest('button[data-accion]');
  if (!boton) return;
  const cita = citas.find((c) => c.id_cita === Number(boton.dataset.id));
  if (boton.dataset.accion === 'ver') verCita(cita);
  if (boton.dataset.accion === 'cancelar') {
    idCancelando = cita.id_cita;
    document.getElementById('textoCancelar').textContent = `${formatoFecha(cita.fecha)} a las ${cita.hora}`;
    modalCancelar.show();
  }
});

function verCita(c) {
  const filas = [
    ['Automóvil', `${nombreAuto(c)} ${c.anio} ${c.version || ''}`],
    ['Fecha', formatoFecha(c.fecha)],
    ['Hora', c.hora],
    ['Estatus', c.estatus],
    ['Comentario', c.comentario || 'Sin comentario'],
    ['Solicitada', formatoFecha(c.fecha_solicitud)]
  ];
  document.getElementById('detalleCita').innerHTML = filas
    .map(([k, v]) => `<dt class="col-4 text-secondary fw-normal">${k}</dt><dd class="col-8">${escAuto(v)}</dd>`).join('') +
    `<dd class="col-12 mb-0"><a href="/detalle?id=${c.id_automovil}">Ver ficha del automóvil</a></dd>`;
  modalVer.show();
}

document.getElementById('btnConfirmarCancelar').addEventListener('click', async () => {
  modalCancelar.hide();
  try {
    const { mensaje } = await api.patch(`/api/citas/${idCancelando}/cancelar`);
    mostrarAviso(mensaje, 'success');
    cargarCitas();
  } catch (err) {
    mostrarAviso(err.message, 'danger');
  }
});

sesionActual.then((usuario) => {
  if (!usuario) {
    location.href = '/login?volver=/mis-citas';
    return;
  }
  cargarCitas();
});
