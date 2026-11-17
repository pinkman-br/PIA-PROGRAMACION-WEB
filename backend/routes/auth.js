// /api/auth  (responsable: Persona 1)
//
//   POST /api/auth/registro   → crea una cuenta de Usuario (rol 2) con la contraseña cifrada
//   POST /api/auth/login      → revisa correo y contraseña e inicia la sesión
//   POST /api/auth/logout     → cierra la sesión
//   GET  /api/auth/sesion     → dice quién tiene la sesión (o null); lo usan las pantallas para armar el menú

const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { ROL_USUARIO } = require('../middleware/auth');

const router = express.Router();

// "Costo" del cifrado: cuántas vueltas da bcrypt. 10 es el valor usual (rápido para el usuario, lento para un atacante).
const RONDAS_BCRYPT = 10;

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_VALIDO = /^\d{10}$/;

// Error con un mensaje que sí se le puede mostrar al usuario.
function errorPublico(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  err.publico = mensaje;
  return err;
}

// Lo que se guarda en la sesión: nunca la contraseña.
function datosDeSesion(u) {
  return {
    id_usuario: u.id_usuario,
    nombre_completo: u.nombre_completo,
    correo: u.correo,
    id_rol: u.id_rol,
    rol: u.rol
  };
}

// ---------- POST /api/auth/registro ----------
router.post('/registro', async (req, res, next) => {
  try {
    const nombre = String(req.body.nombre_completo || '').trim();
    const correo = String(req.body.correo || '').trim().toLowerCase();
    const telefono = String(req.body.telefono || '').replace(/\D/g, ''); // deja solo números
    const contrasena = String(req.body.contrasena || '');

    // Validaciones (también se hacen en la pantalla, pero el servidor nunca confía en el navegador)
    if (nombre.length < 3) throw errorPublico(400, 'Escribe tu nombre completo.');
    if (!CORREO_VALIDO.test(correo)) throw errorPublico(400, 'El correo no es válido.');
    if (!TELEFONO_VALIDO.test(telefono)) throw errorPublico(400, 'El teléfono debe tener 10 dígitos.');
    if (contrasena.length < 8) throw errorPublico(400, 'La contraseña debe tener al menos 8 caracteres.');

    // ¿Ya existe una cuenta con ese correo?
    const [existentes] = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = ?', [correo]);
    if (existentes.length > 0) throw errorPublico(409, 'Ya existe una cuenta con ese correo.');

    // Cifrar la contraseña y guardar la cuenta como Usuario (rol 2)
    const hash = await bcrypt.hash(contrasena, RONDAS_BCRYPT);
    const [resultado] = await pool.query(
      `INSERT INTO usuarios (id_rol, nombre_completo, correo, telefono, contrasena_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [ROL_USUARIO, nombre, correo, telefono, hash]
    );

    res.status(201).json({ mensaje: 'Cuenta creada. Ya puedes iniciar sesión.', id_usuario: resultado.insertId });
  } catch (err) {
    // Si dos personas se registran con el mismo correo al mismo tiempo, MySQL lo frena con la llave UNIQUE.
    if (err.code === 'ER_DUP_ENTRY') return next(errorPublico(409, 'Ya existe una cuenta con ese correo.'));
    next(err);
  }
});

// ---------- POST /api/auth/login ----------
router.post('/login', async (req, res, next) => {
  try {
    const correo = String(req.body.correo || '').trim().toLowerCase();
    const contrasena = String(req.body.contrasena || '');
    if (!correo || !contrasena) throw errorPublico(400, 'Escribe tu correo y tu contraseña.');

    // JOIN con roles para saber el nombre del rol (Administrador / Usuario)
    const [filas] = await pool.query(
      `SELECT u.id_usuario, u.nombre_completo, u.correo, u.id_rol, u.contrasena_hash, u.activo,
              r.nombre AS rol
         FROM usuarios u
         JOIN roles r ON r.id_rol = u.id_rol
        WHERE u.correo = ?`,
      [correo]
    );
    const usuario = filas[0];

    // Mismo mensaje si el correo no existe o si la contraseña está mal:
    // así nadie puede averiguar qué correos están registrados.
    const coincide = usuario ? await bcrypt.compare(contrasena, usuario.contrasena_hash) : false;
    if (!coincide) throw errorPublico(401, 'Correo o contraseña incorrectos.');
    if (!usuario.activo) throw errorPublico(403, 'Tu cuenta está desactivada. Contacta a la agencia.');

    // Se crea una sesión nueva al entrar (evita que alguien reutilice una sesión anterior)
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.usuario = datosDeSesion(usuario);
      res.json({ mensaje: 'Bienvenido, ' + usuario.nombre_completo, usuario: req.session.usuario });
    });
  } catch (err) {
    next(err);
  }
});

// ---------- POST /api/auth/logout ----------
router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.json({ mensaje: 'Sesión cerrada.' });
  });
});

// ---------- GET /api/auth/sesion ----------
router.get('/sesion', (req, res) => {
  res.json({ usuario: (req.session && req.session.usuario) || null });
});

module.exports = router;
