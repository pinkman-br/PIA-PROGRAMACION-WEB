// /api/admin/citas  (solo administrador)  (responsable: Persona 4)
//
// Rutas que van en este archivo:
//   GET    /?estatus=     → todas las citas con nombre, teléfono y automóvil (JOIN)
//   PATCH  /:id           → cambia estatus: Confirmada / Reprogramada (con nueva fecha y hora) / Cancelada
//   DELETE /:id           → elimina la cita
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
