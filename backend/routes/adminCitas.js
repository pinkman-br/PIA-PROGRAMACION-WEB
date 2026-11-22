// /api/admin/citas  (responsable: Persona 5)
// Solo administrador: server.js ya pone requiereAdmin antes de este archivo.
//
//   GET    /api/admin/citas?estatus=&q=  → todas las citas con nombre, teléfono, correo y automóvil (JOIN)
//   PATCH  /api/admin/citas/:id          → Confirmada / Cancelada, o Reprogramada con nueva fecha y hora
//   DELETE /api/admin/citas/:id          → elimina la cita

const express = require('express');
const pool = require('../config/db');
const { revisarFechaHora } = require('../utils/horarios');

const router = express.Router();

const ESTATUS = ['Pendiente', 'Confirmada', 'Reprogramada', 'Cancelada'];
const ACTIVAS = ['Pendiente', 'Confirmada', 'Reprogramada'];

function errorPublico(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  err.publico = mensaje;
  return err;
}

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw errorPublico(400, 'Cita no válida.');
  return id;
}

// ---------- GET / ----------
router.get('/', async (req, res, next) => {
  try {
    const condiciones = [];
    const valores = [];

    const estatus = String(req.query.estatus || '');
    if (estatus) {
      if (!ESTATUS.includes(estatus)) throw errorPublico(400, 'Estatus no válido.');
      condiciones.push('c.estatus = ?');
      valores.push(estatus);
    }

    // Buscar por nombre, teléfono o correo del usuario, o por el automóvil
    const q = String(req.query.q || '').trim();
    if (q) {
      condiciones.push("CONCAT_WS(' ', u.nombre_completo, u.telefono, u.correo, m.nombre, a.modelo, a.anio) LIKE ?");
      valores.push('%' + q + '%');
    }

    const [filas] = await pool.query(
      `SELECT c.id_cita, c.fecha, TIME_FORMAT(c.hora, '%H:%i') AS hora, c.comentario, c.estatus,
              c.fecha_solicitud, c.fecha_actualizacion,
              u.id_usuario, u.nombre_completo, u.telefono, u.correo,
              a.id_automovil, m.nombre AS marca, a.modelo, a.version, a.anio, a.color
         FROM citas c
         JOIN usuarios u    ON u.id_usuario   = c.id_usuario
         JOIN automoviles a ON a.id_automovil = c.id_automovil
         JOIN marcas m      ON m.id_marca     = a.id_marca
        ${condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : ''}
        ORDER BY FIELD(c.estatus, 'Pendiente', 'Reprogramada', 'Confirmada', 'Cancelada'), c.fecha, c.hora`,
      valores
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// ---------- PATCH /:id ----------
router.patch('/:id', async (req, res, next) => {
  try {
    const id = leerId(req);
    const estatus = String(req.body.estatus || '');
    if (!['Confirmada', 'Reprogramada', 'Cancelada'].includes(estatus)) throw errorPublico(400, 'Acción no válida.');

    const [filas] = await pool.query('SELECT id_automovil, estatus FROM citas WHERE id_cita = ?', [id]);
    if (filas.length === 0) throw errorPublico(404, 'Esa cita no existe.');
    const cita = filas[0];
    if (cita.estatus === 'Cancelada' && estatus !== 'Reprogramada') {
      throw errorPublico(409, 'La cita está cancelada. Para retomarla, reprográmala con una fecha nueva.');
    }

    if (estatus === 'Reprogramada') {
      const fecha = String(req.body.fecha || '');
      const hora = String(req.body.hora || '');
      const problema = revisarFechaHora(fecha, hora);
      if (problema) throw errorPublico(400, problema);

      // El nuevo horario no puede chocar con otra cita activa del mismo auto
      const [choques] = await pool.query(
        `SELECT id_cita FROM citas
          WHERE id_automovil = ? AND fecha = ? AND TIME_FORMAT(hora, '%H:%i') = ? AND estatus IN (?) AND id_cita <> ?`,
        [cita.id_automovil, fecha, hora.slice(0, 5), ACTIVAS, id]
      );
      if (choques.length > 0) throw errorPublico(409, 'Ese horario ya está ocupado para este automóvil.');

      await pool.query("UPDATE citas SET estatus = 'Reprogramada', fecha = ?, hora = ? WHERE id_cita = ?", [fecha, hora, id]);
      return res.json({ mensaje: 'Cita reprogramada.' });
    }

    await pool.query('UPDATE citas SET estatus = ? WHERE id_cita = ?', [estatus, id]);
    res.json({ mensaje: estatus === 'Confirmada' ? 'Cita confirmada.' : 'Cita cancelada.' });
  } catch (err) {
    next(err);
  }
});

// ---------- DELETE /:id ----------
router.delete('/:id', async (req, res, next) => {
  try {
    const [resultado] = await pool.query('DELETE FROM citas WHERE id_cita = ?', [leerId(req)]);
    if (resultado.affectedRows === 0) throw errorPublico(404, 'Esa cita no existe.');
    res.json({ mensaje: 'Cita eliminada.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
