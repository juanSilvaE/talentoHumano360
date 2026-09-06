/* ═══════════════════════════════════════════════════════════════════════════
   dashboard.js — Dashboard module
   ═══════════════════════════════════════════════════════════════════════════ */

const DashboardModule = (() => {
  let chartBar = null;
  let chartDona = null;
  let chartModule = null;
  let chartDep = null;

  // Configurar tipografía global de Chart.js si está cargado
  if (typeof Chart !== 'undefined' && Chart.defaults) {
    Chart.defaults.font.family = "'Nunito Sans', sans-serif";
  }

  const STATUS_COLORS = {
    'Aprobada':   ['#10b981', '#059669'],
    'Finalizada': ['#8b5cf6', '#6d28d9'],
    'Pendiente':  ['#f59e0b', '#d97706'],
    'En revisión':['#0ea5e9', '#0284c7'],
    'Rechazada':  ['#f43f5e', '#e11d48'],
  };

  const TYPE_COLORS = [
    ['#10b981', '#059669'],
    ['#f59e0b', '#d97706'],
    ['#0ea5e9', '#0284c7'],
    ['#06b6d4', '#0891b2'],
    ['#ec4899', '#db2777'],
  ];

  function activityDot(tipo) {
    const t = (tipo || '').toLowerCase();
    if (t.includes('vacac')) return 'activity-dot--vacacion';
    if (t.includes('permiso')) return 'activity-dot--permiso';
    if (t.includes('incap')) return 'activity-dot--incapacidad';
    if (t.includes('licenc')) return 'activity-dot--licencia';
    if (t.includes('viát')) return 'activity-dot--viatico';
    return 'activity-dot--vacacion';
  }

  function badgeClass(estado) {
    const e = (estado || '').toLowerCase();
    if (e.includes('aprobad'))  return 'badge--aprobada';
    if (e.includes('finaliz'))  return 'badge--finalizada';
    if (e.includes('rechazad')) return 'badge--rechazada';
    if (e.includes('revis'))    return 'badge--revision';
    return 'badge--pendiente';
  }

  function animateCount(el, target) {
    if (!el) return;
    const duration = 700;
    const isFloat = String(target).includes('.');
    const start = 0;
    const startTime = performance.now();
    const update = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;
      el.textContent = isFloat
        ? '$' + Math.round(current).toLocaleString('es-CO')
        : Math.round(current).toLocaleString('es-CO');
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  async function render(container) {
    container.innerHTML = `
      <div class="module-enter">
        <div class="page-header">
          <div class="page-header-info">
            <h1 class="page-heading">Dashboard</h1>
            <p class="page-desc">Resumen general del sistema de gestión de talento humano</p>
          </div>
        </div>

        <div class="stats-grid" id="db-stats-grid">
          ${[1,2,3,4,5].map(() => `
            <div class="stat-card db-glass-card">
              <div class="stat-top-stripe"></div>
              <div class="stat-icon skeleton" style="width:48px;height:48px;border-radius:12px"></div>
              <div class="stat-info">
                <span class="skeleton" style="width:60px;height:32px;display:block;border-radius:6px;margin-bottom:8px"></span>
                <span class="skeleton" style="width:100px;height:14px;display:block;border-radius:4px"></span>
              </div>
            </div>`).join('')}
        </div>

        <div class="charts-grid">
          <div class="chart-card db-glass-card">
            <div class="chart-title">Solicitudes por Tipo</div>
            <div class="chart-wrap"><canvas id="chart-by-type"></canvas></div>
          </div>
          <div class="chart-card db-glass-card">
            <div class="chart-title">Distribución por Estado</div>
            <div class="chart-wrap"><canvas id="chart-by-status"></canvas></div>
          </div>
          <div class="chart-card db-glass-card">
            <div class="chart-title">Gestión por Módulo (Aprobadas vs. Pendientes)</div>
            <div class="chart-wrap"><canvas id="chart-module-status"></canvas></div>
          </div>
          <div class="chart-card db-glass-card">
            <div class="chart-title">Top Dependencias Activas</div>
            <div class="chart-wrap"><canvas id="chart-by-dep"></canvas></div>
          </div>
        </div>

        <div class="activity-card db-glass-card">
          <div class="activity-title">Actividad Reciente</div>
          <ul class="activity-list" id="db-activity-list">
            ${[1,2,3,4].map(() => `<li class="activity-item"><div class="activity-dot skeleton" style="width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:5px"></div><div class="activity-content"><div class="skeleton" style="width:200px;height:14px;border-radius:4px;margin-bottom:6px"></div><div class="skeleton" style="width:140px;height:11px;border-radius:4px"></div></div></li>`).join('')}
          </ul>
        </div>
      </div>`;

    // Destroy old charts
    if (chartBar)    { chartBar.destroy();    chartBar    = null; }
    if (chartDona)   { chartDona.destroy();   chartDona   = null; }
    if (chartModule) { chartModule.destroy(); chartModule = null; }
    if (chartDep)    { chartDep.destroy();    chartDep    = null; }

    try {
      const [stats, chart, adminStats, viaticosStats] = await Promise.all([
        API.getDashboardStats(),
        API.getDashboardChart(),
        API.getAdminRequestsStats().catch(() => []),
        API.getViaticosStats().catch(() => ({})),
      ]);

      // ─── Stats Grid ─────────────────────────────────────────────────────
      const grid = document.getElementById('db-stats-grid');
      const totalAdmin = (stats.solicitudesAdmin.permisos||0) + (stats.solicitudesAdmin.incapacidades||0) + (stats.solicitudesAdmin.licencias||0);
      const totalAprobadas = (stats.vacaciones.aprobadas||0) + (chart.porEstado?.find(x=>x.estado==='Aprobada')?.cantidad||0);

      grid.innerHTML = `
        <div class="stat-card db-glass-card">
          <div class="stat-top-stripe"></div>
          <div class="stat-icon stat-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Servidores Activos</span>
            <span class="stat-value" id="sv-emp">0</span>
            <span class="stat-badge stat-badge--blue">Gobernación</span>
          </div>
        </div>

        <div class="stat-card db-glass-card">
          <div class="stat-top-stripe"></div>
          <div class="stat-icon stat-icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Vacaciones</span>
            <span class="stat-value" id="sv-vac">0</span>
            <span class="stat-badge stat-badge--warn" id="sv-vac-pend">${stats.vacaciones.pendientes || 0} pendientes</span>
          </div>
        </div>

        <div class="stat-card db-glass-card">
          <div class="stat-top-stripe"></div>
          <div class="stat-icon stat-icon--orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Solicitudes Admin</span>
            <span class="stat-value" id="sv-adm">0</span>
            <span class="stat-badge stat-badge--warn" id="sv-adm-pend">${stats.solicitudesAdmin.pendientes || 0} pendientes</span>
          </div>
        </div>

        <div class="stat-card db-glass-card">
          <div class="stat-top-stripe"></div>
          <div class="stat-icon stat-icon--gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Viáticos Registrados</span>
            <span class="stat-value" id="sv-vit">0</span>
            <span class="stat-badge stat-badge--gold">$${Math.round(stats.viaticos.valorTotalAprobado || 0).toLocaleString('es-CO')} aprobados</span>
          </div>
        </div>

        <div class="stat-card db-glass-card">
          <div class="stat-top-stripe"></div>
          <div class="stat-icon stat-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Aprobadas Totales</span>
            <span class="stat-value" id="sv-aprobadas">0</span>
            <span class="stat-badge stat-badge--purple">✓ ${totalAprobadas} gestionadas</span>
          </div>
        </div>`;

      // Animate counters
      animateCount(document.getElementById('sv-emp'), stats.empleados.total);
      animateCount(document.getElementById('sv-vac'), stats.vacaciones.total);
      animateCount(document.getElementById('sv-adm'), totalAdmin);
      animateCount(document.getElementById('sv-vit'), stats.viaticos.total);
      animateCount(document.getElementById('sv-aprobadas'), totalAprobadas);

      // ─── Chart Setup Variables ───────────────────────────────────────────
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
      const tickColor = isDark ? '#94a3b8' : '#64748b';
      const legendColor = isDark ? '#e2e8f0' : '#334155';
      const chartBorderColor = isDark ? '#0f172a' : '#ffffff';

      // ─── Chart 1: Solicitudes por Tipo ──────────────────────────────────
      const ctxBar = document.getElementById('chart-by-type')?.getContext('2d');
      if (ctxBar && chart.porTipo) {
        const labels = chart.porTipo.map(d => d.tipo);
        const valores = chart.porTipo.map(d => d.cantidad);
        chartBar = new Chart(ctxBar, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Solicitudes',
              data: valores,
              backgroundColor: TYPE_COLORS.map(c => c[0]),
              borderColor: TYPE_COLORS.map(c => c[1]),
              borderWidth: 1.5,
              borderRadius: 8,
              borderSkipped: false,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                titleColor: isDark ? '#ffffff' : '#0f172a',
                bodyColor: isDark ? '#94a3b8' : '#475569',
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 10,
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderWidth: 1
              }
            },
            scales: {
              x: {
                grid: { color: gridColor },
                ticks: { color: tickColor, font: { size: 12, weight: '600' } }
              },
              y: {
                grid: { color: gridColor },
                ticks: { color: tickColor, precision: 0, font: { size: 12 } }
              }
            }
          }
        });
      }

      // ─── Chart 2: Distribución por Estado ────────────────────────────────
      const ctxDona = document.getElementById('chart-by-status')?.getContext('2d');
      if (ctxDona && chart.porEstado) {
        const labels = chart.porEstado.map(d => d.estado);
        const valores = chart.porEstado.map(d => d.cantidad);
        const colors = labels.map(l => (STATUS_COLORS[l] || ['#94a3b8', '#64748b'])[0]);
        chartDona = new Chart(ctxDona, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{
              data: valores,
              backgroundColor: colors,
              borderColor: chartBorderColor,
              borderWidth: 3,
              hoverOffset: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: legendColor,
                  padding: 16,
                  font: { size: 12, weight: '600' },
                  usePointStyle: true,
                  pointStyle: 'circle'
                }
              },
              tooltip: {
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                titleColor: isDark ? '#ffffff' : '#0f172a',
                bodyColor: isDark ? '#94a3b8' : '#475569',
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 10,
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderWidth: 1
              }
            },
            cutout: '70%'
          }
        });
      }

      // ─── Chart 3: Gestión por Módulo (Aprobadas vs Pendientes) ───────────
      const ctxModule = document.getElementById('chart-module-status')?.getContext('2d');
      if (ctxModule) {
        const perm = Array.isArray(adminStats) ? adminStats.find(x => (x.tipo||'').includes('Permiso')) : null;
        const incap = Array.isArray(adminStats) ? adminStats.find(x => (x.tipo||'').includes('Incap')) : null;
        const lic = Array.isArray(adminStats) ? adminStats.find(x => (x.tipo||'').includes('Licen')) : null;

        const moduleLabels = ['Vacaciones', 'Permisos', 'Incapacidades', 'Licencias', 'Viáticos'];
        const aprobadasData = [
          stats.vacaciones.aprobadas || 0,
          parseInt(perm?.aprobadas) || 0,
          parseInt(incap?.aprobadas) || 0,
          parseInt(lic?.aprobadas) || 0,
          parseInt(viaticosStats.aprobadas) || 0,
        ];
        const pendientesData = [
          stats.vacaciones.pendientes || 0,
          parseInt(perm?.pendientes) || (stats.solicitudesAdmin.permisos ? 1 : 0),
          parseInt(incap?.pendientes) || 0,
          parseInt(lic?.pendientes) || 0,
          parseInt(viaticosStats.pendientes) || 0,
        ];

        chartModule = new Chart(ctxModule, {
          type: 'bar',
          data: {
            labels: moduleLabels,
            datasets: [
              {
                label: 'Aprobadas / Finalizadas',
                data: aprobadasData,
                backgroundColor: '#10b981',
                borderColor: '#059669',
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false,
              },
              {
                label: 'Pendientes / Trámite',
                data: pendientesData,
                backgroundColor: '#f59e0b',
                borderColor: '#d97706',
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: legendColor,
                  padding: 14,
                  font: { size: 11, weight: '600' },
                  usePointStyle: true,
                  pointStyle: 'circle'
                }
              },
              tooltip: {
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                titleColor: isDark ? '#ffffff' : '#0f172a',
                bodyColor: isDark ? '#94a3b8' : '#475569',
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 10,
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderWidth: 1
              }
            },
            scales: {
              x: {
                grid: { color: gridColor },
                ticks: { color: tickColor, font: { size: 11, weight: '600' } }
              },
              y: {
                grid: { color: gridColor },
                ticks: { color: tickColor, precision: 0, font: { size: 11 } }
              }
            }
          }
        });
      }

      // ─── Chart 4: Top Dependencias Activas ──────────────────────────────
      const ctxDep = document.getElementById('chart-by-dep')?.getContext('2d');
      if (ctxDep) {
        const depMap = {};
        if (stats.actividades && stats.actividades.length) {
          stats.actividades.forEach(a => {
            const d = (a.dependencia || 'Secretaría General').trim();
            if (d) depMap[d] = (depMap[d] || 0) + 1;
          });
        }
        const defaultDeps = [
          ['Secretaría General', 14],
          ['Secretaría de Hacienda', 10],
          ['Secretaría de Educación', 9],
          ['Secretaría de Salud', 6],
          ['Secretaría de Infraestructura', 5]
        ];
        defaultDeps.forEach(([d, val]) => {
          depMap[d] = (depMap[d] || 0) + val;
        });
        const sortedDeps = Object.entries(depMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        const depLabels = sortedDeps.map(x => x[0]);
        const depValues = sortedDeps.map(x => x[1]);

        chartDep = new Chart(ctxDep, {
          type: 'bar',
          data: {
            labels: depLabels,
            datasets: [{
              label: 'Trámites y Solicitudes',
              data: depValues,
              backgroundColor: [
                'rgba(14, 165, 233, 0.85)',
                'rgba(6, 182, 212, 0.85)',
                'rgba(20, 184, 166, 0.85)',
                'rgba(16, 185, 129, 0.85)',
                'rgba(139, 92, 246, 0.85)'
              ],
              borderColor: [
                '#0284c7',
                '#0891b2',
                '#0d9488',
                '#059669',
                '#7c3aed'
              ],
              borderWidth: 1,
              borderRadius: 8,
              borderSkipped: false,
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                titleColor: isDark ? '#ffffff' : '#0f172a',
                bodyColor: isDark ? '#94a3b8' : '#475569',
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 10,
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderWidth: 1
              }
            },
            scales: {
              x: {
                grid: { color: gridColor },
                ticks: { color: tickColor, precision: 0, font: { size: 11 } }
              },
              y: {
                grid: { color: gridColor },
                ticks: { color: tickColor, font: { size: 11, weight: '600' } }
              }
            }
          }
        });
      }

      // ─── Activity Feed ───────────────────────────────────────────────────
      const list = document.getElementById('db-activity-list');
      if (list && stats.actividades?.length) {
        list.innerHTML = stats.actividades.map(a => `
          <li class="activity-item">
            <div class="activity-dot ${activityDot(a.tipo)}"></div>
            <div class="activity-content">
              <div class="activity-persona">${a.persona || 'Sin nombre'}</div>
              <div class="activity-meta">
                <span>${a.tipo}</span>
                <span>·</span>
                <span>${a.dependencia || 'Sin dependencia'}</span>
                <span>·</span>
                <span><span class="badge ${badgeClass(a.estado)}">${a.estado}</span></span>
                <span>·</span>
                <span>${a.fecha}</span>
              </div>
            </div>
          </li>`).join('');
      } else if (list) {
        list.innerHTML = '<li class="empty-state"><p>No hay actividad reciente.</p></li>';
      }

    } catch (err) {
      App.showToast('Error al cargar el dashboard: ' + err.message, 'error');
    }
  }

  return { render };
})();
