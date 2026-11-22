// Lógica de la pantalla Agendar prueba de manejo (responsable: Persona 5)
// Usa: GET /api/automoviles/:id (Persona 2), GET /api/perfil (Persona 1),
//      GET /api/citas/horarios y POST /api/citas (Persona 5)

const idAutomovil = Number(new URLSearchParams(location.search).get('id'));
const form = document.getElementById('formCita');
const aviso = document.getElementById('aviso');
const selectHora = document.getElementById('hora');

function mostrarAviso(html, tipo) {
  aviso.innerHTML = html;
  aviso.className = 'alert alert-' + tipo;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function dibujarAuto(auto) {
  document.getElementById('autoElegido').innerHTML = `
    <img src="${escAuto(rutaImagen(auto))}" alt="${escAuto(nombreAuto(auto))}" onerror="this.onerror=null; this.src='${IMAGEN_SIN_FOTO}'">
    <h2 class="h5 fw-bold mt-3 mb-0">${escAuto(nombreAuto(auto))} ${auto.anio}</h2>
    <p class="text-secondary small mb-1">${escAuto(auto.version || '')} · ${escAuto(auto.color)}</p>
    <p class="precio mb-1">${formatoPrecio(auto.precio)}</p>
    <p class="small text-secondary mb-0">Unidad seleccionada automáticamente. <a href="/detalle?id=${auto.id_automovil}">Ver ficha</a></p>`;
}

// Al elegir una fecha se piden las horas libres de ese día para este auto
async function cargarHoras() {
  const fecha = form.fecha.value;
  selectHora.innerHTML = '<option value="">Cargando horas...</option>';
  if (!fecha) {
    selectHora.innerHTML = '<option value="">Primero elige la fecha</option>';
    return;
  }
  try {
    const horas = await api.get(`/api/citas/horarios?id_automovil=${idAutomovil}&fecha=${fecha}`);
    const libres = horas.filter((h) => h.disponible);
    if (horas.length === 0) {
      selectHora.innerHTML = '<option value="">Los domingos está cerrado</option>';
    } else if (libres.length === 0) {
      selectHora.innerHTML = '<option value="">No quedan horas libres ese día</option>';
    } else {
      selectHora.innerHTML = '<option value="">Elige una hora</option>' + horas
        .map((h) => `<option value="${h.hora}" ${h.disponible ? '' : 'disabled'}>${h.hora}${h.disponible ? '' : ' (no disponible)'}</option>`)
        .join('');
    }
  } catch (err) {
    selectHora.innerHTML = '<option value="">No se pudieron cargar las horas</option>';
  }
}
form.fecha.addEventListener('change', cargarHoras);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }
  const btn = document.getElementById('btnSolicitar');
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  try {
    const { mensaje } = await api.post('/api/citas', {
      id_automovil: idAutomovil,
      fecha: form.fecha.value,
      hora: form.hora.value,
      comentario: form.comentario.value
    });
    document.getElementById('campos').disabled = true;
    mostrarAviso(`${escAuto(mensaje)} <a href="/mis-citas" class="alert-link">Ver mis citas</a>`, 'success');
  } catch (err) {
    mostrarAviso(escAuto(err.message), 'danger');
    btn.disabled = false;
    btn.textContent = 'Solicitar cita';
    cargarHoras(); // por si la hora se acaba de ocupar
  }
});

// Inicio: se necesita sesión; sin ella se pasa por Iniciar sesión y se regresa aquí
sesionActual.then(async (usuario) => {
  if (!usuario) {
    location.href = '/login?volver=' + encodeURIComponent(location.pathname + location.search);
    return;
  }
  if (!Number.isInteger(idAutomovil) || idAutomovil <= 0) {
    mostrarAviso('No se indicó qué automóvil quieres probar. <a href="/catalogo" class="alert-link">Elige uno en el catálogo</a>.', 'warning');
    return;
  }
  try {
    const [auto, perfil] = await Promise.all([api.get('/api/automoviles/' + idAutomovil), api.get('/api/perfil')]);
    dibujarAuto(auto);
    if (auto.estatus !== 'Disponible') {
      mostrarAviso('Este automóvil ya se vendió. <a href="/catalogo" class="alert-link">Busca otro en el catálogo</a>.', 'warning');
      return;
    }
    // Datos del perfil para no capturarlos otra vez
    form.querySelector('#nombre').value = perfil.nombre_completo;
    form.querySelector('#telefono').value = perfil.telefono;
    form.querySelector('#correo').value = perfil.correo;
    form.fecha.min = fechaTexto(0);
    form.fecha.max = fechaTexto(60);
    document.getElementById('campos').disabled = false;
  } catch (err) {
    mostrarAviso(escAuto(err.status === 404 ? 'Ese automóvil no existe.' : err.message), 'danger');
  }
});
