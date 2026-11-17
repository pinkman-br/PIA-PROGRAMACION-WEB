// /api/admin/automoviles  (solo administrador; server.js ya aplica requiereAdmin)  (responsable: Persona 3)
//
// Rutas que van en este archivo:
//   GET    /                → todas las unidades (disponibles y vendidas)
//   POST   /                → crea automóvil + su ficha técnica (usar transacción)
//   PUT    /:id             → edita automóvil y ficha
//   PATCH  /:id/estatus     → cambia entre 'Disponible' y 'Vendido'
//   DELETE /:id             → elimina; si tiene citas MySQL lo impide (RESTRICT): avisar que se marque como Vendido
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
