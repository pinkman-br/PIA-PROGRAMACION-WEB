// GET /api/salud  (responsable: Persona 1)
// Ruta de prueba: confirma que el servidor y la base de datos responden.
// Ábranla en el navegador: http://localhost:3000/api/salud

const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [[conteo]] = await pool.query(
      `SELECT (SELECT COUNT(*) FROM automoviles) AS automoviles,
              (SELECT COUNT(*) FROM usuarios)    AS usuarios,
              (SELECT COUNT(*) FROM citas)       AS citas`
    );
    res.json({ servidor: 'ok', baseDeDatos: 'ok', registros: conteo });
  } catch (err) {
    res.status(500).json({ servidor: 'ok', baseDeDatos: 'error', detalle: err.message });
  }
});

module.exports = router;
