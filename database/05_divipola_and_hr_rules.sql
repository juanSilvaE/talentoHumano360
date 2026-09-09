-- ============================================================================
-- 05_divipola_and_hr_rules.sql
-- Migración para soportar las 22 reglas de negocio del módulo de Talento 360
-- Incluye tabla maestra DIVIPOLA, nuevas columnas en personas, estados, contactos y educación
-- ============================================================================

-- 1. Tabla Maestra DIVIPOLA (Departamentos y Municipios de Colombia)
CREATE TABLE IF NOT EXISTS divipola (
    codigo_depto VARCHAR(5) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    codigo_mpio VARCHAR(10) PRIMARY KEY,
    municipio VARCHAR(120) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_divipola_depto ON divipola(departamento);
CREATE INDEX IF NOT EXISTS idx_divipola_mpio ON divipola(municipio);

-- 2. Población inicial de Departamentos y Municipios clave (Boyacá completo + Capitales de Colombia)
INSERT INTO divipola (codigo_depto, departamento, codigo_mpio, municipio) VALUES
-- Boyacá (15)
('15', 'BOYACÁ', '15001', 'TUNJA'),
('15', 'BOYACÁ', '15238', 'DUITAMA'),
('15', 'BOYACÁ', '15759', 'SOGAMOSO'),
('15', 'BOYACÁ', '15516', 'PAIPA'),
('15', 'BOYACÁ', '15176', 'CHIQUINQUIRÁ'),
('15', 'BOYACÁ', '15469', 'MONIQUIRÁ'),
('15', 'BOYACÁ', '15572', 'PUERTO BOYACÁ'),
('15', 'BOYACÁ', '15407', 'VILLA DE LEYVA'),
('15', 'BOYACÁ', '15693', 'SANTA ROSA DE VITERBO'),
('15', 'BOYACÁ', '15491', 'NOBSA'),
('15', 'BOYACÁ', '15814', 'TIBASOSA'),
('15', 'BOYACÁ', '15837', 'TUTA'),
('15', 'BOYACÁ', '15839', 'VENTAQUEMADA'),
('15', 'BOYACÁ', '15646', 'SAMACÁ'),
('15', 'BOYACÁ', '15599', 'RAMIRIQUÍ'),
('15', 'BOYACÁ', '15322', 'GUATEQUE'),
('15', 'BOYACÁ', '15325', 'GUAYATÁ'),
('15', 'BOYACÁ', '15455', 'MIRAFLORES'),
('15', 'BOYACÁ', '15764', 'SOATÁ'),
('15', 'BOYACÁ', '15215', 'CORRALES'),
('15', 'BOYACÁ', '15816', 'TINJACÁ'),
('15', 'BOYACÁ', '15804', 'TIBANÁ'),
('15', 'BOYACÁ', '15835', 'TURMEQUÉ'),
('15', 'BOYACÁ', '15798', 'TENZA'),
('15', 'BOYACÁ', '15362', 'JENESANO'),
('15', 'BOYACÁ', '15090', 'BERBEO'),
('15', 'BOYACÁ', '15114', 'BUSBANZÁ'),
('15', 'BOYACÁ', '15162', 'CERINZA'),
('15', 'BOYACÁ', '15187', 'CHÍQUIZA'),
('15', 'BOYACÁ', '15204', 'CÓMBITA'),
('15', 'BOYACÁ', '15224', 'CUÍTIVA'),
('15', 'BOYACÁ', '15272', 'FIRAVITOBA'),
('15', 'BOYACÁ', '15293', 'GACHANCIPÁ'),
('15', 'BOYACÁ', '15332', 'GÜICÁN'),
('15', 'BOYACÁ', '15367', 'IZA'),
('15', 'BOYACÁ', '15425', 'MACANAL'),
('15', 'BOYACÁ', '15476', 'MOTAVITA'),
('15', 'BOYACÁ', '15531', 'PAUNA'),
('15', 'BOYACÁ', '15533', 'PAYA'),
('15', 'BOYACÁ', '15537', 'PAZ DE RÍO'),
('15', 'BOYACÁ', '15542', 'PESCA'),
('15', 'BOYACÁ', '15600', 'RÁQUIRA'),
('15', 'BOYACÁ', '15664', 'SAN JOSÉ DE PARE'),
('15', 'BOYACÁ', '15676', 'SAN MIGUEL DE SEMA'),
('15', 'BOYACÁ', '15686', 'SANTANA'),
('15', 'BOYACÁ', '15720', 'SATIVANORTE'),
('15', 'BOYACÁ', '15723', 'SATIVASUR'),
('15', 'BOYACÁ', '15740', 'SIACHOQUE'),
('15', 'BOYACÁ', '15762', 'SOCHA'),
('15', 'BOYACÁ', '15763', 'SOCOTÁ'),
('15', 'BOYACÁ', '15774', 'SORA'),
('15', 'BOYACÁ', '15776', 'SOTAQUIRÁ'),
('15', 'BOYACÁ', '15778', 'SORACÁ'),
('15', 'BOYACÁ', '15790', 'TASCO'),
('15', 'BOYACÁ', '15806', 'TOCA'),
('15', 'BOYACÁ', '15808', 'TOGÜÍ'),
('15', 'BOYACÁ', '15810', 'TÓPAGA'),
('15', 'BOYACÁ', '15820', 'TÓPAGA'),
('15', 'BOYACÁ', '15842', 'VIRACACHÁ'),
('15', 'BOYACÁ', '15861', 'ZETAQUIRA'),

-- Bogotá D.C. (11)
('11', 'BOGOTÁ, D.C.', '11001', 'BOGOTÁ, D.C.'),

-- Cundinamarca (25)
('25', 'CUNDINAMARCA', '25899', 'ZIPAQUIRÁ'),
('25', 'CUNDINAMARCA', '25175', 'CHÍA'),
('25', 'CUNDINAMARCA', '25269', 'FACATATIVÁ'),
('25', 'CUNDINAMARCA', '25290', 'FUSAGASUGÁ'),
('25', 'CUNDINAMARCA', '25307', 'GIRARDOT'),
('25', 'CUNDINAMARCA', '25754', 'SOACHA'),
('25', 'CUNDINAMARCA', '25843', 'UBATÉ'),
('25', 'CUNDINAMARCA', '25126', 'CAJICÁ'),
('25', 'CUNDINAMARCA', '25214', 'COTA'),
('25', 'CUNDINAMARCA', '25473', 'MOSQUERA'),

-- Antioquia (05)
('05', 'ANTIOQUIA', '05001', 'MEDELLÍN'),
('05', 'ANTIOQUIA', '05088', 'BELLO'),
('05', 'ANTIOQUIA', '05360', 'ITAGÜÍ'),
('05', 'ANTIOQUIA', '05266', 'ENVIGADO'),
('05', 'ANTIOQUIA', '05615', 'RIONEGRO'),

-- Valle del Cauca (76)
('76', 'VALLE DEL CAUCA', '76001', 'CALI'),
('76', 'VALLE DEL CAUCA', '76109', 'BUENAVENTURA'),
('76', 'VALLE DEL CAUCA', '76520', 'PALMIRA'),
('76', 'VALLE DEL CAUCA', '76834', 'TULUÁ'),
('76', 'VALLE DEL CAUCA', '76147', 'CARTAGO'),

-- Santander (68)
('68', 'SANTANDER', '68001', 'BUCARAMANGA'),
('68', 'SANTANDER', '68081', 'BARRANCABERMEJA'),
('68', 'SANTANDER', '68276', 'FLORIDABLANCA'),
('68', 'SANTANDER', '68307', 'GIRÓN'),
('68', 'SANTANDER', '68547', 'PIEDECUESTA'),
('68', 'SANTANDER', '68679', 'SAN GIL'),

-- Norte de Santander (54)
('54', 'NORTE DE SANTANDER', '54001', 'CÚCUTA'),
('54', 'NORTE DE SANTANDER', '54498', 'OCAÑA'),
('54', 'NORTE DE SANTANDER', '54518', 'PAMPLONA'),

-- Atlántico (08)
('08', 'ATLÁNTICO', '08001', 'BARRANQUILLA'),
('08', 'ATLÁNTICO', '08758', 'SOLEDAD'),

-- Bolívar (13)
('13', 'BOLÍVAR', '13001', 'CARTAGENA DE INDIAS'),
('13', 'BOLÍVAR', '13430', 'MAGANGUÉ'),

-- Tolima (73)
('73', 'TOLIMA', '73001', 'IBAGUÉ'),
('73', 'TOLIMA', '73268', 'ESPINAL'),

-- Caldas (17)
('17', 'CALDAS', '17001', 'MANIZALES'),

-- Risaralda (66)
('66', 'RISARALDA', '66001', 'PEREIRA'),
('66', 'RISARALDA', '66170', 'DOSQUEBRADAS'),

-- Quindío (63)
('63', 'QUINDÍO', '63001', 'ARMENIA'),

-- Huila (41)
('41', 'HUILA', '41001', 'NEIVA'),

-- Meta (50)
('50', 'META', '50001', 'VILLAVICENCIO'),

-- Nariño (52)
('52', 'NARIÑO', '52001', 'PASTO'),

-- Cauca (19)
('19', 'CAUCA', '19001', 'POPAYÁN'),

-- Cesar (20)
('20', 'CESAR', '20001', 'VALLEDUPAR'),

-- Córdoba (23)
('23', 'CÓRDOBA', '23001', 'MONTERÍA'),

-- Magdalena (47)
('47', 'MAGDALENA', '47001', 'SANTA MARTA'),

-- Casanare (85)
('85', 'CASANARE', '85001', 'YOPAL'),

-- Arauca (81)
('81', 'ARAUCA', '81001', 'ARAUCA'),

-- Sucre (70)
('70', 'SUCRE', '70001', 'SINCELEJO'),

-- La Guajira (44)
('44', 'LA GUAJIRA', '44001', 'RIOHACHA'),

-- Caquetá (18)
('18', 'CAQUETÁ', '18001', 'FLORENCIA'),

-- Putumayo (86)
('86', 'PUTUMAYO', '86001', 'MOCOA'),

-- Chocó (27)
('27', 'CHOCÓ', '27001', 'QUIBDÓ'),

-- San Andrés y Providencia (88)
('88', 'ARCHIPIÉLAGO DE SAN ANDRÉS', '88001', 'SAN ANDRÉS'),

-- Amazonas (91)
('91', 'AMAZONAS', '91001', 'LETICIA'),

-- Guainía (94)
('94', 'GUAINÍA', '94001', 'INÍRIDA'),

-- Guaviare (95)
('95', 'GUAVIARE', '95001', 'SAN JOSÉ DEL GUAVIARE'),

-- Vaupés (97)
('97', 'VAUPÉS', '97001', 'MITÚ'),

-- Vichada (99)
('99', 'VICHADA', '99001', 'PUERTO CARREÑO')
ON CONFLICT (codigo_mpio) DO NOTHING;

-- 3. Modificaciones en tabla `personas`
ALTER TABLE personas ADD COLUMN IF NOT EXISTS departamento_expedicion VARCHAR(100);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS ciudad_expedicion VARCHAR(120);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS tipo_discapacidad VARCHAR(50);

-- Actualizar departamento_expedicion por defecto si expedida contiene TUNJA o ciudades conocidas
UPDATE personas 
SET departamento_expedicion = 'BOYACÁ',
    ciudad_expedicion = COALESCE(NULLIF(expedida, ''), 'TUNJA')
WHERE (departamento_expedicion IS NULL OR departamento_expedicion = '')
  AND expedida IS NOT NULL AND expedida <> '';

-- 4. Modificaciones en tabla `estados`
ALTER TABLE estados ADD COLUMN IF NOT EXISTS estado_servidor VARCHAR(40) DEFAULT 'Activo';
ALTER TABLE estados ADD COLUMN IF NOT EXISTS funciones VARCHAR(200);

-- Asegurar que todos los servidores existentes queden como 'Activo'
UPDATE estados SET estado_servidor = 'Activo' WHERE estado_servidor IS NULL OR estado_servidor = '';

-- 5. Modificaciones en tabla `contactos`
ALTER TABLE contactos ADD COLUMN IF NOT EXISTS celulares TEXT[];

-- Migrar celular único existente al array de celulares si está vacío
UPDATE contactos 
SET celulares = ARRAY[celular]
WHERE celulares IS NULL AND celular IS NOT NULL AND celular <> '' AND celular <> 'NO REGISTRADO';

-- 6. Modificaciones en tabla `educacion`
ALTER TABLE educacion ADD COLUMN IF NOT EXISTS tiene_diplomado BOOLEAN DEFAULT FALSE;

UPDATE educacion 
SET tiene_diplomado = TRUE 
WHERE diplomado_cap_sena IS NOT NULL 
  AND diplomado_cap_sena <> '' 
  AND diplomado_cap_sena <> 'NO REGISTRADO'
  AND diplomado_cap_sena <> 'N/A';
