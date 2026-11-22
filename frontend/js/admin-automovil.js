// Lógica de la pantalla Agregar / editar automóvil (responsable: Persona 4)
// Sin ?id= agrega (POST); con ?id= carga los datos y edita (PUT).

const URL_API = '/api/admin/automoviles';
const form = document.getElementById('formAuto');
const aviso = document.getElementById('aviso');
const vistaPrevia = document.getElementById('vistaPrevia');
const idEditando = Number(new URLSearchParams(location.search).get('id')) || null;
const LIMITE_FOTO = 5 * 1024 * 1024;

function mostrarAviso(texto, tipo) {
  aviso.textContent = texto;
  aviso.className = 'alert alert-' + tipo;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Llena el formulario con los datos actuales (modo editar)
function llenar(auto) {
  ['marca', 'modelo', 'version', 'anio', 'precio', 'kilometraje', 'color', 'estatus',
   'transmision', 'combustible', 'motor', 'carroceria', 'puertas', 'pasajeros', 'descripcion']
    .forEach((campo) => { form[campo].value = auto[campo] ?? ''; });
  form.destacado.checked = Boolean(auto.destacado);
  vistaPrevia.src = rutaImagen(auto);
  document.getElementById('ayudaImagen').textContent = 'Déjala vacía para conservar la foto actual. JPG, PNG o WEBP de máximo 5 MB.';
}

// Muestra la foto elegida antes de guardar
form.imagen.addEventListener('change', () => {
  const archivo = form.imagen.files[0];
  form.imagen.setCustomValidity(archivo && archivo.size > LIMITE_FOTO ? 'Máximo 5 MB' : '');
  if (archivo) vistaPrevia.src = URL.createObjectURL(archivo);
});
vistaPrevia.addEventListener('error', () => { vistaPrevia.src = IMAGEN_SIN_FOTO; });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    mostrarAviso('Revisa los campos marcados en rojo.', 'danger');
    return;
  }

  // FormData arma un formulario "multipart" que incluye el archivo de la foto
  const datos = new FormData(form);
  datos.set('destacado', form.destacado.checked ? 'true' : 'false');
  if (!form.imagen.files[0]) datos.delete('imagen');

  const btn = document.getElementById('btnGuardar');
  btn.disabled = true;
  btn.textContent = 'Guardando...';
  try {
    // api.js manda JSON; para enviar un archivo se usa fetch directo con FormData
    const respuesta = await fetch(idEditando ? `${URL_API}/${idEditando}` : URL_API, {
      method: idEditando ? 'PUT' : 'POST',
      body: datos,
      credentials: 'same-origin'
    });
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo.error || 'No se pudo guardar.');
    location.href = '/admin/automoviles?guardado=' + (idEditando ? 'editado' : 'nuevo');
  } catch (err) {
    mostrarAviso(err.message, 'danger');
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
});

sesionAdmin.then(async () => {
  try {
    const marcas = await api.get(URL_API + '/marcas');
    document.getElementById('listaMarcas').innerHTML = marcas.map((m) => `<option value="${escAuto(m.nombre)}">`).join('');

    if (idEditando) {
      document.getElementById('titulo').textContent = 'Editar automóvil';
      document.title = 'Editar automóvil | Seminuevos';
      llenar(await api.get(`${URL_API}/${idEditando}`));
    }
    document.getElementById('campos').disabled = false;
  } catch (err) {
    mostrarAviso(err.message, 'danger');
  }
});
