// /api/admin/usuarios  (solo administrador)  (responsable: Persona 3)
//
// Rutas que van en este archivo:
//   GET    /        → lista de usuarios con su rol (JOIN roles), sin contraseñas
//   POST   /        → crea usuario (por ejemplo, otro administrador)
//   PUT    /:id     → edita datos y rol
//   PATCH  /:id/activo → activa / desactiva la cuenta
//   DELETE /:id     → elimina (sus favoritos y citas se borran solos por CASCADE)
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
