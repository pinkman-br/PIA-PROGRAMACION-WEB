// Lógica de la pantalla Crear cuenta (responsable: Persona 1)

const form = document.getElementById('formRegistro');
const aviso = document.getElementById('aviso');
const btnCrear = document.getElementById('btnCrear');

function mostrarAviso(texto, tipo) {
  aviso.textContent = texto;
  aviso.className = 'alert alert-' + tipo;
}

// El teléfono solo acepta números
form.telefono.addEventListener('input', () => {
  form.telefono.value = form.telefono.value.replace(/\D/g, '').slice(0, 10);
});

// "Confirmar contraseña" debe ser igual a "Contraseña"
function revisarConfirmacion() {
  const iguales = form.confirmar.value === form.contrasena.value;
  form.confirmar.setCustomValidity(iguales ? '' : 'No coinciden');
}
form.contrasena.addEventListener('input', revisarConfirmacion);
form.confirmar.addEventListener('input', revisarConfirmacion);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  revisarConfirmacion();

  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  btnCrear.disabled = true;
  btnCrear.textContent = 'Creando cuenta...';
  try {
    await api.post('/api/auth/registro', {
      nombre_completo: form.nombre_completo.value,
      correo: form.correo.value,
      telefono: form.telefono.value,
      contrasena: form.contrasena.value
    });
    // Cuenta creada: se manda a Iniciar sesión con un mensaje de éxito
    location.href = '/login?registrado=1';
  } catch (err) {
    mostrarAviso(err.message, 'danger');
    btnCrear.disabled = false;
    btnCrear.textContent = 'Crear cuenta';
  }
});
