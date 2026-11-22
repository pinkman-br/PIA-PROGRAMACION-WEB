// /api/citas  (responsable: Persona 5) — todas las rutas requieren sesión
//
//   GET   /api/citas/horarios?id_automovil=&fecha=  → horas de ese día y si están libres para ese auto
//   POST  /api/citas                               → crea la cita con estatus 'Pendiente'
//   GET   /api/citas/mias                          → citas del usuario en sesión (pantalla Mis citas)
//   PATCH /api/citas/:id/cancelar                  → el usuario cancela SU cita
//
// Nombre, correo y teléfono NO se guardan en la cita: salen del usuario con un JOIN (Fase 2).

const express = require('express');
const pool = require('../config/db');
const { requiereLogin } = require('../middleware/auth');
const { horasDelDia, yaPaso, revisarFechaHora } = require('../utils/horarios');

const router = express.Router();

// Estatus en los que la cita sigue "viva" (ocupa el horario y se puede cancelar)
const ACTIVAS = ['Pendiente', 'Confirmada', 'Reprogramada'];

function errorPublico(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  err.publico = mensaje;
  return err;
}

router.use(requiereLogin);

// Horas ya ocupadas de un auto en una fecha (sin contar una cita, para cuando se reprograma)
async function horasOcupadas(idAutomovil, fecha, excluirIdCita = 0) {
  const [filas] = await pool.query(
    `SELECT TIME_FORMAT(hora, '%H:%i') AS hora FROM citas
      WHERE id_automovil = ? AND fecha = ? AND estatus IN (?) AND id_cita <> ?`,
    [idAutomovil, fecha, ACTIVAS, excluirIdCita]
  );
  return filas.map((f) => f.hora);
}

// ---------- GET /api/citas/horarios ----------
router.get('/horarios', async (req, res, next) => {
  try {
    const idAutomovil = Number(req.query.id_automovil);
    const fecha = String(req.query.fecha || '');
    const horas = horasDelDia(fecha);
    const ocupadas = idAutomovil ? await horasOcupadas(idAutomovil, fecha) : [];
    res.json(horas.map((hora) => ({
      hora,
      disponible: !ocupadas.includes(hora) && !yaPaso(fecha, hora)
    })));
  } catch (err) {
    next(err);
  }
});

// ---------- POST /api/citas ----------
router.post('/', async (req, res, next) => {
  try {
    const idUsuario = req.session.usuario.id_usuario;
    const idAutomovil = Number(req.body.id_automovil);
    const fecha = String(req.body.fecha || '');
    const hora = String(req.body.hora || '');
    const comentario = String(req.body.comentario || '').trim().slice(0, 300) || null;

    if (!Number.isInteger(idAutomovil) || idAutomovil <= 0) throw errorPublico(400, 'Elige un automóvil.');
    const problema = revisarFechaHora(fecha, hora);
    if (problema) throw errorPublico(400, problema);

    // El auto debe existir y estar disponible
    const [autos] = await pool.query('SELECT estatus FROM automoviles WHERE id_automovil = ?', [idAutomovil]);
    if (autos.length === 0) throw errorPublico(404, 'Ese automóvil no existe.');
    if (autos[0].estatus !== 'Disponible') throw errorPublico(409, 'Ese automóvil ya se vendió.');

    // Un usuario no puede tener dos citas activas para el mismo auto
    const [repetidas] = await pool.query(
      'SELECT id_cita FROM citas WHERE id_usuario = ? AND id_automovil = ? AND estatus IN (?)',
      [idUsuario, idAutomovil, ACTIVAS]
    );
    if (repetidas.length > 0) throw errorPublico(409, 'Ya tienes una cita activa para este automóvil. Revísala en Mis citas.');

    // El mismo auto no puede tener dos pruebas a la misma hora
    if ((await horasOcupadas(idAutomovil, fecha)).includes(hora.slice(0, 5))) {
      throw errorPublico(409, 'Ese horario ya está ocupado para este automóvil. Elige otra hora.');
    }

    const [resultado] = await pool.query(
      `INSERT INTO citas (id_usuario, id_automovil, fecha, hora, comentario)
       VALUES (?, ?, ?, ?, ?)`,
      [idUsuario, idAutomovil, fecha, hora, comentario]
    );
    res.status(201).json({ mensaje: 'Tu solicitud se envió. Quedará pendiente hasta que la agencia la confirme.', id_cita: resultado.insertId });
  } catch (err) {
    next(err);
  }
});

// ---------- GET /api/citas/mias ----------
router.get('/mias', async (req, res, next) => {
  try {
    const [filas] = await pool.query(
      `SELECT c.id_cita, c.fecha, TIME_FORMAT(c.hora, '%H:%i') AS hora, c.comentario, c.estatus,
              c.fecha_solicitud, c.fecha_actualizacion,
              a.id_automovil, m.nombre AS marca, a.modelo, a.version, a.anio, a.precio, a.color, a.imagen_url
         FROM citas c
         JOIN automoviles a ON a.id_automovil = c.id_automovil
         JOIN marcas m ON m.id_marca = a.id_marca
        WHERE c.id_usuario = ?
        ORDER BY c.fecha DESC, c.hora DESC`,
      [req.session.usuario.id_usuario]
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// ---------- PATCH /api/citas/:id/cancelar ----------
router.patch('/:id/cancelar', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    // El WHERE incluye id_usuario: nadie puede cancelar la cita de otra persona
    const [filas] = await pool.query(
      'SELECT estatus, fecha, TIME_FORMAT(hora, "%H:%i") AS hora FROM citas WHERE id_cita = ? AND id_usuario = ?',
      [id, req.session.usuario.id_usuario]
    );
    if (filas.length === 0) throw errorPublico(404, 'Esa cita no existe.');
    const cita = filas[0];
    if (!ACTIVAS.includes(cita.estatus)) throw errorPublico(409, 'Esa cita ya está cancelada.');
    if (yaPaso(cita.fecha, cita.hora)) throw errorPublico(409, 'Esa cita ya pasó y no se puede cancelar.');

    await pool.query("UPDATE citas SET estatus = 'Cancelada' WHERE id_cita = ?", [id]);
    res.json({ mensaje: 'Cita cancelada.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
