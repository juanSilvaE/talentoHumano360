const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost', port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'talento360', user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
});
const JWT_SECRET = process.env.JWT_SECRET || 'humano360_secret_2026';

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No autorizado.' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Token inválido.' }); }
}
function canEdit(role) {
  return role && (role.toLowerCase().includes('administrador') || role.toLowerCase().includes('coordinador'));
}
function clean(v) { return v == null ? '' : v.trim().replace(/\s+/g,' ').toUpperCase(); }

// ─── GET /api/employees ───────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  const { q = '', page = 1, limit = 30 } = req.query;
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  try {
    const whereClause = q
      ? `WHERE LOWER(p.nombre_completo) LIKE LOWER($1) OR p.cedula LIKE $1
              OR LOWER(d.dependencia) LIKE LOWER($1) OR LOWER(ca.cargo) LIKE LOWER($1)`
      : '';
    const params = q ? [`%${q.trim()}%`] : [];
    const limitParam = q ? `$2` : `$1`;
    const offsetParam = q ? `$3` : `$2`;

    const sql = `
      SELECT r.id_registro,
             COALESCE(p.cedula,'') AS cedula,
             COALESCE(p.nombre_completo,'') AS nombre_completo,
             COALESCE(d.dependencia,'') AS dependencia,
             COALESCE(ca.cargo,'') AS cargo_actual,
             COALESCE(cb.cargo,'') AS cargo_base,
             COALESCE(con.correo_institucional,'') AS correo,
             COALESCE(con.celular,'') AS celular,
             COALESCE(e.situacion,'') AS situacion,
             COALESCE(r.fecha_ingreso,'') AS fecha_ingreso,
             COALESCE(p.sexo,'') AS sexo
      FROM rel_principal r
      LEFT JOIN personas p   ON p.id_persona    = r.id_persona
      LEFT JOIN dependencias d ON d.id_dependencia = r.id_dependencia
      LEFT JOIN cargos ca    ON ca.id_cargo      = r.id_cargo_actual
      LEFT JOIN cargos cb    ON cb.id_cargo      = r.id_cargo_base
      LEFT JOIN contactos con ON con.id_contacto  = r.id_contacto
      LEFT JOIN estados e    ON e.id_estado       = r.id_estado
      ${whereClause}
      ORDER BY p.nombre_completo
      LIMIT ${limitParam} OFFSET ${offsetParam}`;

    const allParams = [...params, parseInt(limit), offset];
    const rows = await pool.query(sql, allParams);

    // Count total
    const countSql = `
      SELECT COUNT(*) FROM rel_principal r
      LEFT JOIN personas p ON p.id_persona = r.id_persona
      LEFT JOIN dependencias d ON d.id_dependencia = r.id_dependencia
      LEFT JOIN cargos ca ON ca.id_cargo = r.id_cargo_actual
      ${whereClause}`;
    const countRows = await pool.query(countSql, params);
    const total = parseInt(countRows.rows[0].count);

    res.json({
      data: rows.rows.map(r => ({
        id: r.id_registro,
        cedula: r.cedula,
        nombreCompleto: clean(r.nombre_completo),
        dependencia: clean(r.dependencia),
        cargoActual: clean(r.cargo_actual),
        cargoBase: clean(r.cargo_base),
        correo: r.correo,
        celular: r.celular,
        situacion: r.situacion,
        fechaIngreso: r.fecha_ingreso,
        sexo: r.sexo,
      })),
      total, page: parseInt(page), limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error('[employees] list error:', err.message);
    res.status(500).json({ error: 'Error al listar servidores.' });
  }
});

// ─── GET /api/employees/catalogs ─────────────────────────────────────────────
router.get('/catalogs', auth, async (_, res) => {
  try {
    const [deps, cargos] = await Promise.all([
      pool.query('SELECT dependencia FROM dependencias ORDER BY dependencia'),
      pool.query('SELECT cargo FROM cargos ORDER BY cargo'),
    ]);
    res.json({
      departamentos: deps.rows.map(r => clean(r.dependencia)).filter(Boolean),
      cargos: cargos.rows.map(r => clean(r.cargo)).filter(Boolean),
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar catálogos.' });
  }
});

// ─── POST /api/employees ─────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  if (!canEdit(req.user.role)) return res.status(403).json({ error: 'Permisos insuficientes.' });
  const { nombreCompleto, cedula, dependencia, cargoActual, correo, celular, fechaIngreso, sexo } = req.body;
  if (!nombreCompleto || !cedula) return res.status(400).json({ error: 'Nombre y cédula son requeridos.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check duplicate
    const dup = await client.query('SELECT 1 FROM personas WHERE cedula = $1 LIMIT 1', [cedula.trim()]);
    if (dup.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Ya existe un servidor con esa cédula.' });
    }

    const nextId = async (table, col, prefix, width) => {
      const r = await client.query(`SELECT ${col} FROM ${table}`);
      let max = 0;
      r.rows.forEach(row => {
        const digits = (row[col.toLowerCase()] || '').replace(/\D/g, '');
        if (digits) max = Math.max(max, parseInt(digits));
      });
      return prefix + String(max + 1).padStart(width, '0');
    };

    const findOrCreate = async (table, idCol, nameCol, prefix, width, name, insertFn) => {
      const cleanName = clean(name) || 'NO REGISTRADO';
      const existing = await client.query(`SELECT ${idCol} FROM ${table} WHERE LOWER(${nameCol}) = LOWER($1) LIMIT 1`, [cleanName]);
      if (existing.rows.length > 0) return existing.rows[0][idCol.toLowerCase()];
      const id = await nextId(table, idCol, prefix, width);
      await insertFn(id, cleanName);
      return id;
    };

    const personId = await nextId('personas', 'id_persona', 'PER', 4);
    const contactId = await nextId('contactos', 'id_contacto', 'CON', 4);
    const educationId = await nextId('educacion', 'id_educacion', 'EDU', 4);
    const recordId = await nextId('rel_principal', 'id_registro', 'REL', 4);

    const deptId = await findOrCreate('dependencias', 'id_dependencia', 'dependencia', 'DEP', 3, dependencia || 'NO REGISTRADO', async (id, name) =>
      client.query('INSERT INTO dependencias(id_dependencia, dependencia) VALUES ($1,$2)', [id, name]));

    const cargoId = await findOrCreate('cargos', 'id_cargo', 'cargo', 'CAR', 3, cargoActual || 'NO REGISTRADO', async (id, name) =>
      client.query("INSERT INTO cargos(id_cargo, tipo_cargo, cargo, codigo, grado, asignacion_sueldo, nivel) VALUES ($1,'PLANTA',$2,'N/A','N/A','$0','NO REGISTRADO')", [id, name]));

    const statusId = await findOrCreate('estados', 'id_estado', 'situacion', 'EST', 3, 'ACTIVO', async (id, name) =>
      client.query("INSERT INTO estados(id_estado, clasificacion_empleo, situacion, funciones_pagadas, novedades, opec) VALUES ($1,'NO REGISTRADO',$2,'NO REGISTRADO','','NO REGISTRADO')", [id, name]));

    const cleanNombre = clean(nombreCompleto);
    const parts = cleanNombre.split(' ');
    const apellido1 = parts[0] || 'NO REGISTRADO';
    const apellido2 = parts[1] || 'NO REGISTRADO';
    const nombres   = parts.slice(2).join(' ') || parts[0] || 'NO REGISTRADO';

    await client.query(
      "INSERT INTO personas(id_persona,cedula,primer_apellido,segundo_apellido,nombres,nombre_completo,expedida,tipo_sangre,fecha_nacimiento,edad,sexo) VALUES($1,$2,$3,$4,$5,$6,'TUNJA','NO REGISTRADO','NO REGISTRADO','NO REGISTRADO',$7)",
      [personId, cedula.trim(), apellido1, apellido2, nombres, cleanNombre, clean(sexo) || 'NO REGISTRADO']);

    await client.query(
      "INSERT INTO contactos(id_contacto,direccion,ciudad,telefono_fijo,celular,correo_personal,correo_institucional) VALUES($1,'NO REGISTRADO','TUNJA, BOYACA','NO REGISTRADO',$2,'NO REGISTRADO',$3)",
      [contactId, celular || 'NO REGISTRADO', (correo || 'NO REGISTRADO').toLowerCase()]);

    await client.query(
      "INSERT INTO educacion(id_educacion,estudios,matricula_profesional,institucion_estudios,postgrado,institucion_postgrado,diplomado_cap_sena,correo_institucional) VALUES($1,'NO REGISTRADO','NO REGISTRADO','NO REGISTRADO','NO REGISTRADO','NO REGISTRADO','NO REGISTRADO',$2)",
      [educationId, (correo || 'NO REGISTRADO').toLowerCase()]);

    await client.query(
      "INSERT INTO rel_principal(id_registro,id_persona,id_cargo_base,id_cargo_actual,id_dependencia,id_educacion,id_contacto,id_estado,otro_tiempo_gobernacion,fecha_ingreso,tiempo_servicio,fecha_encargo) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'NO REGISTRADO',$9,'0 ANOS 0 MESES','NO REGISTRADO')",
      [recordId, personId, cargoId, cargoId, deptId, educationId, contactId, statusId, fechaIngreso || 'NO REGISTRADO']);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Servidor creado exitosamente.', id: recordId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[employees] create error:', err.message);
    res.status(500).json({ error: 'Error al crear el servidor.' });
  } finally { client.release(); }
});

// ─── PUT /api/employees/:cedula ───────────────────────────────────────────────
router.put('/:cedula', auth, async (req, res) => {
  if (!canEdit(req.user.role)) return res.status(403).json({ error: 'Permisos insuficientes.' });
  const { cedula } = req.params;
  const { nombreCompleto, dependencia, cargoActual, correo, celular, sexo, fechaIngreso } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      'SELECT r.id_registro, r.id_persona, r.id_contacto FROM rel_principal r JOIN personas p ON p.id_persona=r.id_persona WHERE p.cedula=$1 LIMIT 1',
      [cedula]);
    if (r.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Servidor no encontrado.' }); }
    const { id_registro, id_persona, id_contacto } = r.rows[0];

    const cleanNombre = clean(nombreCompleto);
    const parts = cleanNombre.split(' ');
    const apellido1 = parts[0] || 'NO REGISTRADO';
    const apellido2 = parts[1] || 'NO REGISTRADO';
    const nombres   = parts.slice(2).join(' ') || parts[0] || 'NO REGISTRADO';

    await client.query(
      'UPDATE personas SET nombre_completo=$1, primer_apellido=$2, segundo_apellido=$3, nombres=$4, sexo=$5 WHERE id_persona=$6',
      [cleanNombre || 'NO REGISTRADO', apellido1, apellido2, nombres, clean(sexo) || 'NO REGISTRADO', id_persona]);

    await client.query('UPDATE contactos SET correo_institucional=$1, celular=$2 WHERE id_contacto=$3',
      [(correo || 'NO REGISTRADO').toLowerCase(), celular || 'NO REGISTRADO', id_contacto]);

    const nextId = async (table, col, prefix, width) => {
      const qr = await client.query(`SELECT ${col} FROM ${table}`);
      let max = 0;
      qr.rows.forEach(row => {
        const digits = (row[col.toLowerCase()] || '').replace(/\D/g, '');
        if (digits) max = Math.max(max, parseInt(digits));
      });
      return prefix + String(max + 1).padStart(width, '0');
    };

    const findOrCreate = async (table, idCol, nameCol, prefix, width, name, insertFn) => {
      const cleanName = clean(name) || 'NO REGISTRADO';
      const existing = await client.query(`SELECT ${idCol} FROM ${table} WHERE LOWER(${nameCol}) = LOWER($1) LIMIT 1`, [cleanName]);
      if (existing.rows.length > 0) return existing.rows[0][idCol.toLowerCase()];
      const id = await nextId(table, idCol, prefix, width);
      await insertFn(id, cleanName);
      return id;
    };

    let deptId = null;
    if (dependencia) {
      deptId = await findOrCreate('dependencias', 'id_dependencia', 'dependencia', 'DEP', 3, dependencia, async (id, name) =>
        client.query('INSERT INTO dependencias(id_dependencia, dependencia) VALUES ($1,$2)', [id, name]));
    }

    let cargoId = null;
    if (cargoActual) {
      cargoId = await findOrCreate('cargos', 'id_cargo', 'cargo', 'CAR', 3, cargoActual, async (id, name) =>
        client.query("INSERT INTO cargos(id_cargo, tipo_cargo, cargo, codigo, grado, asignacion_sueldo, nivel) VALUES ($1,'PLANTA',$2,'N/A','N/A','$0','NO REGISTRADO')", [id, name]));
    }

    const updateParts = ['fecha_ingreso=$1'];
    const updateVals  = [fechaIngreso || 'NO REGISTRADO'];
    let idx = 2;
    if (deptId)  { updateParts.push(`id_dependencia=$${idx++}`); updateVals.push(deptId); }
    if (cargoId) { updateParts.push(`id_cargo_actual=$${idx++}`, `id_cargo_base=$${idx++}`); updateVals.push(cargoId, cargoId); }
    updateVals.push(id_registro);
    await client.query(`UPDATE rel_principal SET ${updateParts.join(',')} WHERE id_registro=$${idx}`, updateVals);

    await client.query('COMMIT');
    res.json({ message: 'Servidor actualizado exitosamente.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[employees] update error:', err.message);
    res.status(500).json({ error: 'Error al actualizar el servidor.' });
  } finally { client.release(); }
});

// ─── DELETE /api/employees/:cedula ───────────────────────────────────────────
router.delete('/:cedula', auth, async (req, res) => {
  if (!canEdit(req.user.role)) return res.status(403).json({ error: 'Permisos insuficientes.' });
  const { cedula } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      'SELECT r.id_registro, r.id_persona, r.id_contacto, r.id_educacion FROM rel_principal r JOIN personas p ON p.id_persona=r.id_persona WHERE p.cedula=$1 LIMIT 1',
      [cedula]);
    if (r.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Servidor no encontrado.' });
    }
    const { id_registro, id_persona, id_contacto, id_educacion } = r.rows[0];
    await client.query('DELETE FROM rel_principal WHERE id_registro=$1', [id_registro]);
    if (id_contacto) await client.query('DELETE FROM contactos WHERE id_contacto=$1', [id_contacto]);
    if (id_educacion) await client.query('DELETE FROM educacion WHERE id_educacion=$1', [id_educacion]);
    if (id_persona) await client.query('DELETE FROM personas WHERE id_persona=$1', [id_persona]);
    await client.query('COMMIT');
    res.json({ message: 'Servidor eliminado exitosamente.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[employees] delete error:', err.message);
    res.status(500).json({ error: 'Error al eliminar el servidor.' });
  } finally {
    client.release();
  }
});

module.exports = router;
