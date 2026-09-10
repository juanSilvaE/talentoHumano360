-- ─────────────────────────────────────────────────────────────────────────────
-- Talento 360 — Módulos Nuevos
-- Script: 03_new_modules.sql
-- Descripción: Tablas para los módulos Viáticos y Gestión de Solicitudes
--              Administrativas (Permisos, Incapacidades, Licencias)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Tabla: viaticos ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS viaticos (
    id_viatico        SERIAL PRIMARY KEY,
    dependencia       VARCHAR(280),
    apellidos_nombres VARCHAR(280),
    documento         VARCHAR(60),
    cargo             VARCHAR(280),
    destino           VARCHAR(280)  NOT NULL DEFAULT 'SIN ESPECIFICAR',
    motivo            VARCHAR(500),
    fecha_inicio      VARCHAR(80),
    fecha_fin         VARCHAR(80),
    dias              INTEGER       NOT NULL DEFAULT 1,
    valor_diario      NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_total       NUMERIC(15,2) GENERATED ALWAYS AS (dias * valor_diario) STORED,
    estado            VARCHAR(80)   NOT NULL DEFAULT 'Pendiente',
    observaciones     VARCHAR(500),
    fecha_solicitud   VARCHAR(80),
    aprobado_por      VARCHAR(160),
    tipo_destino      VARCHAR(30)   NOT NULL DEFAULT 'Nacional',
    soporte           TEXT,
    creado_en         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_viaticos_estado     ON viaticos(estado);
CREATE INDEX IF NOT EXISTS idx_viaticos_dependencia ON viaticos(dependencia);
CREATE INDEX IF NOT EXISTS idx_viaticos_documento   ON viaticos(documento);

-- ─── Tabla: solicitudes_admin ─────────────────────────────────────────────────
-- Contiene Permisos Laborales, Incapacidades y Licencias
CREATE TABLE IF NOT EXISTS solicitudes_admin (
    id_solicitud      SERIAL PRIMARY KEY,
    tipo              VARCHAR(80)   NOT NULL CHECK (tipo IN ('Permiso Laboral', 'Incapacidad', 'Licencia')),
    dependencia       VARCHAR(280),
    apellidos_nombres VARCHAR(280),
    documento         VARCHAR(60),
    cargo             VARCHAR(280),
    fecha_inicio      VARCHAR(80),
    fecha_fin         VARCHAR(80),
    dias_solicitados  INTEGER       NOT NULL DEFAULT 1,
    motivo            VARCHAR(500),
    estado            VARCHAR(80)   NOT NULL DEFAULT 'Pendiente',
    observaciones     VARCHAR(500),
    fecha_solicitud   VARCHAR(80),
    aprobado_por      VARCHAR(160),
    nota_gestion      VARCHAR(500),
    creado_en         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sol_admin_tipo        ON solicitudes_admin(tipo);
CREATE INDEX IF NOT EXISTS idx_sol_admin_estado      ON solicitudes_admin(estado);
CREATE INDEX IF NOT EXISTS idx_sol_admin_dependencia ON solicitudes_admin(dependencia);
CREATE INDEX IF NOT EXISTS idx_sol_admin_documento   ON solicitudes_admin(documento);

-- ─── Historial de solicitudes_admin ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS historial_solicitudes_admin (
    id_historial     SERIAL PRIMARY KEY,
    id_solicitud     INTEGER NOT NULL REFERENCES solicitudes_admin(id_solicitud) ON DELETE CASCADE,
    estado_nuevo     VARCHAR(80) NOT NULL,
    nota             VARCHAR(500) NOT NULL DEFAULT 'Cambio realizado desde la interfaz web',
    actualizado_por  VARCHAR(120) NOT NULL DEFAULT CURRENT_USER,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Historial de viáticos ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS historial_viaticos (
    id_historial     SERIAL PRIMARY KEY,
    id_viatico       INTEGER NOT NULL REFERENCES viaticos(id_viatico) ON DELETE CASCADE,
    estado_nuevo     VARCHAR(80) NOT NULL,
    nota             VARCHAR(500) NOT NULL DEFAULT 'Cambio realizado desde la interfaz web',
    actualizado_por  VARCHAR(120) NOT NULL DEFAULT CURRENT_USER,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Datos de ejemplo para solicitudes_admin ──────────────────────────────────
INSERT INTO solicitudes_admin (tipo, dependencia, apellidos_nombres, documento, cargo, fecha_inicio, fecha_fin, dias_solicitados, motivo, estado, fecha_solicitud)
VALUES
  ('Permiso Laboral', 'SECRETARÍA DE HACIENDA', 'GARCIA MARTINEZ LUIS FERNANDO', '79850123', 'PROFESIONAL UNIVERSITARIO', '15/05/2026', '15/05/2026', 1, 'Diligencia personal urgente', 'Aprobada', '10/05/2026'),
  ('Permiso Laboral', 'SECRETARÍA DE EDUCACIÓN', 'RODRIGUEZ PEÑA MARIA ELENA', '52741236', 'AUXILIAR ADMINISTRATIVO', '20/05/2026', '21/05/2026', 2, 'Cita médica especializada', 'Pendiente', '18/05/2026'),
  ('Incapacidad', 'SECRETARÍA DE SALUD', 'HERNANDEZ TORRES CARLOS ARTURO', '80125478', 'MÉDICO ESPECIALISTA', '01/06/2026', '15/06/2026', 15, 'Recuperación postoperatoria', 'Aprobada', '02/06/2026'),
  ('Incapacidad', 'SECRETARÍA DE OBRAS PÚBLICAS', 'MORALES JIMENEZ ANA PATRICIA', '46782314', 'INGENIERA CIVIL', '10/06/2026', '20/06/2026', 10, 'Fractura de tobillo', 'En revisión', '11/06/2026'),
  ('Licencia', 'SECRETARÍA DE GOBIERNO', 'VARGAS SANTOS DIANA CAROLINA', '52963147', 'ABOGADA CONTRATISTA', '01/07/2026', '31/10/2026', 122, 'Licencia de maternidad', 'Aprobada', '25/06/2026'),
  ('Licencia', 'SECRETARÍA DE PLANEACIÓN', 'CASTRO BERMUDEZ JORGE ANDRES', '1047852369', 'ARQUITECTO', '15/07/2026', '14/08/2026', 30, 'Licencia de estudio - especialización', 'Pendiente', '01/07/2026')
ON CONFLICT DO NOTHING;

-- ─── Datos de ejemplo para viáticos ──────────────────────────────────────────
INSERT INTO viaticos (dependencia, apellidos_nombres, documento, cargo, destino, motivo, fecha_inicio, fecha_fin, dias, valor_diario, estado, fecha_solicitud)
VALUES
  ('SECRETARÍA DE HACIENDA', 'GARCIA MARTINEZ LUIS FERNANDO', '79850123', 'PROFESIONAL UNIVERSITARIO', 'BOGOTÁ D.C.', 'Capacitación en gestión tributaria - DIAN', '20/05/2026', '22/05/2026', 3, 120000, 'Aprobada', '15/05/2026'),
  ('SECRETARÍA DE EDUCACIÓN', 'RODRIGUEZ PEÑA MARIA ELENA', '52741236', 'AUXILIAR ADMINISTRATIVO', 'MEDELLÍN, ANTIOQUIA', 'Congreso nacional de educación pública', '10/06/2026', '13/06/2026', 4, 135000, 'En revisión', '05/06/2026'),
  ('SECRETARÍA DE SALUD', 'HERNANDEZ TORRES CARLOS ARTURO', '80125478', 'MÉDICO ESPECIALISTA', 'BUCARAMANGA, SANTANDER', 'Simposio de salud pública regional', '05/07/2026', '07/07/2026', 3, 150000, 'Pendiente', '28/06/2026'),
  ('SECRETARÍA DE GOBIERNO', 'VARGAS SANTOS PEDRO JOSE', '1098745236', 'SECRETARIO DE DESPACHO', 'CARTAGENA, BOLÍVAR', 'Reunión de gobernadores - Fondo de Regiones', '15/07/2026', '17/07/2026', 3, 200000, 'Aprobada', '10/07/2026')
ON CONFLICT DO NOTHING;
