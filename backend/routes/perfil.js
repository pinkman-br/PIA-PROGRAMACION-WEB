// /api/perfil  (responsable: Persona 1)  — todas las rutas requieren sesión
//
//   GET /api/perfil   → datos de la cuenta que tiene la sesión (sin la contraseña)
//   PUT /api/perfil   → actualiza nombre_completo, correo y telefono
//
// Estos datos son los que se cargan solos al agendar una prueba de manejo (pantalla de Persona 5).

const express = require('express');
const pool = require('../config/db');
const { requiereLogin } = require('../middleware/auth');

const router = express.Router();

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_VALIDO = /^\d{10}$/;

function errorPublico(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  err.publico = mensaje;
  return err;
}

// Todas las rutas de este archivo piden sesión iniciada
router.use(requiereLogin);

// Consulta los datos de una cuenta (se usa en GET y después de guardar en PUT)
async function buscarPerfil(idUsuario) {
  const [filas] = await pool.query(
    `SELECT u.id_usuario, u.nombre_completo, u.correo, u.telefono, u.fecha_registro,
            r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
      WHERE u.id_usuario = ?`,
    [idUsuario]
  );
  return filas[0] || null;
}

// ---------- GET /api/perfil ----------
router.get('/', async (req, res, next) => {
  try {
    const perfil = await buscarPerfil(req.session.usuario.id_usuario);
    if (!perfil) {
      // La cuenta ya no existe (por ejemplo, el administrador la eliminó): se cierra la sesión
      return req.session.destroy(() => res.status(401).json({ error: 'Tu cuenta ya no existe. Inicia sesión de nuevo.' }));
    }
    res.json(perfil);
  } catch (err) {
    next(err);
  }
});

// ---------- PUT /api/perfil ----------
router.put('/', async (req, res, next) => {
  try {
    const idUsuario = req.session.usuario.id_usuario; // siempre la cuenta de la sesión, nunca un id que mande el navegador
    const nombre = String(req.body.nombre_completo || '').trim();
    const correo = String(req.body.correo || '').trim().toLowerCase();
    const telefono = String(req.body.telefono || '').replace(/\D/g, '');

    if (nombre.length < 3) throw errorPublico(400, 'Escribe tu nombre completo.');
    if (!CORREO_VALIDO.test(correo)) throw errorPublico(400, 'El correo no es válido.');
    if (!TELEFONO_VALIDO.test(telefono)) throw errorPublico(400, 'El teléfono debe tener 10 dígitos.');

    // El correo nuevo no puede ser de OTRA cuenta
    const [otros] = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE correo = ? AND id_usuario <> ?',
      [correo, idUsuario]
    );
    if (otros.length > 0) throw errorPublico(409, 'Ese correo ya lo usa otra cuenta.');

    await pool.query(
      'UPDATE usuarios SET nombre_completo = ?, correo = ?, telefono = ? WHERE id_usuario = ?',
      [nombre, correo, telefono, idUsuario]
    );

    // La sesión también guarda nombre y correo: se actualizan para que el menú muestre el nombre nuevo
    req.session.usuario.nombre_completo = nombre;
    req.session.usuario.correo = correo;

    const perfil = await buscarPerfil(idUsuario);
    res.json({ mensaje: 'Tus datos se guardaron.', perfil });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return next(errorPublico(409, 'Ese correo ya lo usa otra cuenta.'));
    next(err);
  }
});

module.exports = router;
