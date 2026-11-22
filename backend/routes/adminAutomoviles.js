// /api/admin/automoviles  (responsable: Persona 4) — CRUD 1 del proyecto
// Solo administrador: server.js ya pone requiereAdmin antes de este archivo.
//
//   GET    /api/admin/automoviles?q=texto    → todas las unidades (disponibles y vendidas)
//   GET    /api/admin/automoviles/marcas     → todas las marcas (para sugerirlas en el formulario)
//   GET    /api/admin/automoviles/:id        → una unidad con su ficha técnica (para editar)
//   POST   /api/admin/automoviles            → crea automóvil + ficha técnica (+ foto opcional)
//   PUT    /api/admin/automoviles/:id        → edita automóvil + ficha técnica (+ foto nueva opcional)
//   PATCH  /api/admin/automoviles/:id/estatus → cambia entre 'Disponible' y 'Vendido'
//   DELETE /api/admin/automoviles/:id        → elimina (si tiene citas, MySQL no deja: RESTRICT)
//
// POST y PUT reciben "multipart/form-data" (un formulario con archivo), por eso usan multer.

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const pool = require('../config/db');

const router = express.Router();

function errorPublico(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  err.publico = mensaje;
  return err;
}

// ---------- Subida de fotos ----------
// Se guardan en frontend/img/autos/ con un nombre único; en la base se guarda la ruta "img/autos/archivo.jpg"
const CARPETA_FOTOS = path.join(__dirname, '..', '..', 'frontend', 'img', 'autos');
const EXTENSIONES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const subirFoto = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(CARPETA_FOTOS, { recursive: true });
      cb(null, CARPETA_FOTOS);
    },
    filename: (req, file, cb) => {
      const nombre = `auto-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${EXTENSIONES[file.mimetype]}`;
      cb(null, nombre);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // máximo 5 MB
  fileFilter: (req, file, cb) => {
    if (EXTENSIONES[file.mimetype]) return cb(null, true);
    cb(errorPublico(400, 'La foto debe ser JPG, PNG o WEBP.'));
  }
}).single('imagen');

// Envuelve multer para convertir sus errores en mensajes claros
function recibirFormulario(req, res, next) {
  subirFoto(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(errorPublico(400, 'La foto no puede pesar más de 5 MB.'));
    }
    next(err);
  });
}

// Si algo falla después de subir la foto, se borra para no dejar archivos sueltos
function borrarFotoSubida(req) {
  if (req.file) fs.unlink(req.file.path, () => {});
}

// Borra una foto que ya no se usa, solo si fue subida desde el panel (empiezan con "auto-")
function borrarFotoAnterior(imagenUrl) {
  if (!imagenUrl || !imagenUrl.startsWith('img/autos/auto-')) return;
  fs.unlink(path.join(CARPETA_FOTOS, path.basename(imagenUrl)), () => {});
}

// ---------- Validación ----------
const TRANSMISIONES = ['Automática', 'Manual'];
const COMBUSTIBLES = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico'];
const ESTATUS = ['Disponible', 'Vendido'];

function texto(valor) {
  return String(valor ?? '').trim();
}
function enteroOpcional(valor) {
  const t = texto(valor);
  return t === '' ? null : Number(t);
}

function leerDatos(body) {
  const d = {
    marca: texto(body.marca),
    modelo: texto(body.modelo),
    version: texto(body.version) || null,
    anio: Number(body.anio),
    precio: Number(body.precio),
    kilometraje: Number(body.kilometraje || 0),
    color: texto(body.color),
    estatus: texto(body.estatus) || 'Disponible',
    destacado: body.destacado === 'true' || body.destacado === 'on' || body.destacado === true,
    transmision: texto(body.transmision),
    combustible: texto(body.combustible),
    motor: texto(body.motor) || null,
    carroceria: texto(body.carroceria) || null,
    puertas: enteroOpcional(body.puertas),
    pasajeros: enteroOpcional(body.pasajeros),
    descripcion: texto(body.descripcion) || null
  };

  if (d.marca.length < 2) throw errorPublico(400, 'Escribe la marca.');
  if (d.modelo.length < 1) throw errorPublico(400, 'Escribe el modelo.');
  if (!Number.isInteger(d.anio) || d.anio < 1990 || d.anio > 2100) throw errorPublico(400, 'El año debe estar entre 1990 y 2100.');
  if (!(d.precio > 0)) throw errorPublico(400, 'El precio debe ser mayor a 0.');
  if (!Number.isInteger(d.kilometraje) || d.kilometraje < 0) throw errorPublico(400, 'El kilometraje debe ser un número entero sin decimales.');
  if (d.color.length < 2) throw errorPublico(400, 'Escribe el color.');
  if (!ESTATUS.includes(d.estatus)) throw errorPublico(400, 'Estatus no válido.');
  if (!TRANSMISIONES.includes(d.transmision)) throw errorPublico(400, 'Elige la transmisión.');
  if (!COMBUSTIBLES.includes(d.combustible)) throw errorPublico(400, 'Elige el combustible.');
  for (const [campo, valor] of [['puertas', d.puertas], ['pasajeros', d.pasajeros]]) {
    if (valor !== null && (!Number.isInteger(valor) || valor < 1 || valor > 20)) {
      throw errorPublico(400, `El número de ${campo} no es válido.`);
    }
  }
  return d;
}

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw errorPublico(400, 'Automóvil no válido.');
  return id;
}

// Busca la marca por nombre; si no existe, la crea. Regresa su id.
async function idDeMarca(conexion, nombre) {
  const [filas] = await conexion.query('SELECT id_marca FROM marcas WHERE nombre = ?', [nombre]);
  if (filas.length > 0) return filas[0].id_marca;
  const [resultado] = await conexion.query('INSERT INTO marcas (nombre) VALUES (?)', [nombre]);
  return resultado.insertId;
}

const SELECT_COMPLETO = `
  SELECT a.id_automovil, a.id_marca, m.nombre AS marca, a.modelo, a.version, a.anio, a.precio,
         a.kilometraje, a.color, a.imagen_url, a.estatus, a.destacado, a.fecha_alta,
         f.transmision, f.combustible, f.motor, f.carroceria, f.puertas, f.pasajeros, f.descripcion
    FROM automoviles a
    JOIN marcas m ON m.id_marca = a.id_marca
    LEFT JOIN fichas_tecnicas f ON f.id_automovil = a.id_automovil`;

// ---------- GET / (lista con búsqueda) ----------
router.get('/', async (req, res, next) => {
  try {
    const q = texto(req.query.q);
    const [filas] = await pool.query(
      `${SELECT_COMPLETO}
        WHERE ? = '' OR CONCAT_WS(' ', m.nombre, a.modelo, a.version, a.color, a.anio) LIKE ?
        ORDER BY a.estatus, a.fecha_alta DESC, a.id_automovil DESC`,
      [q, '%' + q + '%']
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// ---------- GET /marcas ----------
// Va antes de "/:id" para que la palabra "marcas" no se tome como un id
router.get('/marcas', async (req, res, next) => {
  try {
    const [filas] = await pool.query('SELECT id_marca, nombre FROM marcas ORDER BY nombre');
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// ---------- GET /:id ----------
router.get('/:id', async (req, res, next) => {
  try {
    const [filas] = await pool.query(`${SELECT_COMPLETO} WHERE a.id_automovil = ?`, [leerId(req)]);
    if (filas.length === 0) throw errorPublico(404, 'Ese automóvil no existe.');
    res.json(filas[0]);
  } catch (err) {
    next(err);
  }
});

// ---------- POST / (crear) ----------
// Se usa una TRANSACCIÓN: el automóvil y su ficha se guardan juntos; si uno falla, no se guarda ninguno.
router.post('/', recibirFormulario, async (req, res, next) => {
  let conexion;
  try {
    const d = leerDatos(req.body);
    const imagen = req.file ? 'img/autos/' + req.file.filename : null;

    conexion = await pool.getConnection();
    await conexion.beginTransaction();

    const idMarca = await idDeMarca(conexion, d.marca);
    const [resultado] = await conexion.query(
      `INSERT INTO automoviles (id_marca, modelo, version, anio, precio, kilometraje, color, imagen_url, estatus, destacado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [idMarca, d.modelo, d.version, d.anio, d.precio, d.kilometraje, d.color, imagen, d.estatus, d.destacado]
    );
    const id = resultado.insertId;

    await conexion.query(
      `INSERT INTO fichas_tecnicas (id_automovil, transmision, combustible, motor, carroceria, puertas, pasajeros, descripcion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, d.transmision, d.combustible, d.motor, d.carroceria, d.puertas, d.pasajeros, d.descripcion]
    );

    await conexion.commit();
    res.status(201).json({ mensaje: 'Automóvil agregado.', id_automovil: id });
  } catch (err) {
    if (conexion) await conexion.rollback();
    borrarFotoSubida(req);
    next(err);
  } finally {
    if (conexion) conexion.release();
  }
});

// ---------- PUT /:id (editar) ----------
router.put('/:id', recibirFormulario, async (req, res, next) => {
  let conexion;
  try {
    const id = leerId(req);
    const d = leerDatos(req.body);

    conexion = await pool.getConnection();
    await conexion.beginTransaction();

    const [existe] = await conexion.query('SELECT imagen_url FROM automoviles WHERE id_automovil = ?', [id]);
    if (existe.length === 0) throw errorPublico(404, 'Ese automóvil no existe.');
    // Si no se subió foto nueva, se conserva la anterior
    const imagen = req.file ? 'img/autos/' + req.file.filename : existe[0].imagen_url;

    const idMarca = await idDeMarca(conexion, d.marca);
    await conexion.query(
      `UPDATE automoviles
          SET id_marca = ?, modelo = ?, version = ?, anio = ?, precio = ?, kilometraje = ?,
              color = ?, imagen_url = ?, estatus = ?, destacado = ?
        WHERE id_automovil = ?`,
      [idMarca, d.modelo, d.version, d.anio, d.precio, d.kilometraje, d.color, imagen, d.estatus, d.destacado, id]
    );

    // La ficha se actualiza; si por alguna razón no existía, se crea (relación 1-1)
    await conexion.query(
      `INSERT INTO fichas_tecnicas (id_automovil, transmision, combustible, motor, carroceria, puertas, pasajeros, descripcion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE transmision = VALUES(transmision), combustible = VALUES(combustible),
         motor = VALUES(motor), carroceria = VALUES(carroceria), puertas = VALUES(puertas),
         pasajeros = VALUES(pasajeros), descripcion = VALUES(descripcion)`,
      [id, d.transmision, d.combustible, d.motor, d.carroceria, d.puertas, d.pasajeros, d.descripcion]
    );

    await conexion.commit();
    if (req.file) borrarFotoAnterior(existe[0].imagen_url); // la foto vieja ya no se usa
    res.json({ mensaje: 'Automóvil actualizado.' });
  } catch (err) {
    if (conexion) await conexion.rollback();
    borrarFotoSubida(req);
    next(err);
  } finally {
    if (conexion) conexion.release();
  }
});

// ---------- PATCH /:id/estatus (Vendido / Activar) ----------
router.patch('/:id/estatus', async (req, res, next) => {
  try {
    const id = leerId(req);
    const estatus = texto(req.body.estatus);
    if (!ESTATUS.includes(estatus)) throw errorPublico(400, 'Estatus no válido.');

    const [resultado] = await pool.query('UPDATE automoviles SET estatus = ? WHERE id_automovil = ?', [estatus, id]);
    if (resultado.affectedRows === 0) throw errorPublico(404, 'Ese automóvil no existe.');
    res.json({ mensaje: estatus === 'Vendido' ? 'Marcado como vendido: ya no aparece en el catálogo.' : 'Activado: vuelve a aparecer en el catálogo.' });
  } catch (err) {
    next(err);
  }
});

// ---------- DELETE /:id ----------
router.delete('/:id', async (req, res, next) => {
  try {
    const id = leerId(req);
    const [existe] = await pool.query('SELECT imagen_url FROM automoviles WHERE id_automovil = ?', [id]);
    if (existe.length === 0) throw errorPublico(404, 'Ese automóvil no existe.');
    await pool.query('DELETE FROM automoviles WHERE id_automovil = ?', [id]);
    // Su ficha técnica y los favoritos se borran solos (ON DELETE CASCADE)
    borrarFotoAnterior(existe[0].imagen_url);
    res.json({ mensaje: 'Automóvil eliminado.' });
  } catch (err) {
    // citas.id_automovil tiene ON DELETE RESTRICT: un auto con citas no se puede borrar
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return next(errorPublico(409, 'Este automóvil tiene citas registradas y no se puede eliminar. Márcalo como Vendido.'));
    }
    next(err);
  }
});

module.exports = router;
