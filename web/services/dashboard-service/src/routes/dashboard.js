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

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
router.get('/stats', auth, async (_, res) => {
  try {
    const [empleados, vacaciones, adminReqs, viaticos, recientes] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM rel_principal'),
      pool.query(`
        SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE LOWER(estado)='pendiente' OR estado IS NULL) AS pendientes,
               COUNT(*) FILTER (WHERE LOWER(estado) LIKE '%aprobad%' OR LOWER(estado) LIKE '%finaliz%') AS aprobadas,
               COUNT(*) FILTER (WHERE LOWER(estado) LIKE '%rechazad%') AS rechazadas
        FROM vacaciones`),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE tipo='Permiso Laboral') AS permisos,
          COUNT(*) FILTER (WHERE tipo='Incapacidad') AS incapacidades,
          COUNT(*) FILTER (WHERE tipo='Licencia') AS licencias,
          COUNT(*) FILTER (WHERE estado='Pendiente') AS pendientes
        FROM solicitudes_admin`),
      pool.query(`
        SELECT COUNT(*) AS total,
               COALESCE(SUM(valor_total) FILTER (WHERE estado IN ('Aprobada','Finalizada')), 0) AS valor_total
        FROM viaticos`),
      // Últimas actividades (mezcla de módulos)
      pool.query(`
        SELECT tipo_modulo, persona, dependencia, estado, fecha FROM (
          (SELECT 'Vacación' AS tipo_modulo, COALESCE(apellidos_nombres,'Sin nombre') AS persona,
                  COALESCE(dependencia,'') AS dependencia, COALESCE(estado,'Pendiente') AS estado,
                  COALESCE(hoy,TO_CHAR(NOW(),'DD/MM/YYYY')) AS fecha,
                  id_vacacion AS orden_id
           FROM vacaciones ORDER BY id_vacacion DESC LIMIT 5)
          UNION ALL
          (SELECT tipo AS tipo_modulo, COALESCE(apellidos_nombres,'Sin nombre'), COALESCE(dependencia,''), estado, COALESCE(fecha_solicitud,TO_CHAR(NOW(),'DD/MM/YYYY')),
                  id_solicitud AS orden_id
           FROM solicitudes_admin ORDER BY id_solicitud DESC LIMIT 5)
          UNION ALL
          (SELECT 'Viático' AS tipo_modulo, COALESCE(apellidos_nombres,'Sin nombre'), COALESCE(dependencia,''), estado, COALESCE(fecha_solicitud,TO_CHAR(NOW(),'DD/MM/YYYY')),
                  id_viatico AS orden_id
           FROM viaticos ORDER BY id_viatico DESC LIMIT 5)
        ) sub
        ORDER BY orden_id DESC LIMIT 10`)
    ]);

    const e = empleados.rows[0];
    const v = vacaciones.rows[0];
    const ar = adminReqs.rows[0];
    const vi = viaticos.rows[0];

    res.json({
      empleados: { total: parseInt(e.total)||0 },
      vacaciones: {
        total: parseInt(v.total)||0,
        pendientes: parseInt(v.pendientes)||0,
        aprobadas: parseInt(v.aprobadas)||0,
        rechazadas: parseInt(v.rechazadas)||0,
      },
      solicitudesAdmin: {
        permisos: parseInt(ar.permisos)||0,
        incapacidades: parseInt(ar.incapacidades)||0,
        licencias: parseInt(ar.licencias)||0,
        pendientes: parseInt(ar.pendientes)||0,
      },
      viaticos: {
        total: parseInt(vi.total)||0,
        valorTotalAprobado: parseFloat(vi.valor_total)||0,
      },
      actividades: recientes.rows.map(r => ({
        tipo: r.tipo_modulo, persona: (r.persona||'').trim().toUpperCase(),
        dependencia: (r.dependencia||'').trim(), estado: r.estado, fecha: r.fecha,
      })),
    });
  } catch (err) {
    console.error('[dashboard] stats error:', err.message);
    res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
});

// ─── GET /api/dashboard/chart ─────────────────────────────────────────────────
router.get('/chart', auth, async (_, res) => {
  try {
    // Por tipo de solicitud
    const byType = await pool.query(`
      SELECT 'Vacaciones' AS tipo, COUNT(*) AS cantidad FROM vacaciones
      UNION ALL
      SELECT 'Permisos', COUNT(*) FROM solicitudes_admin WHERE tipo='Permiso Laboral'
      UNION ALL
      SELECT 'Incapacidades', COUNT(*) FROM solicitudes_admin WHERE tipo='Incapacidad'
      UNION ALL
      SELECT 'Licencias', COUNT(*) FROM solicitudes_admin WHERE tipo='Licencia'
      UNION ALL
      SELECT 'Viáticos', COUNT(*) FROM viaticos
    `);
    // Por estado
    const byStatus = await pool.query(`
      SELECT estado, COUNT(*) AS cantidad FROM (
        SELECT COALESCE(estado,'Pendiente') AS estado FROM vacaciones
        UNION ALL SELECT estado FROM solicitudes_admin
        UNION ALL SELECT estado FROM viaticos
      ) t GROUP BY estado ORDER BY cantidad DESC`);

    res.json({
      porTipo: byType.rows.map(r => ({ tipo: r.tipo, cantidad: parseInt(r.cantidad)||0 })),
      porEstado: byStatus.rows.map(r => ({ estado: r.estado, cantidad: parseInt(r.cantidad)||0 })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Error gráficas.' });
  }
});

module.exports = router;
