// Middlewares de acceso (responsable: Persona 1)
// Se ponen antes de una ruta para protegerla:
//   router.get('/', requiereLogin, async (req, res) => { ... });
//
// Cuando el login esté listo, la sesión guardará:
//   req.session.usuario = { id_usuario, nombre_completo, correo, id_rol, rol }

const ROL_ADMIN = 1;
const ROL_USUARIO = 2;

// Solo deja pasar si hay sesión iniciada.
function requiereLogin(req, res, next) {
  if (req.session && req.session.usuario) return next();
  return res.status(401).json({ error: 'Debes iniciar sesión.' });
}

// Solo deja pasar si la sesión es de un administrador.
function requiereAdmin(req, res, next) {
  if (req.session && req.session.usuario && req.session.usuario.id_rol === ROL_ADMIN) {
    return next();
  }
  return res.status(403).json({ error: 'Solo el administrador puede hacer esto.' });
}

module.exports = { requiereLogin, requiereAdmin, ROL_ADMIN, ROL_USUARIO };
