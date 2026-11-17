-- =====================================================================
--  Proyecto final - Fase 2: Base de datos
--  Página web de seminuevos (caso de referencia: Geely Lindavista)
--  Motor: MySQL 8.0  (compatible con MariaDB 10.6+)
--  Equipo #1 - Grupo 013 - Programación Web - FIME UANL
-- =====================================================================

DROP DATABASE IF EXISTS seminuevos_db;
CREATE DATABASE seminuevos_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE seminuevos_db;
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 1. ROLES  (Administrador / Usuario)
--    El "Visitante" no se guarda: es quien navega sin sesión.
-- ---------------------------------------------------------------------
CREATE TABLE roles (
    id_rol      TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(30)      NOT NULL,
    descripcion VARCHAR(150)     NULL,
    CONSTRAINT pk_roles PRIMARY KEY (id_rol),
    CONSTRAINT uq_roles_nombre UNIQUE (nombre)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 2. USUARIOS  (pantallas: Crear cuenta, Iniciar sesión, Mi perfil,
--               Gestión de usuarios)
--    nombre, correo y teléfono se reutilizan al agendar una cita.
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id_usuario      INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    id_rol          TINYINT UNSIGNED NOT NULL DEFAULT 2,
    nombre_completo VARCHAR(120)     NOT NULL,
    correo          VARCHAR(150)     NOT NULL,
    telefono        VARCHAR(15)      NOT NULL,
    contrasena_hash VARCHAR(255)     NOT NULL,
    activo          BOOLEAN          NOT NULL DEFAULT TRUE,
    fecha_registro  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuarios PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuarios_correo UNIQUE (correo),
    CONSTRAINT fk_usuarios_roles FOREIGN KEY (id_rol)
        REFERENCES roles (id_rol)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 3. MARCAS  (alimenta el filtro "Marca" del catálogo)
-- ---------------------------------------------------------------------
CREATE TABLE marcas (
    id_marca INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre   VARCHAR(50)  NOT NULL,
    CONSTRAINT pk_marcas PRIMARY KEY (id_marca),
    CONSTRAINT uq_marcas_nombre UNIQUE (nombre)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 4. AUTOMOVILES  (Catálogo, Inicio, Gestión de automóviles,
--                  Agregar/editar automóvil)
--    Datos que se muestran en la tarjeta del catálogo y en la tabla
--    administrativa.
-- ---------------------------------------------------------------------
CREATE TABLE automoviles (
    id_automovil INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    id_marca     INT UNSIGNED  NOT NULL,
    modelo       VARCHAR(60)   NOT NULL,
    version      VARCHAR(60)   NULL,
    anio         SMALLINT UNSIGNED NOT NULL,
    precio       DECIMAL(10,2) NOT NULL,
    kilometraje  INT UNSIGNED  NOT NULL DEFAULT 0,
    color        VARCHAR(30)   NOT NULL,
    imagen_url   VARCHAR(255)  NULL,
    estatus      ENUM('Disponible','Vendido') NOT NULL DEFAULT 'Disponible',
    destacado    BOOLEAN       NOT NULL DEFAULT FALSE,
    fecha_alta   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_automoviles PRIMARY KEY (id_automovil),
    CONSTRAINT fk_automoviles_marcas FOREIGN KEY (id_marca)
        REFERENCES marcas (id_marca)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_automoviles_anio   CHECK (anio BETWEEN 1990 AND 2100),
    CONSTRAINT ck_automoviles_precio CHECK (precio > 0)
) ENGINE = InnoDB;

-- Índices para el buscador y los filtros (marca, precio, año, estatus)
CREATE INDEX ix_automoviles_filtros ON automoviles (estatus, id_marca, anio, precio);
CREATE INDEX ix_automoviles_modelo  ON automoviles (modelo);

-- ---------------------------------------------------------------------
-- 5. FICHAS_TECNICAS  (relación 1-1 con automoviles)
--    Datos de la pantalla "Detalle del automóvil" que no hacen falta
--    en la tarjeta del catálogo. La PK es también FK, por eso cada
--    automóvil tiene como máximo una ficha.
-- ---------------------------------------------------------------------
CREATE TABLE fichas_tecnicas (
    id_automovil INT UNSIGNED NOT NULL,
    transmision  ENUM('Automática','Manual') NOT NULL,
    combustible  ENUM('Gasolina','Diésel','Híbrido','Eléctrico') NOT NULL,
    motor        VARCHAR(60)  NULL,
    carroceria   VARCHAR(30)  NULL,
    puertas      TINYINT UNSIGNED NULL,
    pasajeros    TINYINT UNSIGNED NULL,
    descripcion  TEXT         NULL,
    CONSTRAINT pk_fichas_tecnicas PRIMARY KEY (id_automovil),
    CONSTRAINT fk_fichas_automoviles FOREIGN KEY (id_automovil)
        REFERENCES automoviles (id_automovil)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 6. FAVORITOS  (tabla intermedia de la relación n-n
--                usuarios <-> automoviles)
--    La PK compuesta evita guardar dos veces el mismo auto.
--    "Quitar" borra la fila, no el automóvil.
-- ---------------------------------------------------------------------
CREATE TABLE favoritos (
    id_usuario     INT UNSIGNED NOT NULL,
    id_automovil   INT UNSIGNED NOT NULL,
    fecha_agregado DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_favoritos PRIMARY KEY (id_usuario, id_automovil),
    CONSTRAINT fk_favoritos_usuarios FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_favoritos_automoviles FOREIGN KEY (id_automovil)
        REFERENCES automoviles (id_automovil)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 7. CITAS  (Agendar prueba de manejo, Mis citas, Gestión de citas)
--    Un usuario puede tener muchas citas (1-n) y un automóvil puede
--    recibir muchas citas (1-n). Nombre, correo y teléfono NO se
--    repiten aquí: se obtienen del usuario con un JOIN.
-- ---------------------------------------------------------------------
CREATE TABLE citas (
    id_cita             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_usuario          INT UNSIGNED NOT NULL,
    id_automovil        INT UNSIGNED NOT NULL,
    fecha               DATE         NOT NULL,
    hora                TIME         NOT NULL,
    comentario          VARCHAR(300) NULL,
    estatus             ENUM('Pendiente','Confirmada','Reprogramada','Cancelada')
                        NOT NULL DEFAULT 'Pendiente',
    fecha_solicitud     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_citas PRIMARY KEY (id_cita),
    CONSTRAINT fk_citas_usuarios FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_citas_automoviles FOREIGN KEY (id_automovil)
        REFERENCES automoviles (id_automovil)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE INDEX ix_citas_estatus_fecha ON citas (estatus, fecha, hora);

-- =====================================================================
--  DATOS INICIALES
-- =====================================================================

INSERT INTO roles (id_rol, nombre, descripcion) VALUES
 (1, 'Administrador', 'Gestiona automóviles, citas y usuarios'),
 (2, 'Usuario',       'Guarda favoritos, edita su perfil y agenda pruebas de manejo');

-- Contraseñas de ejemplo guardadas como hash bcrypt (nunca en texto plano).
-- Ambas cuentas usan la contraseña de prueba: Seminuevos2026
INSERT INTO usuarios (id_rol, nombre_completo, correo, telefono, contrasena_hash) VALUES
 (1, 'Administrador Seminuevos', 'admin@seminuevos.com', '8100000000',
     '$2b$10$f3ETz1vv/0wVOSpNRoZ3keG8o.eJD9uqwuuKVDUQ9HVo/VSQKvcqa'),
 (2, 'Usuario Ejemplo',          'usuario@correo.com',   '8111111111',
     '$2b$10$f3ETz1vv/0wVOSpNRoZ3keG8o.eJD9uqwuuKVDUQ9HVo/VSQKvcqa');

INSERT INTO marcas (id_marca, nombre) VALUES
 (1, 'Volkswagen'),
 (2, 'Geely'),
 (3, 'MG');

-- Inventario de seminuevos.
-- Precio y kilometraje son valores de ejemplo: ajústenlos al inventario real.
INSERT INTO automoviles
 (id_automovil, id_marca, modelo, version, anio, precio, kilometraje, color, imagen_url, estatus, destacado) VALUES
 (1, 1, 'Tiguan',       'Comfortline 1.4L', 2024, 489900.00, 21500, 'Gris',   'img/autos/vw-tiguan-comfortline-2024.jpg', 'Disponible', TRUE),
 (2, 2, 'Geometry C',   'GL',               2024, 429900.00, 15800, 'Blanco', 'img/autos/geely-geometry-c-gl-2024.jpg',   'Disponible', TRUE),
 (3, 2, 'Coolray',      'GF',               2024, 389900.00, 18200, 'Rojo',   'img/autos/geely-coolray-gf-2024.jpg',      'Disponible', TRUE),
 (4, 3, 'MG ONE',       'Excite',           2024, 339900.00, 24300, 'Blanco', 'img/autos/mg-one-excite-2024.jpg',         'Disponible', FALSE),
 (5, 1, 'Tiguan',       'R-Line 1.4',       2024, 569900.00, 12700, 'Blanco', 'img/autos/vw-tiguan-r-line-2024.jpg',      'Disponible', FALSE);

INSERT INTO fichas_tecnicas
 (id_automovil, transmision, combustible, motor, carroceria, puertas, pasajeros, descripcion) VALUES
 (1, 'Automática', 'Gasolina',  '1.4L turbo',        'SUV', 5, 5, 'Volkswagen Tiguan Comfortline 1.4L 2024, color gris.'),
 (2, 'Automática', 'Eléctrico', 'Motor eléctrico',   'SUV', 5, 5, 'Geely Geometry C GL 2024, SUV 100% eléctrica, color blanco.'),
 (3, 'Automática', 'Gasolina',  '1.5L turbo',        'SUV', 5, 5, 'Geely Coolray GF 2024, color rojo.'),
 (4, 'Automática', 'Gasolina',  '1.5L',              'SUV', 5, 5, 'MG ONE Excite 2024, color blanco.'),
 (5, 'Automática', 'Gasolina',  '1.4L turbo',        'SUV', 5, 5, 'Volkswagen Tiguan R-Line 1.4 2024, color blanco.');

-- Ejemplos para probar Favoritos y Citas con el usuario de prueba
INSERT INTO favoritos (id_usuario, id_automovil) VALUES
 (2, 1),
 (2, 3);

INSERT INTO citas (id_usuario, id_automovil, fecha, hora, comentario, estatus) VALUES
 (2, 1, '2026-11-20', '16:00:00', 'Me interesa conocer el consumo en ciudad.', 'Pendiente'),
 (2, 2, '2026-11-23', '12:30:00', NULL,                                          'Confirmada');

-- =====================================================================
--  CONSULTAS DE APOYO (las usará el back-end; sirven para comprobar)
-- =====================================================================

-- Catálogo público: solo unidades disponibles, con filtros opcionales
-- SELECT a.id_automovil, m.nombre AS marca, a.modelo, a.version, a.anio,
--        a.precio, a.kilometraje, a.imagen_url
-- FROM automoviles a JOIN marcas m ON m.id_marca = a.id_marca
-- WHERE a.estatus = 'Disponible'
--   AND (m.nombre = ? OR ? IS NULL)
--   AND a.precio <= ? AND a.anio >= ?
--   AND CONCAT(m.nombre,' ',a.modelo) LIKE CONCAT('%', ?, '%');

-- Gestión de citas (admin): datos de contacto vienen del perfil del usuario
-- SELECT c.id_cita, u.nombre_completo, u.telefono, u.correo,
--        CONCAT(m.nombre,' ',a.modelo,' ',a.anio) AS automovil,
--        c.fecha, c.hora, c.estatus
-- FROM citas c
-- JOIN usuarios    u ON u.id_usuario   = c.id_usuario
-- JOIN automoviles a ON a.id_automovil = c.id_automovil
-- JOIN marcas      m ON m.id_marca     = a.id_marca
-- ORDER BY c.fecha, c.hora;
