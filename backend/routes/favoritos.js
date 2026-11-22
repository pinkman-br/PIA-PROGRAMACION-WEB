// /api/favoritos  (responsable: Persona 3) — todas las rutas requieren sesión
// Tabla favoritos = la relación n-n entre usuarios y automoviles (Fase 2)
//
//   GET    /api/favoritos               → autos guardados por el usuario en sesión (para la pantalla Favoritos)
//   GET    /api/favoritos/ids           → solo los id de esos autos (para pintar los corazones del catálogo)
//   POST   /api/favoritos/:idAutomovil  → guarda un auto en favoritos
//   DELETE /api/favoritos/:idAutomovil  → lo quita de favoritos (el auto sigue en el catálogo)

const express = require('express');
const pool = require('../config/db');
const { requiereLogin } = require('../middleware/auth');

const router = express.Router();

function errorPublico(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  err.publico = mensaje;
  return err;
}

function leerIdAutomovil(req) {
  const id = Number(req.params.idAutomovil);
  if (!Number.isInteger(id) || id <= 0) throw errorPublico(400, 'Automóvil no válido.');
  return id;
}

router.use(requiereLogin);

// ---------- GET /api/favoritos ----------
router.get('/', async (req, res, next) => {
  try {
    const [filas] = await pool.query(
      `SELECT a.id_automovil, m.nombre AS marca, a.modelo, a.version, a.anio, a.precio,
              a.kilometraje, a.color, a.imagen_url, a.estatus,
              ft.transmision, ft.combustible, f.fecha_agregado
         FROM favoritos f
         JOIN automoviles a ON a.id_automovil = f.id_automovil
         JOIN marcas m ON m.id_marca = a.id_marca
         LEFT JOIN fichas_tecnicas ft ON ft.id_automovil = a.id_automovil
        WHERE f.id_usuario = ?
        ORDER BY f.fecha_agregado DESC`,
      [req.session.usuario.id_usuario]
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// ---------- GET /api/favoritos/ids ----------
// Va antes de "/:idAutomovil" para que "ids" no se tome como un id
router.get('/ids', async (req, res, next) => {
  try {
    const [filas] = await pool.query(
      'SELECT id_automovil FROM favoritos WHERE id_usuario = ?',
      [req.session.usuario.id_usuario]
    );
    res.json(filas.map((f) => f.id_automovil));
  } catch (err) {
    next(err);
  }
});

// ---------- POST /api/favoritos/:idAutomovil ----------
router.post('/:idAutomovil', async (req, res, next) => {
  try {
    const idAutomovil = leerIdAutomovil(req);
    await pool.query(
      'INSERT INTO favoritos (id_usuario, id_automovil) VALUES (?, ?)',
      [req.session.usuario.id_usuario, idAutomovil]
    );
    res.status(201).json({ mensaje: 'Guardado en tus favoritos.' });
  } catch (err) {
    // La llave primaria compuesta (id_usuario, id_automovil) no deja guardarlo dos veces
    if (err.code === 'ER_DUP_ENTRY') return res.json({ mensaje: 'Ya estaba en tus favoritos.' });
    // La llave foránea no deja guardar un automóvil que no existe
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return next(errorPublico(404, 'Ese automóvil no existe.'));
    next(err);
  }
});

// ---------- DELETE /api/favoritos/:idAutomovil ----------
router.delete('/:idAutomovil', async (req, res, next) => {
  try {
    const idAutomovil = leerIdAutomovil(req);
    // Solo se borra la fila de favoritos de ESTE usuario; el automóvil no se toca
    await pool.query(
      'DELETE FROM favoritos WHERE id_usuario = ? AND id_automovil = ?',
      [req.session.usuario.id_usuario, idAutomovil]
    );
    res.json({ mensaje: 'Se quitó de tus favoritos.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
