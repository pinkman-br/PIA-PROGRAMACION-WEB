// /api/admin/usuarios  (responsable: Persona 1) — CRUD 2 del proyecto
// Solo administrador: server.js ya pone requiereAdmin antes de este archivo.
//
//   GET    /api/admin/usuarios?q=texto   → lista de cuentas (busca por nombre o correo)
//   GET    /api/admin/usuarios/roles     → roles para el selector del formulario
//   GET    /api/admin/usuarios/:id       → datos de una cuenta + cuántas citas y favoritos tiene
//   POST   /api/admin/usuarios           → crea una cuenta (Usuario o Administrador)
//   PUT    /api/admin/usuarios/:id       → edita datos y rol (y la contraseña, solo si se escribe una nueva)
//   PATCH  /api/admin/usuarios/:id/activo → activa o desactiva la cuenta
//   DELETE /api/admin/usuarios/:id       → elimina la cuenta (sus favoritos y citas se borran por CASCADE)

const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { ROL_ADMIN } = require('../middleware/auth');

const router = express.Router();

const RONDAS_BCRYPT = 10;
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_VALIDO = /^\d{10}$/;

function errorPublico(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  err.publico = mensaje;
  return err;
}

// Lee y valida los datos del formulario. La contraseña es obligatoria al crear y opcional al editar.
function leerDatos(body, { contrasenaObligatoria }) {
  const datos = {
    nombre: String(body.nombre_completo || '').trim(),
    correo: String(body.correo || '').trim().toLowerCase(),
    telefono: String(body.telefono || '').replace(/\D/g, ''),
    idRol: Number(body.id_rol),
    contrasena: String(body.contrasena || '')
  };
  if (datos.nombre.length < 3) throw errorPublico(400, 'Escribe el nombre completo.');
  if (!CORREO_VALIDO.test(datos.correo)) throw errorPublico(400, 'El correo no es válido.');
  if (!TELEFONO_VALIDO.test(datos.telefono)) throw errorPublico(400, 'El teléfono debe tener 10 dígitos.');
  if (![1, 2].includes(datos.idRol)) throw errorPublico(400, 'Elige un rol válido.');
  if (contrasenaObligatoria || datos.contrasena) {
    if (datos.contrasena.length < 8) throw errorPublico(400, 'La contraseña debe tener al menos 8 caracteres.');
  }
  return datos;
}

// El id que viene en la URL debe ser un número entero positivo
function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw errorPublico(400, 'Id de usuario no válido.');
  return id;
}

async function buscarUsuario(id) {
  const [filas] = await pool.query(
    `SELECT u.id_usuario, u.id_rol, r.nombre AS rol, u.nombre_completo, u.correo,
            u.telefono, u.activo, u.fecha_registro
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
      WHERE u.id_usuario = ?`,
    [id]
  );
  return filas[0] || null;
}

// Evita que el sistema se quede sin ningún administrador activo
async function otrosAdminsActivos(idExcluido) {
  const [[fila]] = await pool.query(
    'SELECT COUNT(*) AS total FROM usuarios WHERE id_rol = ? AND activo = TRUE AND id_usuario <> ?',
    [ROL_ADMIN, idExcluido]
  );
  return fila.total;
}

// ---------- GET / (lista con búsqueda) ----------
router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const patron = '%' + q + '%';
    const [filas] = await pool.query(
      `SELECT u.id_usuario, u.id_rol, r.nombre AS rol, u.nombre_completo, u.correo,
              u.telefono, u.activo, u.fecha_registro
         FROM usuarios u
         JOIN roles r ON r.id_rol = u.id_rol
        WHERE ? = '' OR u.nombre_completo LIKE ? OR u.correo LIKE ?
        ORDER BY u.id_rol, u.nombre_completo`,
      [q, patron, patron]
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// ---------- GET /roles ----------
// Va antes de "/:id" para que "roles" no se confunda con un id
router.get('/roles', async (req, res, next) => {
  try {
    const [filas] = await pool.query('SELECT id_rol, nombre FROM roles ORDER BY id_rol');
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// ---------- GET /:id (botón "Ver") ----------
router.get('/:id', async (req, res, next) => {
  try {
    const id = leerId(req);
    const usuario = await buscarUsuario(id);
    if (!usuario) throw errorPublico(404, 'Ese usuario no existe.');

    const [[conteo]] = await pool.query(
      `SELECT (SELECT COUNT(*) FROM citas     WHERE id_usuario = ?) AS citas,
              (SELECT COUNT(*) FROM favoritos WHERE id_usuario = ?) AS favoritos`,
      [id, id]
    );
    res.json({ ...usuario, citas: conteo.citas, favoritos: conteo.favoritos });
  } catch (err) {
    next(err);
  }
});

// ---------- POST / (crear) ----------
router.post('/', async (req, res, next) => {
  try {
    const d = leerDatos(req.body, { contrasenaObligatoria: true });
    const hash = await bcrypt.hash(d.contrasena, RONDAS_BCRYPT);
    const [resultado] = await pool.query(
      `INSERT INTO usuarios (id_rol, nombre_completo, correo, telefono, contrasena_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [d.idRol, d.nombre, d.correo, d.telefono, hash]
    );
    res.status(201).json({ mensaje: 'Usuario creado.', usuario: await buscarUsuario(resultado.insertId) });
  } catch (err) {
    // La llave UNIQUE del correo lo impide si ya existe
    if (err.code === 'ER_DUP_ENTRY') return next(errorPublico(409, 'Ya existe una cuenta con ese correo.'));
    next(err);
  }
});

// ---------- PUT /:id (editar) ----------
router.put('/:id', async (req, res, next) => {
  try {
    const id = leerId(req);
    const actual = await buscarUsuario(id);
    if (!actual) throw errorPublico(404, 'Ese usuario no existe.');
    const d = leerDatos(req.body, { contrasenaObligatoria: false });

    // Un administrador no puede quitarse a sí mismo el rol (se quedaría fuera del panel)
    const esElMismo = id === req.session.usuario.id_usuario;
    if (esElMismo && d.idRol !== ROL_ADMIN) {
      throw errorPublico(400, 'No puedes quitarte a ti mismo el rol de administrador.');
    }
    if (actual.id_rol === ROL_ADMIN && d.idRol !== ROL_ADMIN && (await otrosAdminsActivos(id)) === 0) {
      throw errorPublico(400, 'Debe quedar al menos un administrador activo.');
    }

    if (d.contrasena) {
      const hash = await bcrypt.hash(d.contrasena, RONDAS_BCRYPT);
      await pool.query(
        `UPDATE usuarios SET id_rol = ?, nombre_completo = ?, correo = ?, telefono = ?, contrasena_hash = ?
          WHERE id_usuario = ?`,
        [d.idRol, d.nombre, d.correo, d.telefono, hash, id]
      );
    } else {
      await pool.query(
        `UPDATE usuarios SET id_rol = ?, nombre_completo = ?, correo = ?, telefono = ?
          WHERE id_usuario = ?`,
        [d.idRol, d.nombre, d.correo, d.telefono, id]
      );
    }

    // Si el administrador se editó a sí mismo, se actualiza su sesión
    if (esElMismo) {
      req.session.usuario.nombre_completo = d.nombre;
      req.session.usuario.correo = d.correo;
    }
    res.json({ mensaje: 'Usuario actualizado.', usuario: await buscarUsuario(id) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return next(errorPublico(409, 'Ya existe una cuenta con ese correo.'));
    next(err);
  }
});

// ---------- PATCH /:id/activo (activar / desactivar) ----------
router.patch('/:id/activo', async (req, res, next) => {
  try {
    const id = leerId(req);
    const activo = req.body.activo === true;
    const actual = await buscarUsuario(id);
    if (!actual) throw errorPublico(404, 'Ese usuario no existe.');

    if (!activo && id === req.session.usuario.id_usuario) {
      throw errorPublico(400, 'No puedes desactivar tu propia cuenta.');
    }
    if (!activo && actual.id_rol === ROL_ADMIN && (await otrosAdminsActivos(id)) === 0) {
      throw errorPublico(400, 'Debe quedar al menos un administrador activo.');
    }

    await pool.query('UPDATE usuarios SET activo = ? WHERE id_usuario = ?', [activo, id]);
    res.json({ mensaje: activo ? 'Cuenta activada.' : 'Cuenta desactivada: ya no podrá iniciar sesión.' });
  } catch (err) {
    next(err);
  }
});

// ---------- DELETE /:id (eliminar) ----------
router.delete('/:id', async (req, res, next) => {
  try {
    const id = leerId(req);
    if (id === req.session.usuario.id_usuario) throw errorPublico(400, 'No puedes eliminar tu propia cuenta.');

    const actual = await buscarUsuario(id);
    if (!actual) throw errorPublico(404, 'Ese usuario no existe.');
    if (actual.id_rol === ROL_ADMIN && (await otrosAdminsActivos(id)) === 0) {
      throw errorPublico(400, 'Debe quedar al menos un administrador activo.');
    }

    // ON DELETE CASCADE en favoritos y citas: MySQL borra solos sus registros relacionados
    await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
    res.json({ mensaje: 'Usuario eliminado junto con sus favoritos y citas.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
