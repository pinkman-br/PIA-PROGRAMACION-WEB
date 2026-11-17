// /api/favoritos  (requiere sesión)  (responsable: Persona 4)
//
// Rutas que van en este archivo:
//   GET    /                 → favoritos del usuario en sesión (JOIN automoviles y marcas)
//   POST   /:idAutomovil     → agrega (si ya existe, MySQL lanza ER_DUP_ENTRY: responder que ya estaba)
//   DELETE /:idAutomovil     → quita de favoritos (no borra el automóvil)
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
