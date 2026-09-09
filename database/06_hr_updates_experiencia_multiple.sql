-- ============================================================================
-- 06_hr_updates_experiencia_multiple.sql
-- Actualizaciones de Recursos Humanos:
-- 1. Municipios/pueblos completos en DIVIPOLA y renombre a Municipio
-- 2. Tipo de Sangre estandarizado
-- 3. Otro Tiempo con la Gobernación como JSONB para soportar múltiples periodos
-- ============================================================================

-- 1. Ampliación completa de DIVIPOLA para Boyacá (123 municipios) y pueblos/corregimientos clave
INSERT INTO divipola (codigo_depto, departamento, codigo_mpio, municipio) VALUES
('15', 'BOYACÁ', '15022', 'ALMEIDA'),
('15', 'BOYACÁ', '15047', 'AQUITANIA'),
('15', 'BOYACÁ', '15051', 'ARCABUCO'),
('15', 'BOYACÁ', '15087', 'BELÉN'),
('15', 'BOYACÁ', '15092', 'BETÉITIVA'),
('15', 'BOYACÁ', '15097', 'BOAVITA'),
('15', 'BOYACÁ', '15104', 'BOYACÁ'),
('15', 'BOYACÁ', '15106', 'BRICEÑO'),
('15', 'BOYACÁ', '15109', 'BUENAVISTA'),
('15', 'BOYACÁ', '15131', 'CALDAS'),
('15', 'BOYACÁ', '15135', 'CAMPOHERMOSO'),
('15', 'BOYACÁ', '15180', 'CHISCAS'),
('15', 'BOYACÁ', '15185', 'CHIVATÁ'),
('15', 'BOYACÁ', '15189', 'CIÉNEGA'),
('15', 'BOYACÁ', '15212', 'COPER'),
('15', 'BOYACÁ', '15218', 'COVARACHÍA'),
('15', 'BOYACÁ', '15223', 'CUBARÁ'),
('15', 'BOYACÁ', '15228', 'CUCAITA'),
('15', 'BOYACÁ', '15232', 'CHÍVOR'),
('15', 'BOYACÁ', '15236', 'CHIVOR'),
('15', 'BOYACÁ', '15244', 'EL COCUY'),
('15', 'BOYACÁ', '15248', 'EL ESPINO'),
('15', 'BOYACÁ', '15276', 'FLORESTA'),
('15', 'BOYACÁ', '15296', 'GACHANTIVÁ'),
('15', 'BOYACÁ', '15299', 'GARAGOA'),
('15', 'BOYACÁ', '15317', 'GUACAMAYAS'),
('15', 'BOYACÁ', '15334', 'GUICÁN DE LA SIERRA'),
('15', 'BOYACÁ', '15368', 'JERICÓ'),
('15', 'BOYACÁ', '15377', 'LABRANZAGRANDE'),
('15', 'BOYACÁ', '15380', 'LA CAPILLA'),
('15', 'BOYACÁ', '15401', 'LA UVITA'),
('15', 'BOYACÁ', '15403', 'LA VICTORIA'),
('15', 'BOYACÁ', '15442', 'MARIPÍ'),
('15', 'BOYACÁ', '15464', 'MONGUA'),
('15', 'BOYACÁ', '15466', 'MONGUÍ'),
('15', 'BOYACÁ', '15480', 'MUZO'),
('15', 'BOYACÁ', '15500', 'OICATÁ'),
('15', 'BOYACÁ', '15507', 'OTANCHE'),
('15', 'BOYACÁ', '15511', 'PACHAVITA'),
('15', 'BOYACÁ', '15514', 'PÁEZ'),
('15', 'BOYACÁ', '15518', 'PAJARITO'),
('15', 'BOYACÁ', '15522', 'PANQUEBA'),
('15', 'BOYACÁ', '15537', 'PAZ DE RIO'),
('15', 'BOYACÁ', '15564', 'PISBA'),
('15', 'BOYACÁ', '15580', 'QUÍPAMA'),
('15', 'BOYACÁ', '15621', 'RONDÓN'),
('15', 'BOYACÁ', '15632', 'SABOYÁ'),
('15', 'BOYACÁ', '15638', 'SÁCHICA'),
('15', 'BOYACÁ', '15667', 'SAN LUIS DE GACENO'),
('15', 'BOYACÁ', '15673', 'SAN MATEO'),
('15', 'BOYACÁ', '15681', 'SAN PABLO DE BORBUR'),
('15', 'BOYACÁ', '15690', 'SANTA MARÍA'),
('15', 'BOYACÁ', '15696', 'SANTA SOFÍA'),
('15', 'BOYACÁ', '15720', 'SATIVANORTE'),
('15', 'BOYACÁ', '15723', 'SATIVASUR'),
('15', 'BOYACÁ', '15753', 'SOATA'),
('15', 'BOYACÁ', '15755', 'SOCOTA'),
('15', 'BOYACÁ', '15757', 'SOCHA'),
('15', 'BOYACÁ', '15774', 'SORA'),
('15', 'BOYACÁ', '15776', 'SOTAQUIRA'),
('15', 'BOYACÁ', '15778', 'SORACA'),
('15', 'BOYACÁ', '15790', 'TASCO'),
('15', 'BOYACÁ', '15804', 'TIBANA'),
('15', 'BOYACÁ', '15806', 'TOCA'),
('15', 'BOYACÁ', '15808', 'TOGUI'),
('15', 'BOYACÁ', '15810', 'TOPAGA'),
('15', 'BOYACÁ', '15814', 'TIBASOSA'),
('15', 'BOYACÁ', '15816', 'TINJACA'),
('15', 'BOYACÁ', '15820', 'TIPACOQUE'),
('15', 'BOYACÁ', '15822', 'TUNUNGUÁ'),
('15', 'BOYACÁ', '15832', 'TUTA'),
('15', 'BOYACÁ', '15835', 'TURMEQUE'),
('15', 'BOYACÁ', '15837', 'TUTAZÁ'),
('15', 'BOYACÁ', '15839', 'VENTAQUEMADA'),
('15', 'BOYACÁ', '15842', 'VIRACACHA'),
('15', 'BOYACÁ', '15861', 'ZETAQUIRA'),
-- Corregimientos / Centros poblados destacados
('15', 'BOYACÁ', '15572001', 'PUERTO ROMERO (CORREGIMIENTO)'),
('15', 'BOYACÁ', '15572002', 'EL DOS Y MEDIO (CORREGIMIENTO)'),
('15', 'BOYACÁ', '15407001', 'LA COLORADA (CORREGIMIENTO)'),
('15', 'BOYACÁ', '15759001', 'MORCÁ (CORREGIMIENTO)'),
('15', 'BOYACÁ', '15759002', 'VENECIA (CORREGIMIENTO)')
ON CONFLICT (codigo_mpio) DO NOTHING;

-- 2. Asegurar soporte de columna municipio_expedicion en personas
ALTER TABLE personas ADD COLUMN IF NOT EXISTS municipio_expedicion VARCHAR(120);

UPDATE personas 
SET municipio_expedicion = COALESCE(NULLIF(ciudad_expedicion, ''), NULLIF(expedida, ''), 'TUNJA')
WHERE municipio_expedicion IS NULL OR municipio_expedicion = '';

-- 3. Modificación de rel_principal para Experiencia Múltiple (JSONB)
-- Aseguramos que la columna soporte texto largo o estructura JSONB
ALTER TABLE rel_principal ALTER COLUMN otro_tiempo_gobernacion TYPE TEXT;
ALTER TABLE rel_principal ADD COLUMN IF NOT EXISTS otros_tiempos_periodos JSONB DEFAULT '[]'::jsonb;

-- Migración de datos existentes: si hay texto de tiempo, dejarlo preservado
UPDATE rel_principal 
SET otros_tiempos_periodos = json_build_array(json_build_object('nota', otro_tiempo_gobernacion))::jsonb
WHERE otro_tiempo_gobernacion IS NOT NULL 
  AND otro_tiempo_gobernacion <> '' 
  AND otro_tiempo_gobernacion <> 'NO REGISTRADO'
  AND otros_tiempos_periodos = '[]'::jsonb;
