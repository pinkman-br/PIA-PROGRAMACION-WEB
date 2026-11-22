// Funciones compartidas de las pantallas de citas (responsable: Persona 5)

// "2026-11-23" → "23/11/2026"
function formatoFecha(fecha) {
  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

// Etiqueta de color según el estatus de la cita
function etiquetaEstatus(estatus) {
  return `<span class="badge-estatus estatus-${estatus}">${estatus}</span>`;
}

// Fecha de hoy y de dentro de N días como "AAAA-MM-DD" (para los límites del calendario)
function fechaTexto(diasDespues = 0) {
  const d = new Date();
  d.setDate(d.getDate() + diasDespues);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

// ¿La cita ya pasó?
function citaPasada(cita) {
  return new Date(`${String(cita.fecha).slice(0, 10)}T${cita.hora}:00`) <= new Date();
}
