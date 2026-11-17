// Servidor principal (responsable: Persona 1)
// Arranca Express, sirve las pantallas de /frontend y monta las rutas de la API.
//
// Todas las rutas de los 4 integrantes ya están montadas aquí abajo,
// así nadie tiene que editar este archivo y se evitan conflictos en Git.
// Cada quien trabaja solo en SU archivo dentro de backend/routes/.

require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const { probarConexion } = require('./config/db');
const { requiereAdmin } = require('./middleware/auth');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ---- Configuración general ----
app.use(express.json());                          // Lee cuerpos JSON (fetch con JSON.stringify)
app.use(express.urlencoded({ extended: true }));  // Lee formularios HTML normales

app.use(session({
  secret: process.env.SESSION_SECRET || 'solo_para_desarrollo',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,           // JavaScript de la página no puede leer la cookie
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8 // La sesión dura 8 horas
  }
}));

// ---- Pantallas (frontend) ----
// /catalogo abre frontend/catalogo.html (no hace falta escribir .html)
app.use(express.static(path.join(__dirname, '..', 'frontend'), { extensions: ['html'] }));

// ---- API ----
// Persona 1
app.use('/api/salud',    require('./routes/salud'));
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/perfil',   require('./routes/perfil'));
// Persona 2
app.use('/api',          require('./routes/catalogo'));
// Persona 3 (solo administrador)
app.use('/api/admin/automoviles', requiereAdmin, require('./routes/adminAutomoviles'));
app.use('/api/admin/usuarios',    requiereAdmin, require('./routes/adminUsuarios'));
// Persona 4
app.use('/api/favoritos', require('./routes/favoritos'));
app.use('/api/citas',     require('./routes/citas'));
app.use('/api/admin/citas', requiereAdmin, require('./routes/adminCitas'));

// Ruta de API que no existe
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada: ' + req.method + ' ' + req.originalUrl });
});

// Manejo de errores: si una ruta lanza un error, aquí se responde en lugar de tumbar el servidor.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.publico || 'Ocurrió un error en el servidor.' });
});

// ---- Arranque ----
app.listen(PORT, async () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
  try {
    const info = await probarConexion();
    console.log(`Conectado a MySQL ${info.version} - base de datos: ${info.base}`);
  } catch (e) {
    console.error('NO se pudo conectar a MySQL:', e.message);
    console.error('Revisa tu archivo .env (puerto, usuario y contraseña) y que el servicio de MySQL esté encendido.');
  }
});
