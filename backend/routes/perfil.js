// /api/perfil  (requiere sesión)  (responsable: Persona 1)
//
// Rutas que van en este archivo:
//   GET /api/perfil   → datos del usuario en sesión (sin la contraseña)
//   PUT /api/perfil   → actualiza nombre_completo, telefono (y correo si no está repetido)
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
const { requiereLogin } = require('../middleware/auth');
const router = express.Router();

// TODO: escribir aquí las rutas de este módulo.

module.exports = router;
