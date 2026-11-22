# Seminuevos: proyecto final de Programación Web

Página web para una agencia de autos seminuevos. Los visitantes consultan el catálogo; los usuarios registrados guardan favoritos y agendan pruebas de manejo; el administrador gestiona automóviles, citas y usuarios.

FIME UANL · Programación Web · Grupo 013 · Equipo 1 · Ing. Luis Daniel Lepe Rodríguez

## Tecnologías

| Parte | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, Bootstrap 5.3 (desde CDN), JavaScript (`fetch`) |
| Backend | Node.js 18 o superior con Express 4 |
| Base de datos | MySQL 8 o superior (probado también en MariaDB 10.11) |
| Librerías del backend | mysql2 (conexión a MySQL), express-session (sesiones), bcryptjs (contraseñas cifradas), multer (subir fotos), dotenv (variables de entorno) |
| Desarrollo | nodemon (reinicia el servidor al guardar), Git y GitHub |

No se usan plantillas web, constructores visuales ni CMS.

## Requisitos previos

1. **Node.js LTS**: https://nodejs.org
2. **MySQL Server** y **MySQL Workbench**: https://dev.mysql.com/downloads/
3. **Git**: https://git-scm.com
4. Conexión a internet al abrir la página (Bootstrap se carga desde CDN).

## Cómo se monta (una sola vez)

```bash
# 1. Descargar el código
git clone https://github.com/pinkman-br/PIA-PROGRAMACION-WEB.git
cd PIA-PROGRAMACION-WEB

# 2. Instalar las librerías
npm install
```

3. **Crear la base de datos.** En MySQL Workbench: *File → Open SQL Script* → `database/seminuevos_bd.sql` → ejecutar con el rayo ⚡.
   Crea `seminuevos_db` con sus 7 tablas y los datos iniciales. *Ojo: el script borra la base si ya existe.*
4. **Configurar la conexión.** Copiar `.env.example` como `.env` y llenar:

   | Variable | Qué es | Ejemplo |
   |---|---|---|
   | `PORT` | Puerto de la página | `3000` |
   | `DB_HOST` | Servidor de MySQL | `localhost` |
   | `DB_PORT` | Puerto de MySQL | `3306` (o `3307` si se instaló junto a otro MySQL) |
   | `DB_USER` / `DB_PASSWORD` | Usuario y contraseña de MySQL | `root` / *(la tuya)* |
   | `DB_NAME` | Base de datos | `seminuevos_db` |
   | `SESSION_SECRET` | Frase para firmar la sesión | cualquier frase larga |

## Cómo se ejecuta

```bash
npm run dev     # desarrollo: se reinicia solo al guardar cambios
npm start       # normal
```

La terminal debe mostrar `Servidor listo en http://localhost:3000` y `Conectado a MySQL`. Abrir **http://localhost:3000**. Para detenerlo: `Ctrl + C`.

En Windows, si PowerShell bloquea `npm`, ejecutar una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. Si sale `EADDRINUSE`, ya hay otro servidor abierto: cerrarlo (`taskkill /F /IM node.exe`).

### Cuentas de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@seminuevos.com | Seminuevos2026 |
| Usuario | usuario@correo.com | Seminuevos2026 |

## Pantallas

| Pantalla | Ruta | Acceso |
|---|---|---|
| Inicio | `/` | Todos |
| Catálogo | `/catalogo` | Todos |
| Detalle del automóvil | `/detalle?id=1` | Todos |
| Acerca de nosotros | `/nosotros` | Todos (estática) |
| Contacto | `/contacto` | Todos (estática) |
| Iniciar sesión / Crear cuenta | `/login`, `/registro` | Visitante |
| Mi perfil | `/perfil` | Usuario y administrador |
| Favoritos | `/favoritos` | Usuario |
| Agendar prueba de manejo | `/agendar?id=1` | Usuario |
| Mis citas | `/mis-citas` | Usuario |
| Panel de administración | `/admin/` | Administrador |
| Gestión de automóviles (CRUD 1) | `/admin/automoviles`, `/admin/automovil` | Administrador |
| Gestión de citas | `/admin/citas` | Administrador |
| Gestión de usuarios (CRUD 2) | `/admin/usuarios` | Administrador |

## Estructura del proyecto

```
├── database/seminuevos_bd.sql   Script de la base de datos (Fase 2)
├── backend/
│   ├── server.js                Arranque de Express, sesiones y rutas
│   ├── config/db.js             Conexión a MySQL (pool de mysql2)
│   ├── middleware/auth.js       requiereLogin y requiereAdmin
│   ├── utils/horarios.js        Reglas de horario de las citas
│   └── routes/                  Un archivo por módulo de la API
├── frontend/                    Páginas públicas y de usuario (.html)
│   ├── admin/                   Páginas del administrador
│   ├── css/  js/  img/
└── package.json
```

## API

Todas las respuestas son JSON. Las rutas `/api/admin/...` solo responden al administrador.

| Archivo | Rutas |
|---|---|
| `auth.js` | `POST /api/auth/registro`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/sesion` |
| `perfil.js` | `GET /api/perfil`, `PUT /api/perfil` |
| `catalogo.js` | `GET /api/marcas`, `GET /api/automoviles`, `GET /api/automoviles/destacados`, `GET /api/automoviles/:id` |
| `favoritos.js` | `GET /api/favoritos`, `GET /api/favoritos/ids`, `POST /api/favoritos/:id`, `DELETE /api/favoritos/:id` |
| `citas.js` | `GET /api/citas/horarios`, `POST /api/citas`, `GET /api/citas/mias`, `PATCH /api/citas/:id/cancelar` |
| `adminAutomoviles.js` | `GET`, `POST /api/admin/automoviles`; `GET`, `PUT`, `DELETE /api/admin/automoviles/:id`; `PATCH .../:id/estatus` |
| `adminCitas.js` | `GET /api/admin/citas`, `PATCH /api/admin/citas/:id`, `DELETE /api/admin/citas/:id` |
| `adminUsuarios.js` | `GET`, `POST /api/admin/usuarios`; `GET`, `PUT`, `DELETE /api/admin/usuarios/:id`; `PATCH .../:id/activo` |
| `salud.js` | `GET /api/salud` (prueba de conexión) |

## Equipo y módulos

| Integrante | Módulo |
|---|---|
| Angel Emilio Hernández Domínguez | Base del proyecto, cuentas (login, registro, perfil), menú por rol, Gestión de usuarios |
| Nelsson Yahir Serrato Luna | Diseño, menú y pie de página, API del catálogo, Inicio, Nosotros, Contacto |
| Adrián Arturo Ascencio García | Catálogo, Detalle del automóvil, Favoritos |
| Fabritzio Xavier Sánchez Alvarado | Panel de administración, Gestión de automóviles con fotos |
| Omar Adriel Valdez de Ávila | Agendar prueba de manejo, Mis citas, Gestión de citas |

## Control de versiones

- `main`: versión entregable. `develop`: integración. Una rama por módulo: `feature/<módulo>`.
- Cada cambio entra a `develop` por *Pull Request*.
- Mensajes de commit con prefijo: `feat:`, `fix:`, `style:`, `docs:`, `chore:`.
- `.env`, `node_modules` y las fotos subidas desde el panel no se suben al repositorio.
