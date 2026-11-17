// /api  (rutas públicas del catálogo)  (responsable: Persona 2)
//
// Rutas que van en este archivo:
//   GET /api/marcas                 → lista de marcas para el filtro
//   GET /api/automoviles            → catálogo con filtros ?marca=&precioMax=&anioMin=&q=  (solo estatus 'Disponible')
//   GET /api/automoviles/destacados → unidades con destacado = TRUE para el Inicio
//   GET /api/automoviles/:id        → detalle con JOIN a marcas y fichas_tecnicas
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
