/* ═══════════════════════════════════════════════════════════════════════════
   dashboard.js — Dashboard module
   ═══════════════════════════════════════════════════════════════════════════ */

const DashboardModule = (() => {
  let chartBar = null;
  let chartDona = null;

  const STATUS_COLORS = {
    'Aprobada':   ['rgba(16,185,129,0.7)', 'rgba(16,185,129,1)'],
    'Finalizada': ['rgba(139,92,246,0.7)', 'rgba(139,92,246,1)'],
    'Pendiente':  ['rgba(245,158,11,0.7)', 'rgba(245,158,11,1)'],
    'En revisión':['rgba(59,130,246,0.7)', 'rgba(59,130,246,1)'],
    'Rechazada':  ['rgba(239,68,68,0.7)',  'rgba(239,68,68,1)'],
  };

  const TYPE_COLORS = [
    ['rgba(37,99,235,0.7)',   'rgba(37,99,235,1)'],
    ['rgba(16,185,129,0.7)', 'rgba(16,185,129,1)'],
    ['rgba(245,158,11,0.7)', 'rgba(245,158,11,1)'],
    ['rgba(200,166,61,0.7)', 'rgba(200,166,61,1)'],
    ['rgba(139,92,246,0.7)', 'rgba(139,92,246,1)'],
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
            <div class="stat-card">
              <div class="stat-icon skeleton" style="width:48px;height:48px;border-radius:12px"></div>
              <div class="stat-info">
                <span class="skeleton" style="width:60px;height:32px;display:block;border-radius:6px;margin-bottom:8px"></span>
                <span class="skeleton" style="width:100px;height:14px;display:block;border-radius:4px"></span>
              </div>
            </div>`).join('')}
        </div>

        <div class="charts-grid">
          <div class="chart-card"><div class="chart-title">Solicitudes por Tipo</div><div class="chart-wrap"><canvas id="chart-by-type"></canvas></div></div>
          <div class="chart-card"><div class="chart-title">Distribución por Estado</div><div class="chart-wrap"><canvas id="chart-by-status"></canvas></div></div>
        </div>

        <div class="activity-card">
          <div class="activity-title">Actividad Reciente</div>
          <ul class="activity-list" id="db-activity-list">
            ${[1,2,3,4].map(() => `<li class="activity-item"><div class="activity-dot skeleton" style="width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:5px"></div><div class="activity-content"><div class="skeleton" style="width:200px;height:14px;border-radius:4px;margin-bottom:6px"></div><div class="skeleton" style="width:140px;height:11px;border-radius:4px"></div></div></li>`).join('')}
          </ul>
        </div>
      </div>`;

    // Destroy old charts
    if (chartBar)  { chartBar.destroy();  chartBar  = null; }
    if (chartDona) { chartDona.destroy(); chartDona = null; }

    try {
      const [stats, chart] = await Promise.all([
        API.getDashboardStats(),
        API.getDashboardChart(),
      ]);

      // ─── Stats Grid ─────────────────────────────────────────────────────
      const grid = document.getElementById('db-stats-grid');
      const totalAdmin = (stats.solicitudesAdmin.permisos||0) + (stats.solicitudesAdmin.incapacidades||0) + (stats.solicitudesAdmin.licencias||0);
      const totalAprobadas = (stats.vacaciones.aprobadas||0) + (chart.porEstado?.find(x=>x.estado==='Aprobada')?.cantidad||0);

      grid.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon stat-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Servidores Activos</span>
            <span class="stat-value" id="sv-emp">0</span>
            <span class="stat-badge stat-badge--success">Gobernación</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Vacaciones</span>
            <span class="stat-value" id="sv-vac">0</span>
            <span class="stat-badge stat-badge--warn" id="sv-vac-pend">${stats.vacaciones.pendientes || 0} pendientes</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon--orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Solicitudes Admin</span>
            <span class="stat-value" id="sv-adm">0</span>
            <span class="stat-badge stat-badge--warn" id="sv-adm-pend">${stats.solicitudesAdmin.pendientes || 0} pendientes</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon--gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Viáticos Registrados</span>
            <span class="stat-value" id="sv-vit">0</span>
            <span class="stat-badge stat-badge--success">$${Math.round(stats.viaticos.valorTotalAprobado || 0).toLocaleString('es-CO')} aprobados</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Aprobadas Totales</span>
            <span class="stat-value" id="sv-aprobadas">0</span>
            <span class="stat-badge stat-badge--success">Gestionadas</span>
          </div>
        </div>`;

      // Animate counters
      animateCount(document.getElementById('sv-emp'), stats.empleados.total);
      animateCount(document.getElementById('sv-vac'), stats.vacaciones.total);
      animateCount(document.getElementById('sv-adm'), totalAdmin);
      animateCount(document.getElementById('sv-vit'), stats.viaticos.total);
      animateCount(document.getElementById('sv-aprobadas'), stats.vacaciones.aprobadas);

      // ─── Charts ──────────────────────────────────────────────────────────
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
              backgroundColor: [
                'rgba(37,99,235,0.75)',
                'rgba(16,185,129,0.75)',
                'rgba(245,158,11,0.75)',
                'rgba(200,166,61,0.75)',
                'rgba(139,92,246,0.75)',
              ],
              borderColor: [
                'rgba(59,130,246,1)',
                'rgba(52,211,153,1)',
                'rgba(251,191,36,1)',
                'rgba(240,200,74,1)',
                'rgba(167,139,250,1)',
              ],
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
                backgroundColor: 'rgba(15, 27, 45, 0.95)',
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
                borderColor: 'rgba(255,255,255,0.15)',
                borderWidth: 1
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 12, weight: '500' } }
              },
              y: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: 'rgba(255,255,255,0.7)', precision: 0, font: { size: 12 } }
              }
            }
          }
        });
      }

      const ctxDona = document.getElementById('chart-by-status')?.getContext('2d');
      if (ctxDona && chart.porEstado) {
        const labels = chart.porEstado.map(d => d.estado);
        const valores = chart.porEstado.map(d => d.cantidad);
        const colors = labels.map(l => (STATUS_COLORS[l] || ['rgba(100,100,100,0.5)', 'rgba(100,100,100,1)'])[0]);
        const borders = labels.map(l => (STATUS_COLORS[l] || ['rgba(100,100,100,0.5)', 'rgba(100,100,100,1)'])[1]);
        chartDona = new Chart(ctxDona, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{
              data: valores,
              backgroundColor: colors,
              borderColor: borders,
              borderWidth: 2,
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
                  color: 'rgba(255,255,255,0.85)',
                  padding: 16,
                  font: { size: 12, weight: '500' },
                  usePointStyle: true,
                  pointStyle: 'circle'
                }
              },
              tooltip: {
                backgroundColor: 'rgba(15, 27, 45, 0.95)',
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
                borderColor: 'rgba(255,255,255,0.15)',
                borderWidth: 1
              }
            },
            cutout: '68%'
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
