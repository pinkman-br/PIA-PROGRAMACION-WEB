// /api/auth  (responsable: Persona 1)
//
// Rutas que van en este archivo:
//   POST /api/auth/registro   → crea cuenta (contraseña con bcryptjs.hash, rol 2 = Usuario)
//   POST /api/auth/login      → compara con bcryptjs.compare y guarda req.session.usuario
//   POST /api/auth/logout     → req.session.destroy()
//   GET  /api/auth/sesion     → devuelve quién tiene la sesión (o null) para armar el menú
//
// Ejemplo de cómo se escribe una ruta:
//
//   router.get('/', async (req, res, next) => {
//     try {
//       const [filas] = await pool.query('SELECT ... WHERE columna = ?', [valor]);
//       res.json(filas);
//     } catch (err) {
//       next(err); // lo atiende el manejador de errores de server.js
//     }
//   });

const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// TODO: escribir aquí las rutas de este módulo.

module.exports = router;
