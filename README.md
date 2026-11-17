# Seminuevos: proyecto final de Programación Web

Página web de venta de autos seminuevos con catálogo, favoritos, citas de prueba de manejo y panel de administración.
FIME UANL · Grupo 013 · Equipo 1.

## Tecnologías

| Parte | Tecnología |
|---|---|
| Frontend | HTML, CSS, Bootstrap 5, JavaScript (fetch) |
| Backend | Node.js + Express |
| Base de datos | MySQL 8 o superior (`seminuevos_db`) |
| Sesiones y seguridad | express-session, bcryptjs (contraseñas cifradas) |
| Control de versiones | Git + GitHub |

## Requisitos previos

1. **Node.js LTS** (versión 18 o superior): https://nodejs.org
2. **MySQL Server** y **MySQL Workbench**.
3. **Git**: https://git-scm.com

## Instalación (una sola vez)

```bash
# 1. Clonar el repositorio
git clone <URL-del-repositorio>
cd seminuevos-web

# 2. Instalar dependencias
npm install
```

3. **Crear la base de datos:** en MySQL Workbench abre `database/seminuevos_bd.sql` y ejecútalo con el rayo ⚡.
   *Ojo: el script borra y vuelve a crear la base de datos.*
4. **Configurar la conexión:** copia `.env.example` como `.env` y llena tu puerto, usuario y contraseña de MySQL.

## Ejecución

```bash
npm run dev     # modo desarrollo: se reinicia solo al guardar cambios
# o
npm start       # modo normal
```

Abre http://localhost:3000. La página de prueba debe decir **"Conectado a MySQL"**.
También puedes revisar http://localhost:3000/api/salud.

### Cuentas de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@seminuevos.com | Seminuevos2026 |
| Usuario | usuario@correo.com | Seminuevos2026 |

## Estructura del proyecto

```
seminuevos-web/
├── database/seminuevos_bd.sql   Script de la base de datos (Fase 2)
├── backend/
│   ├── server.js                Arranque de Express (rutas ya montadas)
│   ├── config/db.js             Conexión a MySQL
│   ├── middleware/auth.js       requiereLogin y requiereAdmin
│   └── routes/                  Un archivo por módulo
├── frontend/
│   ├── *.html                   Pantallas públicas y de usuario
│   ├── admin/                   Pantallas del administrador
│   ├── css/  img/
│   └── js/api.js                Ayudante para llamar a la API
├── .env.example
└── package.json
```

## Reparto de módulos

| Integrante | Backend (`backend/routes/`) | Frontend (`frontend/`) |
|---|---|---|
| Persona 1 | `salud.js`, `auth.js`, `perfil.js` | Iniciar sesión, Crear cuenta, Mi perfil |
| Persona 2 | `catalogo.js` | Estilos, menú, Inicio, Catálogo, Detalle, Nosotros, Contacto |
| Persona 3 | `adminAutomoviles.js`, `adminUsuarios.js` | Panel admin, Gestión de automóviles, Gestión de usuarios |
| Persona 4 | `favoritos.js`, `citas.js`, `adminCitas.js` | Favoritos, Agendar prueba, Mis citas, Gestión de citas |

Las rutas de todos ya están conectadas en `server.js`: **cada quien solo edita sus propios archivos**.

## Reglas de Git

- `main`: solo versiones que funcionan. `develop`: integración. Una rama por tarea: `feature/<tarea>`.
- Antes de empezar: `git checkout develop` y `git pull`.
- Commits pequeños con prefijo: `feat:`, `fix:`, `style:`, `docs:`, `chore:`.
- Al terminar: `git push` y *Pull Request* hacia `develop`. Otro integrante lo revisa.
- Cada quien hace commits **desde su propia cuenta**.
- Nunca subir `.env` ni `node_modules`.
