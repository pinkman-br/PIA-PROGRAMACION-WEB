// /api/citas  (requiere sesión)  (responsable: Persona 4)
//
// Rutas que van en este archivo:
//   POST  /              → crea cita { id_automovil, fecha, hora, comentario } con estatus 'Pendiente'
//   GET   /mias          → citas del usuario en sesión con datos del automóvil
//   PATCH /:id/cancelar  → el usuario cancela su propia cita
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
