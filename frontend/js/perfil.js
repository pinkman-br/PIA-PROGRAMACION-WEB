// Lógica de la pantalla Mi perfil (responsable: Persona 1)

const form = document.getElementById('formPerfil');
const campos = document.getElementById('campos');
const aviso = document.getElementById('aviso');
const btnGuardar = document.getElementById('btnGuardar');

function mostrarAviso(texto, tipo) {
  aviso.textContent = texto;
  aviso.className = 'alert alert-' + tipo;
}

// Muestra los datos de la cuenta en el formulario
function llenarFormulario(perfil) {
  form.nombre_completo.value = perfil.nombre_completo;
  form.correo.value = perfil.correo;
  form.telefono.value = perfil.telefono;
  document.getElementById('rol').textContent = perfil.rol;
  // fecha_registro llega como "2026-11-16 20:31:05": se muestra como "16/11/2026"
  const [anio, mes, dia] = perfil.fecha_registro.slice(0, 10).split('-');
  document.getElementById('desde').textContent = `${dia}/${mes}/${anio}`;
}

// Al abrir la pantalla: cargar los datos. Sin sesión, se manda a Iniciar sesión y luego regresa aquí.
async function cargarPerfil() {
  try {
    const perfil = await api.get('/api/perfil');
    llenarFormulario(perfil);
    campos.disabled = false;
  } catch (err) {
    if (err.status === 401) {
      location.href = '/login?volver=/perfil';
      return;
    }
    mostrarAviso('No se pudieron cargar tus datos: ' + err.message, 'danger');
  }
}

// El teléfono solo acepta números
form.telefono.addEventListener('input', () => {
  form.telefono.value = form.telefono.value.replace(/\D/g, '').slice(0, 10);
});

// Guardar cambios
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  btnGuardar.disabled = true;
  btnGuardar.textContent = 'Guardando...';
  try {
    const { mensaje, perfil } = await api.put('/api/perfil', {
      nombre_completo: form.nombre_completo.value,
      correo: form.correo.value,
      telefono: form.telefono.value
    });
    llenarFormulario(perfil);
    form.classList.remove('was-validated');
    mostrarAviso(mensaje, 'success');
  } catch (err) {
    if (err.status === 401) return (location.href = '/login?volver=/perfil');
    mostrarAviso(err.message, 'danger');
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = 'Guardar cambios';
  }
});

// Cerrar sesión
document.getElementById('btnSalir').addEventListener('click', async () => {
  await api.post('/api/auth/logout').catch(() => {});
  location.href = '/';
});

cargarPerfil();
