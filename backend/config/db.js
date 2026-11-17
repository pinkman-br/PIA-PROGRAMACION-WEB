// Conexión a MySQL (responsable: Persona 1)
// Usa un "pool": un grupo de conexiones que se reutilizan en lugar de abrir una nueva en cada consulta.
//
// Cómo usarlo en cualquier ruta:
//   const pool = require('../config/db');
//   const [filas] = await pool.query('SELECT * FROM automoviles WHERE id_automovil = ?', [id]);
//
// IMPORTANTE: siempre pasen los valores con "?" y el arreglo de parámetros.
// Nunca peguen texto del usuario directo en el SQL (eso permite inyección SQL).

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'seminuevos_db',
  charset: 'utf8mb4',
  // Devuelve DATE, TIME y DATETIME como texto ("2026-11-20", "16:00:00")
  // para que no cambien por la zona horaria al mostrarlos en la página.
  dateStrings: true,
  // Devuelve DECIMAL (precio) como número y no como texto.
  decimalNumbers: true,
  waitForConnections: true,
  connectionLimit: 10
});

// Se llama al arrancar el servidor para avisar si la conexión falla.
async function probarConexion() {
  const [filas] = await pool.query('SELECT DATABASE() AS base, VERSION() AS version');
  return filas[0];
}

module.exports = pool;
module.exports.probarConexion = probarConexion;
