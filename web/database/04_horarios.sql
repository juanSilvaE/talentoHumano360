-- ─────────────────────────────────────────────────────────────────────────────
-- Talento 360 — Módulo de Horarios y Modalidades de Trabajo
-- Script: 04_horarios.sql
-- Descripción: Tablas para la gestión de esquemas de horarios asignados a
--              usuarios (Presencial, Teletrabajo, Trabajo en casa, Horario flexible)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Tabla: horarios ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS horarios (
    id_horario            SERIAL PRIMARY KEY,
    documento             VARCHAR(60)   NOT NULL,
    apellidos_nombres     VARCHAR(280)  NOT NULL,
    dependencia           VARCHAR(280)  NOT NULL DEFAULT 'SECRETARÍA GENERAL',
    cargo                 VARCHAR(280)  NOT NULL DEFAULT 'PROFESIONAL UNIVERSITARIO',
    modalidad             VARCHAR(60)   NOT NULL CHECK (modalidad IN ('Presencial', 'Teletrabajo', 'Trabajo en casa', 'Horario flexible')),
    estado                VARCHAR(80)   NOT NULL DEFAULT 'Activa',
    
    -- REQ-026 & REQ-027: Duración y Fechas
    fecha_inicio          DATE          NOT NULL,
    fecha_fin             DATE,
    duracion_texto        VARCHAR(120),  -- e.g. "1 año, 2 meses y 15 días"
    duracion_dias         INTEGER       NOT NULL DEFAULT 1,
    tipo_calculo          VARCHAR(30)   NOT NULL DEFAULT 'Hábiles' CHECK (tipo_calculo IN ('Hábiles', 'Habiles', 'Calendario')),
    
    -- REQ-028: Metadata administrativa
    numero_resolucion     VARCHAR(120),  -- e.g. "RES-2026-0412"
    fecha_aprobacion      DATE,
    fecha_notificacion    DATE,
    aprobado_por          VARCHAR(180)  DEFAULT 'Angela Ussa',
    soporte_acto          TEXT,
    
    -- REQ-023: Campos dinámicos para Teletrabajo (Ley 1221 de 2008 / Dec. 1227 de 2022)
    subtipo_teletrabajo   VARCHAR(80),   -- 'Suplementario (Híbrido)', 'Autónomo', 'Móvil'
    dias_teletrabajo      VARCHAR(200),  -- e.g. "Lunes, Miércoles"
    dias_presencial       VARCHAR(200),  -- e.g. "Martes, Jueves, Viernes"
    domicilio_laboral     VARCHAR(300),  -- Dirección para ARL
    notificacion_arl      BOOLEAN       DEFAULT FALSE,
    fecha_reporte_arl     DATE,
    
    -- REQ-023: Campos dinámicos para Trabajo en casa (Ley 2088 de 2021)
    motivo_trabajo_casa   VARCHAR(500),  -- Justificación excepcional o transitoria
    direccion_trabajo_casa VARCHAR(300),
    herramientas_tic      VARCHAR(300),  -- Equipos propios / suministrados
    prorroga              BOOLEAN       DEFAULT FALSE,
    
    -- REQ-023: Campos dinámicos para Horario flexible
    franja_ingreso        VARCHAR(50),   -- e.g. "07:00 - 08:30"
    franja_salida         VARCHAR(50),   -- e.g. "16:30 - 18:00"
    horas_semanales       INTEGER       DEFAULT 40,
    tiempo_almuerzo       VARCHAR(50)   DEFAULT '1 hora',
    justificacion_flex    VARCHAR(500),  -- Cuidado de hijos, estudio, condición de salud
    
    -- Observaciones y auditoría
    observaciones         VARCHAR(500),
    creado_por            VARCHAR(120)  DEFAULT 'admin',
    creado_en             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_horarios_doc       ON horarios(documento);
CREATE INDEX IF NOT EXISTS idx_horarios_modalidad ON horarios(modalidad);
CREATE INDEX IF NOT EXISTS idx_horarios_estado    ON horarios(estado);
CREATE INDEX IF NOT EXISTS idx_horarios_fechas    ON horarios(fecha_inicio, fecha_fin);

-- ─── Tabla: historial_horarios ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS historial_horarios (
    id_historial        SERIAL PRIMARY KEY,
    id_horario          INTEGER NOT NULL REFERENCES horarios(id_horario) ON DELETE CASCADE,
    accion              VARCHAR(120) NOT NULL,
    estado_anterior     VARCHAR(80),
    estado_nuevo        VARCHAR(80),
    nota                VARCHAR(500),
    actualizado_por     VARCHAR(120) NOT NULL DEFAULT 'Sistema',
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hist_horarios_id ON historial_horarios(id_horario);

-- ─── Datos de Ejemplo Iniciales (11 Esquemas Institucionales) ─────────────────
INSERT INTO horarios (
    documento, apellidos_nombres, dependencia, cargo, modalidad, estado,
    fecha_inicio, fecha_fin, duracion_texto, duracion_dias, tipo_calculo,
    numero_resolucion, fecha_aprobacion, fecha_notificacion, aprobado_por,
    subtipo_teletrabajo, dias_teletrabajo, dias_presencial, domicilio_laboral, notificacion_arl, fecha_reporte_arl,
    motivo_trabajo_casa, direccion_trabajo_casa, herramientas_tic, prorroga,
    franja_ingreso, franja_salida, horas_semanales, tiempo_almuerzo, justificacion_flex,
    observaciones
)
VALUES
  (
    '1000000002', 'TORRES RIVERA CARLOS ANDRÉS', 'DIRECCIÓN DE TALENTO HUMANO', 'COORDINADOR DE ÁREA',
    'Teletrabajo', 'Activa',
    '2026-02-01', '2026-12-31', '11 meses', 228, 'Hábiles',
    'RES-2026-5555', '2026-01-20', '2026-01-22', 'Angela Ussa',
    'Suplementario (Híbrido)', 'Martes, Jueves', 'Lunes, Miércoles, Viernes', 'Calle 18 # 11-45, Tunja, Boyacá', TRUE, '2026-01-25',
    NULL, NULL, NULL, FALSE,
    NULL, NULL, 40, '1 hora', NULL,
    'Acuerdo voluntario de teletrabajo concertado con la Dirección de Talento Humano.'
  ),
  (
    '1000000001', 'MARTÍNEZ PÉREZ LAURA', 'DESPACHO DEL GOBERNADOR', 'PROFESIONAL UNIVERSITARIO',
    'Presencial', 'Activa',
    '2026-01-01', '2026-12-31', '1 año', 246, 'Hábiles',
    'RES-2026-0999', '2025-12-28', '2025-12-29', 'Angela Ussa',
    NULL, NULL, NULL, NULL, FALSE, NULL,
    NULL, NULL, NULL, FALSE,
    NULL, NULL, 40, '2 horas', NULL,
    'Jornada ordinaria en sede central de la Gobernación de Boyacá.'
  ),
  (
    '1000000003', 'ROJAS GÓMEZ DIANA CAROLINA', 'SECRETARÍA DE HACIENDA', 'TÉCNICO ADMINISTRATIVO',
    'Teletrabajo', 'Activa',
    '2026-01-15', '2026-11-30', '10 meses y 15 días', 215, 'Hábiles',
    'RES-2026-0312', '2026-01-10', '2026-01-12', 'Angela Ussa',
    'Suplementario (Híbrido)', 'Miércoles, Viernes', 'Lunes, Martes, Jueves', 'Carrera 10 # 22-15, Duitama, Boyacá', TRUE, '2026-01-14',
    NULL, NULL, NULL, FALSE,
    NULL, NULL, 40, '1 hora', NULL,
    'Esquema suplementario con atención presencial de tesorería los días asignados.'
  ),
  (
    '1000000004', 'MORENO SUÁREZ JUAN SEBASTIÁN', 'OFICINA JURÍDICA', 'ASESOR JURÍDICO',
    'Presencial', 'Activa',
    '2026-01-01', '2026-12-31', '1 año', 246, 'Hábiles',
    'RES-2026-0105', '2025-12-30', '2025-12-31', 'Angela Ussa',
    NULL, NULL, NULL, NULL, FALSE, NULL,
    NULL, NULL, NULL, FALSE,
    NULL, NULL, 40, '2 horas', NULL,
    'Jornada presencial institucional para sustentación de audiencias y conceptos jurídicos.'
  ),
  (
    '1000000005', 'GÓMEZ RUIZ PAULA ANDREA', 'SECRETARÍA DE SALUD', 'PROFESIONAL UNIVERSITARIO',
    'Horario flexible', 'Activa',
    '2026-01-15', '2026-07-15', '6 meses', 124, 'Hábiles',
    'RES-2026-0048', '2026-01-10', '2026-01-12', 'Angela Ussa',
    NULL, NULL, NULL, NULL, FALSE, NULL,
    NULL, NULL, NULL, FALSE,
    '07:00 - 08:30', '16:00 - 17:30', 40, '1 hora', 'Cuidado de familiar en primer grado de consanguinidad y estudios de posgrado.',
    'Aprobado según lineamientos de bienestar y flexibilización laboral.'
  ),
  (
    '1000000006', 'CASTRO DÍAZ MIGUEL ÁNGEL', 'SECRETARÍA DE EDUCACIÓN', 'COORDINADOR DE ÁREA',
    'Presencial', 'Activa',
    '2026-01-10', '2026-12-31', '11 meses y 21 días', 240, 'Hábiles',
    'RES-2026-0022', '2026-01-05', '2026-01-08', 'Angela Ussa',
    NULL, NULL, NULL, NULL, FALSE, NULL,
    NULL, NULL, NULL, FALSE,
    NULL, NULL, 40, '2 horas', NULL,
    'Coordinación presencial de supervisión educativa territorial.'
  ),
  (
    '1000000007', 'SILVA PARRA NATALIA FERNANDA', 'DIRECCIÓN DE TALENTO HUMANO', 'PROFESIONAL UNIVERSITARIO',
    'Trabajo en casa', 'Activa',
    '2026-03-01', '2026-05-30', '3 meses', 62, 'Hábiles',
    'RES-2026-0210', '2026-02-24', '2026-02-26', 'Angela Ussa',
    NULL, NULL, NULL, NULL, FALSE, NULL,
    'Situación de salud temporal certificada por EPS (Ley 2088 de 2021).', 'Calle 24 # 9-60, Sogamoso, Boyacá', 'Equipo institucional portátil asignado', FALSE,
    NULL, NULL, 40, '1 hora', NULL,
    'Pausa automática de vacaciones activa durante el periodo de trabajo en casa.'
  ),
  (
    '1000000008', 'VARGAS PEÑA ANDRÉS FELIPE', 'SECRETARÍA DE INFRAESTRUCTURA PÚBLICA', 'PROFESIONAL ESPECIALIZADO',
    'Teletrabajo', 'Activa',
    '2026-01-15', '2027-01-14', '1 año', 246, 'Hábiles',
    'RES-2026-0198', '2026-01-08', '2026-01-10', 'Angela Ussa',
    'Autónomo', 'Lunes, Martes, Miércoles, Jueves, Viernes', 'Sin días presenciales fijos', 'Manzana B Casa 4, Sogamoso, Boyacá', TRUE, '2026-01-12',
    NULL, NULL, NULL, FALSE,
    NULL, NULL, 40, '1 hora', NULL,
    'Teletrabajador autónomo con metas por entregables de interventoría de obra.'
  ),
  (
    '1000000009', 'RODRÍGUEZ NIÑO MARÍA CAMILA', 'SECRETARÍA GENERAL', 'PROFESIONAL UNIVERSITARIO',
    'Trabajo en casa', 'Caducada',
    '2025-10-01', '2026-01-01', '3 meses', 64, 'Hábiles',
    'RES-2025-0740', '2025-09-25', '2025-09-28', 'Angela Ussa',
    NULL, NULL, NULL, NULL, FALSE, NULL,
    'Condición de salud transitoria superada favorablemente.', 'Carrera 7 # 14-30, Duitama, Boyacá', 'Equipo propio verificado por TIC', FALSE,
    NULL, NULL, 40, '1 hora', NULL,
    'Vigencia culminada. Retorno automático a modalidad presencial aplicado.'
  ),
  (
    '1000000010', 'HERRERA LÓPEZ SANTIAGO', 'SECRETARÍA DE HACIENDA', 'PROFESIONAL ESPECIALIZADO',
    'Presencial', 'Activa',
    '2026-01-01', '2026-12-31', '1 año', 246, 'Hábiles',
    'RES-2026-0018', '2025-12-28', '2025-12-30', 'Angela Ussa',
    NULL, NULL, NULL, NULL, FALSE, NULL,
    NULL, NULL, NULL, FALSE,
    NULL, NULL, 40, '2 horas', NULL,
    'Atención presencial en ventanilla de rentas departamentales.'
  ),
  (
    '79850123', 'GARCIA MARTINEZ LUIS FERNANDO', 'SECRETARÍA DE HACIENDA', 'PROFESIONAL UNIVERSITARIO',
    'Teletrabajo', 'Caducada',
    '2025-02-01', '2025-12-31', '11 meses', 228, 'Hábiles',
    'RES-2025-0115', '2025-01-20', '2025-01-22', 'Angela Ussa',
    'Suplementario (Híbrido)', 'Martes, Jueves', 'Lunes, Miércoles, Viernes', 'Calle 18 # 11-45, Tunja, Boyacá', TRUE, '2025-01-25',
    NULL, NULL, NULL, FALSE,
    NULL, NULL, 40, '1 hora', NULL,
    'Esquema vencido en vigencia anterior. Registrado en histórico para trazabilidad.'
  )
ON CONFLICT DO NOTHING;

-- Registro histórico inicial
INSERT INTO historial_horarios (id_horario, accion, estado_anterior, estado_nuevo, nota, actualizado_por)
SELECT id_horario, 'Creación Inicial', NULL, estado, 'Registro administrativo institucional de esquema de horario', 'admin'
FROM horarios
ON CONFLICT DO NOTHING;

