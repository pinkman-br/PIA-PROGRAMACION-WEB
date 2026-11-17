// Lógica de la pantalla Gestión de usuarios (responsable: Persona 1)
// CRUD: Create (Agregar), Read (lista, buscar, Ver), Update (Editar, Activar/Desactivar), Delete (Eliminar)

const URL_API = '/api/admin/usuarios';

const tabla = document.getElementById('tablaUsuarios');
const aviso = document.getElementById('aviso');
const formBuscar = document.getElementById('formBuscar');
const formUsuario = document.getElementById('formUsuario');
const avisoForm = document.getElementById('avisoForm');

const modalVer = new bootstrap.Modal('#modalVer');
const modalForm = new bootstrap.Modal('#modalForm');
const modalEliminar = new bootstrap.Modal('#modalEliminar');

let usuarios = [];        // lista que se muestra en la tabla
let idEditando = null;    // null = agregando; número = editando ese usuario
let idEliminando = null;
let miId = null;          // id del administrador en sesión (no puede desactivarse ni eliminarse)

// Escapa texto antes de meterlo en HTML (evita que un nombre con <script> se ejecute)
function esc(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function mostrarAviso(texto, tipo) {
  aviso.textContent = texto;
  aviso.className = 'alert alert-' + tipo;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fecha(texto) {
  const [anio, mes, dia] = texto.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

// ---------- READ: cargar y dibujar la tabla ----------
async function cargarUsuarios() {
  const q = document.getElementById('q').value.trim();
  try {
    usuarios = await api.get(URL_API + '?q=' + encodeURIComponent(q));
    dibujarTabla();
  } catch (err) {
    tabla.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">${esc(err.message)}</td></tr>`;
  }
}

function dibujarTabla() {
  document.getElementById('conteo').textContent = usuarios.length + ' usuario(s)';
  if (usuarios.length === 0) {
    tabla.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">No se encontraron usuarios.</td></tr>';
    return;
  }

  tabla.innerHTML = usuarios.map((u) => {
    const soyYo = u.id_usuario === miId;
    const rol = u.id_rol === 1
      ? '<span class="badge text-bg-dark">Administrador</span>'
      : '<span class="badge text-bg-light border">Usuario</span>';
    const estado = u.activo
      ? '<span class="badge text-bg-success">Activa</span>'
      : '<span class="badge text-bg-secondary">Desactivada</span>';
    return `
      <tr>
        <td>${esc(u.nombre_completo)}${soyYo ? ' <small class="text-secondary">(tú)</small>' : ''}</td>
        <td>${esc(u.correo)}</td>
        <td>${esc(u.telefono)}</td>
        <td>${rol}</td>
        <td>${estado}</td>
        <td class="text-end text-nowrap">
          <button class="btn btn-sm btn-outline-secondary" data-accion="ver" data-id="${u.id_usuario}">Ver</button>
          <button class="btn btn-sm btn-outline-primary" data-accion="editar" data-id="${u.id_usuario}">Editar</button>
          <button class="btn btn-sm btn-outline-warning" data-accion="activo" data-id="${u.id_usuario}" ${soyYo ? 'disabled' : ''}>
            ${u.activo ? 'Desactivar' : 'Activar'}</button>
          <button class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="${u.id_usuario}" ${soyYo ? 'disabled' : ''}>Eliminar</button>
        </td>
      </tr>`;
  }).join('');
}

// Un solo "escuchador" para todos los botones de la tabla
tabla.addEventListener('click', (e) => {
  const boton = e.target.closest('button[data-accion]');
  if (!boton) return;
  const id = Number(boton.dataset.id);
  const acciones = { ver: verUsuario, editar: abrirEditar, activo: cambiarActivo, eliminar: pedirEliminar };
  acciones[boton.dataset.accion](id);
});

formBuscar.addEventListener('submit', (e) => {
  e.preventDefault();
  cargarUsuarios();
});

// ---------- READ: ver un usuario ----------
async function verUsuario(id) {
  try {
    const u = await api.get(`${URL_API}/${id}`);
    const filas = [
      ['Nombre', u.nombre_completo], ['Correo', u.correo], ['Teléfono', u.telefono],
      ['Rol', u.rol], ['Estado', u.activo ? 'Activa' : 'Desactivada'],
      ['Registrado', fecha(u.fecha_registro)], ['Citas', u.citas], ['Favoritos', u.favoritos]
    ];
    document.getElementById('detalleUsuario').innerHTML = filas
      .map(([k, v]) => `<dt class="col-4 text-secondary fw-normal">${k}</dt><dd class="col-8">${esc(v)}</dd>`)
      .join('');
    modalVer.show();
  } catch (err) {
    mostrarAviso(err.message, 'danger');
  }
}

// ---------- CREATE / UPDATE: formulario ----------
function prepararFormulario(titulo, u) {
  formUsuario.reset();
  formUsuario.classList.remove('was-validated');
  avisoForm.classList.add('d-none');
  document.getElementById('tituloForm').textContent = titulo;

  formUsuario.nombre_completo.value = u ? u.nombre_completo : '';
  formUsuario.correo.value = u ? u.correo : '';
  formUsuario.telefono.value = u ? u.telefono : '';
  formUsuario.id_rol.value = u ? u.id_rol : 2;

  // Al agregar, la contraseña es obligatoria; al editar, se deja vacía para no cambiarla
  formUsuario.contrasena.required = !u;
  document.getElementById('ayudaContrasena').textContent = u
    ? 'Déjala vacía para no cambiarla.'
    : 'Mínimo 8 caracteres. Compártela con la persona para que entre.';
  modalForm.show();
}

document.getElementById('btnNuevo').addEventListener('click', () => {
  idEditando = null;
  prepararFormulario('Agregar usuario', null);
});

function abrirEditar(id) {
  idEditando = id;
  prepararFormulario('Editar usuario', usuarios.find((u) => u.id_usuario === id));
}

formUsuario.telefono.addEventListener('input', () => {
  formUsuario.telefono.value = formUsuario.telefono.value.replace(/\D/g, '').slice(0, 10);
});

formUsuario.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!formUsuario.checkValidity()) {
    formUsuario.classList.add('was-validated');
    return;
  }

  const datos = {
    nombre_completo: formUsuario.nombre_completo.value,
    correo: formUsuario.correo.value,
    telefono: formUsuario.telefono.value,
    id_rol: Number(formUsuario.id_rol.value),
    contrasena: formUsuario.contrasena.value
  };

  const btn = document.getElementById('btnGuardar');
  btn.disabled = true;
  try {
    const { mensaje } = idEditando === null
      ? await api.post(URL_API, datos)                 // CREATE
      : await api.put(`${URL_API}/${idEditando}`, datos); // UPDATE
    modalForm.hide();
    mostrarAviso(mensaje, 'success');
    cargarUsuarios();
  } catch (err) {
    avisoForm.textContent = err.message;
    avisoForm.classList.remove('d-none');
  } finally {
    btn.disabled = false;
  }
});

// ---------- UPDATE: activar / desactivar ----------
async function cambiarActivo(id) {
  const u = usuarios.find((x) => x.id_usuario === id);
  try {
    const { mensaje } = await api.patch(`${URL_API}/${id}/activo`, { activo: !u.activo });
    mostrarAviso(mensaje, 'success');
    cargarUsuarios();
  } catch (err) {
    mostrarAviso(err.message, 'danger');
  }
}

// ---------- DELETE ----------
function pedirEliminar(id) {
  idEliminando = id;
  document.getElementById('nombreEliminar').textContent = usuarios.find((u) => u.id_usuario === id).nombre_completo;
  modalEliminar.show();
}

document.getElementById('btnConfirmarEliminar').addEventListener('click', async () => {
  try {
    const { mensaje } = await api.delete(`${URL_API}/${idEliminando}`);
    modalEliminar.hide();
    mostrarAviso(mensaje, 'success');
    cargarUsuarios();
  } catch (err) {
    modalEliminar.hide();
    mostrarAviso(err.message, 'danger');
  }
});

// ---------- Inicio: solo si es administrador ----------
sesionAdmin.then(async (admin) => {
  miId = admin.id_usuario;
  const roles = await api.get(URL_API + '/roles');
  formUsuario.id_rol.innerHTML = roles.map((r) => `<option value="${r.id_rol}">${esc(r.nombre)}</option>`).join('');
  cargarUsuarios();
});
