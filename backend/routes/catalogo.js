// /api  (responsable: Persona 2) — rutas públicas del catálogo, no piden sesión
//
//   GET /api/marcas                  → marcas que tienen unidades disponibles (para el filtro)
//   GET /api/automoviles             → catálogo con filtros: ?marca=&precioMax=&anioMin=&q=&orden=
//   GET /api/automoviles/destacados  → unidades marcadas como destacadas (para el Inicio)
//   GET /api/automoviles/:id         → detalle de un automóvil con su ficha técnica
//
// Las usan: Inicio (Persona 2), Catálogo y Detalle (Persona 3).

const express = require('express');
const pool = require('../config/db');

const router = express.Router();

function errorPublico(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  err.publico = mensaje;
  return err;
}

// Columnas que necesita una tarjeta del catálogo (JOIN con marcas y con la ficha técnica)
const COLUMNAS_TARJETA = `
  a.id_automovil, m.nombre AS marca, a.modelo, a.version, a.anio, a.precio,
  a.kilometraje, a.color, a.imagen_url, a.estatus,
  f.transmision, f.combustible`;

const FROM_TARJETA = `
  FROM automoviles a
  JOIN marcas m ON m.id_marca = a.id_marca
  LEFT JOIN fichas_tecnicas f ON f.id_automovil = a.id_automovil`;

// Órdenes permitidos. El orden se elige de esta lista y nunca se pega texto del usuario en el SQL.
const ORDENES = {
  recientes: 'a.fecha_alta DESC, a.id_automovil DESC',
  precio_asc: 'a.precio ASC',
  precio_desc: 'a.precio DESC',
  anio_desc: 'a.anio DESC, a.precio ASC'
};

// ---------- GET /api/marcas ----------
router.get('/marcas', async (req, res, next) => {
  try {
    const [filas] = await pool.query(
      `SELECT m.id_marca, m.nombre, COUNT(a.id_automovil) AS disponibles
         FROM marcas m
         JOIN automoviles a ON a.id_marca = m.id_marca AND a.estatus = 'Disponible'
        GROUP BY m.id_marca, m.nombre
        ORDER BY m.nombre`
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// ---------- GET /api/automoviles (catálogo con filtros) ----------
router.get('/automoviles', async (req, res, next) => {
  try {
    // Solo se muestran unidades disponibles. Cada filtro se agrega solo si viene en la URL.
    const condiciones = ["a.estatus = 'Disponible'"];
    const valores = [];

    const marca = String(req.query.marca || '').trim();
    if (marca) {
      condiciones.push('m.nombre = ?');
      valores.push(marca);
    }

    const precioMax = Number(req.query.precioMax);
    if (precioMax > 0) {
      condiciones.push('a.precio <= ?');
      valores.push(precioMax);
    }

    const anioMin = Number(req.query.anioMin);
    if (anioMin > 0) {
      condiciones.push('a.anio >= ?');
      valores.push(anioMin);
    }

    // Buscador de texto: busca en marca, modelo, versión y color
    const q = String(req.query.q || '').trim();
    if (q) {
      condiciones.push("CONCAT_WS(' ', m.nombre, a.modelo, a.version, a.color) LIKE ?");
      valores.push('%' + q + '%');
    }

    const orden = ORDENES[req.query.orden] || ORDENES.recientes;

    const [filas] = await pool.query(
      `SELECT ${COLUMNAS_TARJETA} ${FROM_TARJETA}
        WHERE ${condiciones.join(' AND ')}
        ORDER BY ${orden}`,
      valores
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// ---------- GET /api/automoviles/destacados ----------
// Va antes de "/automoviles/:id" para que la palabra "destacados" no se tome como un id
router.get('/automoviles/destacados', async (req, res, next) => {
  try {
    const [filas] = await pool.query(
      `SELECT ${COLUMNAS_TARJETA} ${FROM_TARJETA}
        WHERE a.estatus = 'Disponible' AND a.destacado = TRUE
        ORDER BY a.fecha_alta DESC, a.id_automovil DESC
        LIMIT 6`
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// ---------- GET /api/automoviles/:id (detalle) ----------
router.get('/automoviles/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw errorPublico(400, 'Automóvil no válido.');

    const [filas] = await pool.query(
      `SELECT ${COLUMNAS_TARJETA},
              f.motor, f.carroceria, f.puertas, f.pasajeros, f.descripcion
         ${FROM_TARJETA}
        WHERE a.id_automovil = ?`,
      [id]
    );
    if (filas.length === 0) throw errorPublico(404, 'Ese automóvil no existe.');
    // Se regresa aunque esté vendido: la pantalla de Detalle avisa que ya no está disponible
    res.json(filas[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
