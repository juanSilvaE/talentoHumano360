/* ═══════════════════════════════════════════════════════════════════════════
   employees.js — Módulo Integral de Gestión de Recursos Humanos (Talento 360)
   Implementa detalladamente las 22 reglas de negocio
   ═══════════════════════════════════════════════════════════════════════════ */

const EmployeesModule = (() => {
  let state = {
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
    q: '',
    catalogs: {
      dependencias: [],
      cargos: [],
      cargosPorDependencia: {},
      divipola: { departamentos: [], municipiosPorDepto: {} },
      grados: ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','N/a','NE'],
      clasificaciones: ['CARRERA ADMINISTRATIVA', 'LIBRE NOMBRAMIENTO Y REMOCIÓN', 'PROVISIONAL', 'PERIODO FIJO', 'TEMPORAL', 'TRABAJADOR OFICIAL'],
      estadosServidor: ['Activo', 'Inactivo', 'Pensionado'],
      sexos: ['Femenino', 'Masculino', 'Prefiero no decirlo'],
      discapacidades: ['visual', 'auditiva', 'motora', 'cognitiva', 'sordomuda', 'sordociega'],
      diplomados: [
        'Gestión Pública y Buen Gobierno',
        'Contratación Estatal y Secop II',
        'MIPG - Modelo Integrado de Planeación y Gestión',
        'Derecho Disciplinario y Control Interno',
        'Auditoría y Gestión Financiera Pública',
        'Sistemas Integrados de Gestión (HSEQ)',
        'Capacitación Técnica SENA',
        'Otro Diplomado / Especialización'
      ]
    }
  };

  /**
   * Regla 8: Formateador visual que muestra el número espaciado por puntos (ej. 1.000.000).
   */
  function formatCedulaDots(val) {
    if (!val) return '';
    const str = String(val).trim();
    if (/^PROV-\d+$/i.test(str)) return str;
    if (/^\d+$/.test(str)) {
      return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    return str;
  }

  /**
   * Reglas 13 y 14: Cálculo dinámico de fechas: "X años, Y meses, Z días"
   */
  function calcDateDiffExact(dateStr) {
    if (!dateStr) return 'No disponible';
    let d;
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) d = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
    } else {
      d = new Date(dateStr);
    }
    if (!d || isNaN(d.getTime())) return 'No disponible';

    const now = new Date();
    let anios = now.getUTCFullYear() - d.getUTCFullYear();
    let meses = now.getUTCMonth() - d.getUTCMonth();
    let dias = now.getUTCDate() - d.getUTCDate();

    if (dias < 0) {
      meses -= 1;
      const prevMonthDays = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).getUTCDate();
      dias += prevMonthDays;
    }
    if (meses < 0) {
      anios -= 1;
      meses += 12;
    }
    return `${Math.max(0, anios)} años, ${Math.max(0, meses)} meses, ${Math.max(0, dias)} días`;
  }

  /**
   * Cálculo de diferencia exacta entre dos fechas dadas (para periodos de experiencia)
   */
  function calcExactDiffBetween(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) return null;
    const inicio = new Date(fechaInicio + (fechaInicio.includes('T') ? '' : 'T00:00:00Z'));
    const fin = new Date(fechaFin + (fechaFin.includes('T') ? '' : 'T00:00:00Z'));
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || fin < inicio) return null;

    let anios = fin.getUTCFullYear() - inicio.getUTCFullYear();
    let meses = fin.getUTCMonth() - inicio.getUTCMonth();
    let dias = fin.getUTCDate() - inicio.getUTCDate();

    if (dias < 0) {
      meses -= 1;
      const prevMonthDays = new Date(Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth(), 0)).getUTCDate();
      dias += prevMonthDays;
    }
    if (meses < 0) {
      anios -= 1;
      meses += 12;
    }
    return {
      anios: Math.max(0, anios),
      meses: Math.max(0, meses),
      dias: Math.max(0, dias),
      texto: `${Math.max(0, anios)} años, ${Math.max(0, meses)} meses, ${Math.max(0, dias)} días`
    };
  }

  /**
   * Suma dos duraciones en formato { anios, meses, dias } o textos "X años, Y meses, Z días"
   */
  function sumExactDurations(dur1, dur2) {
    function parseD(d) {
      if (!d) return { anios: 0, meses: 0, dias: 0, tieneValor: false };
      if (typeof d === 'object' && ('anios' in d || 'meses' in d || 'dias' in d)) {
        const a = parseInt(d.anios) || 0, m = parseInt(d.meses) || 0, ds = parseInt(d.dias) || 0;
        return { anios: a, meses: m, dias: ds, tieneValor: (a > 0 || m > 0 || ds > 0) };
      }
      const str = String(d).toLowerCase();
      const aM = str.match(/(\d+)\s*(?:año|ano|a\b)/i);
      const mM = str.match(/(\d+)\s*(?:mes|m\b)/i);
      const dM = str.match(/(\d+)\s*(?:día|dia|d\b)/i);
      const a = aM ? parseInt(aM[1], 10) : 0;
      const m = mM ? parseInt(mM[1], 10) : 0;
      const ds = dM ? parseInt(dM[1], 10) : 0;
      return { anios: a, meses: m, dias: ds, tieneValor: (a > 0 || m > 0 || ds > 0) };
    }

    const d1 = parseD(dur1);
    const d2 = parseD(dur2);
    if (!d1.tieneValor && !d2.tieneValor) return null;

    let a = d1.anios + d2.anios;
    let m = d1.meses + d2.meses;
    let ds = d1.dias + d2.dias;

    if (ds >= 30) {
      m += Math.floor(ds / 30);
      ds = ds % 30;
    }
    if (m >= 12) {
      a += Math.floor(m / 12);
      m = m % 12;
    }
    return {
      anios: a,
      meses: m,
      dias: ds,
      texto: `${a} años, ${m} meses, ${ds} días`
    };
  }

  function badgeSex(s) {
    if (!s) return '—';
    const v = s.toUpperCase();
    if (v.includes('FEMEN') || v === 'F') return '<span class="badge badge--licencia">Femenino</span>';
    if (v.includes('MASCU') || v === 'M') return '<span class="badge badge--revision">Masculino</span>';
    return `<span class="badge badge--pendiente">${escHtml(s)}</span>`;
  }

  function badgeEstadoServidor(est) {
    const val = (est || 'Activo').toLowerCase();
    if (val === 'activo') return '<span class="badge badge--activo" style="background:#dcfce7; color:#15803d; border:1px solid #86efac; font-weight:600;">Activo</span>';
    if (val === 'pensionado') return '<span class="badge badge--pensionado" style="background:#e0e7ff; color:#3730a3; border:1px solid #c7d2fe; font-weight:600;">Pensionado</span>';
    return '<span class="badge badge--inactivo" style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; font-weight:600;">Inactivo</span>';
  }

  function badgeClasificacion(clasif) {
    if (!clasif || clasif === '—') return '<span class="badge" style="background:#f1f5f9; color:#64748b;">—</span>';
    const c = clasif.toUpperCase();
    if (c === 'VACANTE') {
      return '<span class="badge badge--vacante" style="font-size:11px; padding:3px 8px; background:#fef9c3; color:#854d0e; border:1px solid #fde047; font-weight:700;" title="Plaza vacante">VACANTE</span>';
    }
    if (c.includes('CARRERA')) {
      return `<span class="badge badge--carrera" style="font-size:11px; padding:3px 8px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-weight:600;" title="Carrera Administrativa • Esquema de Horarios y Modalidades"><svg style="width:12px;height:12px;vertical-align:-1px;margin-right:3px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${escHtml(clasif)}</span>`;
    }
    if (c.includes('LIBRE')) {
      return `<span class="badge badge--libre" style="font-size:11px; padding:3px 8px; background:#f5f3ff; color:#6d28d9; border:1px solid #ddd6fe; font-weight:600;" title="Libre Nombramiento y Remoción • Esquema de Horarios y Modalidades"><svg style="width:12px;height:12px;vertical-align:-1px;margin-right:3px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${escHtml(clasif)}</span>`;
    }
    if (c.includes('PROVISIONAL')) {
      return `<span class="badge badge--provisional" style="font-size:11px; padding:3px 8px; background:#fef3c7; color:#b45309; border:1px solid #fde68a; font-weight:600;" title="Provisionalidad • Esquema de Horarios y Modalidades"><svg style="width:12px;height:12px;vertical-align:-1px;margin-right:3px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${escHtml(clasif)}</span>`;
    }
    if (c.includes('TEMPORAL') || c.includes('PERIODO')) {
      return `<span class="badge badge--temporal" style="font-size:11px; padding:3px 8px; background:#fff7ed; color:#c2410c; border:1px solid #ffedd5; font-weight:600;" title="Temporal / Periodo • Esquema de Horarios y Modalidades"><svg style="width:12px;height:12px;vertical-align:-1px;margin-right:3px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${escHtml(clasif)}</span>`;
    }
    if (c.includes('TRABAJADOR')) {
      return `<span class="badge badge--trabajador" style="font-size:11px; padding:3px 8px; background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; font-weight:600;" title="Trabajador Oficial • Esquema de Horarios y Modalidades"><svg style="width:12px;height:12px;vertical-align:-1px;margin-right:3px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${escHtml(clasif)}</span>`;
    }
    return `<span class="badge" style="font-size:11px; padding:3px 8px; background:#f8fafc; color:#334155; border:1px solid #e2e8f0; font-weight:600;" title="Esquema de Horarios y Modalidades"><svg style="width:12px;height:12px;vertical-align:-1px;margin-right:3px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${escHtml(clasif)}</span>`;
  }

  async function load() {
    try {
      const res = await API.getEmployees({ q: state.q, page: state.page, limit: 25 });
      let records = res.data || [];
      // Ordenar: si no está activo, pasar al final de la lista
      records.sort((a, b) => {
        const aActivo = (a.estadoServidor || 'Activo').toLowerCase() === 'activo';
        const bActivo = (b.estadoServidor || 'Activo').toLowerCase() === 'activo';
        if (aActivo && !bActivo) return -1;
        if (!aActivo && bActivo) return 1;
        return 0;
      });
      state.data = records;
      state.total = res.total || 0;
      state.totalPages = res.totalPages || 1;
      renderTable();
      renderPagination();
    } catch (err) {
      App.showToast('Error al cargar servidores: ' + err.message, 'error');
    }
  }

  function renderTable() {
    const tbody = document.getElementById('emp-tbody');
    if (!tbody) return;
    if (!state.data.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span class="empty-state-title">No se encontraron servidores</span>
        <span class="empty-state-desc">${state.q ? `No hay resultados para "${state.q}"` : 'Aún no hay servidores registrados.'}</span>
        </div></td></tr>`;
      return;
    }

    tbody.innerHTML = state.data.map(e => {
      const itemKey = e.cedula || e.id;
      const formattedCc = formatCedulaDots(e.cedula);

      return `
      <tr>
        <td>
          <div class="user-table-cell">
            <span class="td-primary" title="${escHtml(e.nombreCompleto)}">${escHtml(e.nombreCompleto) || '—'}</span>
            ${(e.es_vacante || e.situacion === 'VACANTE' || (e.nombreCompleto && e.nombreCompleto.startsWith('PLAZA VACANTE')))
              ? `<span class="badge badge--vacante" style="font-size:10px; padding:2px 8px; background:#fef9c3; color:#854d0e; border:1px solid #fde047; font-weight:700;" title="Plaza vacante de la planta">${escHtml(e.codigoVacante || 'PLAZA VACANTE')}</span>`
              : ((e.documento_pendiente || (e.cedula && e.cedula.startsWith('PROV-')))
                ? `<span class="badge badge--pendiente font-mono" style="font-size:11px; padding:2px 6px; font-weight:700;" title="ID Temporal Secuencial">${escHtml(e.cedula)} (Provisional)</span>`
                : (e.cedula
                    ? `<span class="user-table-cc font-mono" title="Cédula de Ciudadanía">C.C. ${escHtml(formattedCc)}</span>`
                    : `<span class="badge badge--pendiente" style="font-size:10px; padding:1px 6px;">Sin Cédula</span>`
                  )
              )
            }
          </div>
        </td>
        <td title="${escHtml(e.cargoActual)}">
          <div style="font-weight:600; color:var(--text-primary);">${truncate(e.cargoActual, 28) || '—'}</div>
          <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
            ${(e.codigoActual && e.codigoActual !== 'N/A') ? `Cód. <strong>${escHtml(e.codigoActual)}</strong>` : 'Sin código'}
            ${(e.gradoActual && e.gradoActual !== 'N/A') ? ` • Grado <strong>${escHtml(e.gradoActual)}</strong>` : ''}
          </div>
        </td>
        <td style="font-size:12px;" title="Otro Tiempo Calculado: ${escHtml(e.otroTiempoCalculado || '0 años, 0 meses, 0 días')}${e.otroTiempoGobernacion ? ` • Original: ${escHtml(e.otroTiempoGobernacion)}` : ''}">
          ${(e.otroTiempoCalculado && e.otroTiempoCalculado !== '0 años, 0 meses, 0 días')
            ? `<span style="font-weight:600; color:var(--text-primary);">${escHtml(e.otroTiempoCalculado)}</span>`
            : (e.otroTiempoCalculado ? `<span style="color:var(--text-muted);">${escHtml(e.otroTiempoCalculado)}</span>` : '—')}
        </td>
        <td style="font-size:12px;" title="${escHtml(e.tiempoServicioCalculado)}">${escHtml(e.tiempoServicioCalculado || '—')}</td>
        <td style="font-size:12px; font-weight:700; color:var(--primary);" title="Tiempo Total Calculado: ${escHtml(e.tiempoTotalGobernacion || e.tiempoServicioCalculado || '—')} (${escHtml(e.tiempoServicioCalculado || '0')} + ${escHtml(e.otroTiempoCalculado || '0')})">${escHtml(e.tiempoTotalGobernacion || e.tiempoServicioCalculado || '—')}</td>
        <td>${badgeEstadoServidor(e.estadoServidor)}</td>
        <td class="td-actions">
          <div class="td-actions-wrap">
            <button class="btn-action-view" onclick="EmployeesModule.openView('${itemKey}')" title="Ver Detalles">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-action-edit" onclick="EmployeesModule.openEdit('${itemKey}')" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            ${Auth.canEdit() ? `<button class="btn-action-delete" onclick="EmployeesModule.confirmDelete('${itemKey}','${escHtml(e.nombreCompleto)}')" title="Eliminar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  function renderPagination() {
    const el = document.getElementById('emp-pagination');
    if (!el) return;
    el.innerHTML = `
      <span class="pagination-info">Mostrando ${state.data.length} de ${state.total.toLocaleString('es-CO')} servidores</span>
      <div class="pagination-btns">
        <button class="page-btn" onclick="EmployeesModule.goPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="page-btn active">${state.page}</span>
        <span style="color:var(--text-muted);font-size:var(--text-sm)">/ ${state.totalPages}</span>
        <button class="page-btn" onclick="EmployeesModule.goPage(${state.page + 1})" ${state.page >= state.totalPages ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>`;
  }

  async function openView(idOrCedula) {
    let emp = state.data.find(e => e.cedula === idOrCedula || e.id === idOrCedula);
    try {
      const full = await API.getEmployeeByCedula(idOrCedula);
      if (full) emp = full;
    } catch (_) {}

    if (!emp) return;

    const isVacante = Boolean(emp.es_vacante || emp.situacion === 'VACANTE' || (emp.nombreCompleto && emp.nombreCompleto.startsWith('PLAZA VACANTE')));
    const formattedCc = formatCedulaDots(emp.cedula);

    let content = '';

    if (isVacante) {
      content = `
        <div class="detail-modal-card" style="max-height: 75vh; overflow-y: auto; padding-right: 6px;">
          <div style="background: rgba(254, 240, 138, 0.16); border: 1px solid #fde047; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 14px;">
            <span style="font-size: 26px; line-height: 1;">🏛</span>
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom: 6px; flex-wrap: wrap;">
                <span class="badge badge--vacante" style="font-size: 13px; font-weight: 700; padding: 4px 12px; background: #fef9c3; color: #854d0e; border: 1px solid #fde047;">
                  ${escHtml(emp.codigoVacante || 'PLAZA VACANTE')}
                </span>
                <span style="font-weight: 700; color: #854d0e; font-size: 14px;">Plaza Vacante de la Planta de Personal</span>
              </div>
              <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
                Esta plaza no cuenta con titular asignado. Únicamente se gestionan la dependencia y las especificaciones del cargo.
              </div>
            </div>
          </div>

          <div class="detail-section-title" style="font-weight: 700; color: var(--color-gold); margin-bottom: 12px; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid var(--color-border); padding-bottom: 6px;">
            🏛 Ubicación Organizacional y Especificaciones del Cargo
          </div>
          <div class="detail-grid" style="margin-bottom: 20px;">
            <div class="detail-item detail-grid--full">
              <span class="detail-label">Dependencia</span>
              <span class="detail-value" style="font-weight: 600;">${escHtml(emp.dependencia || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Cargo Actual / Denominación de la Plaza</span>
              <span class="detail-value" style="font-weight: 600; color: var(--color-gold);">${escHtml(emp.cargoActual || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Código del Cargo</span>
              <span class="detail-value font-mono">${escHtml(emp.codigoActual || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Grado</span>
              <span class="detail-value font-mono">${escHtml(emp.gradoActual || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Asignación Básica Salarial</span>
              <span class="detail-value font-mono" style="color: var(--color-green-bright); font-weight:600;">${escHtml(emp.asignacion || '—')}</span>
            </div>
          </div>
        </div>
      `;
    } else {
      content = `
        <div class="detail-modal-card" style="max-height: 75vh; overflow-y: auto; padding-right: 6px;">
          <!-- 1. Identificación y Datos Personales -->
          <div class="detail-section-title" style="font-weight: 700; color: var(--color-gold); margin-bottom: 12px; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid var(--color-border); padding-bottom: 6px;">
            👤 Datos Personales y Documentos
          </div>
          <div class="detail-grid" style="margin-bottom: 20px;">
            <div class="detail-item detail-grid--full">
              <span class="detail-label">Nombres y Apellidos</span>
              <span class="detail-value" style="font-size: 16px; font-weight: 700;">${escHtml(emp.nombreCompleto || '—')}</span>
              <span style="font-size:12px; color:var(--text-muted); display:block; margin-top:2px;">
                Apellidos: <strong>${escHtml(emp.apellidos || emp.primerApellido || '—')}</strong> | Nombres: <strong>${escHtml(emp.nombres || '—')}</strong>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Cédula de Ciudadanía</span>
              ${(emp.documento_pendiente || (emp.cedula && emp.cedula.startsWith('PROV-')))
                ? `<span class="badge badge--pendiente font-mono" style="font-size:12px; font-weight:700; padding:4px 8px;">${escHtml(emp.cedula)} (ID Temporal Secuencial)</span>`
                : (emp.cedula
                    ? `<span class="detail-value font-mono" style="font-weight: 700; font-size:15px;">${escHtml(formattedCc)}</span>`
                    : `<span class="detail-value" style="color:var(--text-muted);">Sin Cédula Registrada</span>`
                  )
              }
            </div>
            <div class="detail-item">
              <span class="detail-label">Municipio de Expedición</span>
              <span class="detail-value">${escHtml(emp.municipioExpedicion || emp.ciudadExpedicion || emp.expedida || 'TUNJA')}, ${escHtml(emp.departamentoExpedicion || 'BOYACÁ')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Sexo</span>
              <span class="detail-value">${escHtml(emp.sexo || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Tipo de Sangre</span>
              <span class="detail-value font-mono" style="font-weight:700; color:var(--color-gold);">${escHtml(emp.tipoSangre || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Fecha de Nacimiento</span>
              <span class="detail-value">${escHtml(emp.fechaNacimiento || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Edad (Cálculo Dinámico)</span>
              <span class="detail-value" style="color: var(--color-green-bright); font-weight: 700;">${escHtml(emp.edadCalculada || '—')}</span>
            </div>
          </div>

          <!-- 2. Ubicación, Cargos y Estado -->
          <div class="detail-section-title" style="font-weight: 700; color: var(--color-gold); margin-bottom: 12px; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid var(--color-border); padding-bottom: 6px;">
            🏛 Ubicación, Cargos y Estado
          </div>
          <div class="detail-grid" style="margin-bottom: 20px;">
            <div class="detail-item detail-grid--full">
              <span class="detail-label">Dependencia</span>
              <span class="detail-value" style="font-weight: 600;">${escHtml(emp.dependencia || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Denominación de Cargo</span>
              <span class="detail-value" style="font-weight: 700; color: var(--color-gold);">${escHtml(emp.cargoActual || emp.cargoBase || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Código del Cargo</span>
              <span class="detail-value font-mono">${escHtml(emp.codigoActual || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Grado</span>
              <span class="detail-value font-mono">${escHtml(emp.gradoActual || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Clasificación del Empleo</span>
              <span class="detail-value">${escHtml(emp.clasificacionEmpleo || 'CARRERA ADMINISTRATIVA')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Estado del Servidor</span>
              <span class="detail-value">${badgeEstadoServidor(emp.estadoServidor)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">OPEC</span>
              <span class="detail-value font-mono">${escHtml(emp.opec || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Situación Administrativa</span>
              <span class="detail-value">${escHtml(emp.situacion || 'ACTIVO')}</span>
            </div>
            ${emp.tipoDiscapacidad ? `
              <div class="detail-item">
                <span class="detail-label">Discapacidad</span>
                <span class="detail-value badge badge--revision" style="text-transform: capitalize;">${escHtml(emp.tipoDiscapacidad)}</span>
              </div>
            ` : ''}
          </div>

          <!-- 3. Fechas y Cálculos Dinámicos -->
          <div class="detail-section-title" style="font-weight: 700; color: var(--color-gold); margin-bottom: 12px; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid var(--color-border); padding-bottom: 6px;">
            📅 Fechas y Tiempos de Servicio
          </div>
          <div class="detail-grid" style="margin-bottom: 20px;">
            <div class="detail-item">
              <span class="detail-label">Fecha de Ingreso</span>
              <span class="detail-value">${escHtml(emp.fechaIngreso || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Tiempo de Servicio (Cálculo Dinámico)</span>
              <span class="detail-value" style="color: var(--color-green-bright); font-weight: 700;">${escHtml(emp.tiempoServicioCalculado || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Fecha de Encargo</span>
              <span class="detail-value">${escHtml(emp.fechaEncargo || '—')}</span>
            </div>
            <div class="detail-item detail-grid--full">
              <span class="detail-label">Otro Tiempo con la Gobernación (Experiencia Múltiple)</span>
              ${(Array.isArray(emp.otroTiempoPeriodos) && emp.otroTiempoPeriodos.length) ? `
                <div style="margin-top: 6px; border: 1px solid var(--color-border); border-radius: 6px; overflow: hidden;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                      <tr style="background: var(--color-bg-secondary); border-bottom: 1px solid var(--color-border); text-align: left;">
                        <th style="padding: 6px 10px;">#</th>
                        <th style="padding: 6px 10px;">Desde</th>
                        <th style="padding: 6px 10px;">Hasta</th>
                        <th style="padding: 6px 10px;">Duración Periodo</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${emp.otroTiempoPeriodos.map((p, idx) => `
                        <tr style="border-bottom: 1px solid var(--color-border);">
                          <td style="padding: 6px 10px; color: var(--text-muted);">${idx + 1}</td>
                          <td style="padding: 6px 10px; font-weight: 600;">${escHtml(p.desde)}</td>
                          <td style="padding: 6px 10px; font-weight: 600;">${escHtml(p.hasta)}</td>
                          <td style="padding: 6px 10px; color: var(--color-green-bright); font-weight: 600;">${escHtml(p.duracionTexto || '—')}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                    <tfoot>
                      <tr style="background: rgba(34, 197, 94, 0.08); font-weight: 700;">
                        <td colspan="3" style="padding: 8px 10px; text-align: right; color: var(--text-primary);">Total Acumulado:</td>
                        <td style="padding: 8px 10px; color: var(--color-green-bright); font-weight: 700;">${escHtml(emp.otroTiempoGobernacion || '—')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ` : `
                <div style="font-size:14px; font-weight:700; color:var(--color-green-bright);">
                  ${escHtml(emp.otroTiempoCalculado && emp.otroTiempoCalculado !== '0 años, 0 meses, 0 días' ? emp.otroTiempoCalculado : (emp.otroTiempoGobernacion || 'No registra experiencia histórica'))}
                </div>
                ${(emp.otroTiempoCalculado && emp.otroTiempoGobernacion && emp.otroTiempoGobernacion !== emp.otroTiempoCalculado && emp.otroTiempoGobernacion !== 'NO REGISTRADO') ? `
                  <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Registro histórico / Fechas: <strong>${escHtml(emp.otroTiempoGobernacion)}</strong></div>
                ` : ''}
              `}
            </div>
            <div class="detail-item detail-grid--full" style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 8px; padding: 12px; margin-top: 8px;">
              <span class="detail-label" style="color: #2563eb; font-weight: 700; font-size: 13px;">🏆 Tiempo Total en la Gobernación (Suma de Tiempos Calculados)</span>
              <span class="detail-value" style="font-size: 15px; font-weight: 800; color: #1d4ed8; margin-top: 4px; display: block;">
                ${escHtml(emp.tiempoTotalGobernacion || emp.tiempoServicioCalculado || '—')}
              </span>
              <span style="font-size:12px; color:#2563eb; display:block; margin-top:3px;">
                Servicio: <strong>${escHtml(emp.tiempoServicioCalculado || '0')}</strong> + Otro Tiempo: <strong>${escHtml(emp.otroTiempoCalculado || '0')}</strong>
              </span>
            </div>
          </div>

          <!-- 4. Formación, Novedades y Contacto -->
          <div class="detail-section-title" style="font-weight: 700; color: var(--color-gold); margin-bottom: 12px; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid var(--color-border); padding-bottom: 6px;">
            🎓 Formación, Novedades y Contacto
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Funciones</span>
              <span class="detail-value">${escHtml(emp.funciones || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Novedades</span>
              <span class="detail-value">${escHtml(emp.novedades || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Estudios</span>
              <span class="detail-value">${escHtml(emp.estudios || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Institución de Estudios</span>
              <span class="detail-value">${escHtml(emp.institucionEstudios || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Matrícula Profesional</span>
              <span class="detail-value font-mono">${escHtml(emp.matriculaProfesional || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Diplomado / Cap. SENA</span>
              <span class="detail-value">${emp.tieneDiplomado ? `Sí — ${escHtml(emp.diplomadoCapSena || 'Certificado')}` : 'No registra'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Teléfono Fijo</span>
              <span class="detail-value font-mono">${escHtml(emp.telefonoFijo || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Celulares Registrados</span>
              <span class="detail-value font-mono">
                ${(Array.isArray(emp.celulares) && emp.celulares.length)
                  ? emp.celulares.map(c => `<span class="badge badge--info font-mono" style="margin-right:4px;">${escHtml(c)}</span>`).join('')
                  : (emp.celular ? escHtml(emp.celular) : '—')}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Correo Institucional</span>
              <span class="detail-value font-mono">${escHtml(emp.correo || '—')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Correo Personal</span>
              <span class="detail-value font-mono">${escHtml(emp.correoPersonal || '—')}</span>
            </div>
            <div class="detail-item detail-grid--full">
              <span class="detail-label">Dirección y Residencia</span>
              <span class="detail-value">${escHtml(emp.direccion || '—')}, ${escHtml(emp.ciudad || '—')}</span>
            </div>
          </div>
        </div>
      `;
    }

    const actions = [
      { text: 'Cerrar', cls: 'btn-secondary', action: () => App.closeModal() },
    ];
    if (Auth.canEdit()) {
      actions.push({
        text: isVacante ? 'Editar Plaza' : 'Editar Servidor',
        cls: 'btn-gold',
        action: () => {
          App.closeModal();
          openEdit(idOrCedula);
        }
      });
    }
    App.openModal(isVacante ? 'Ficha de Plaza Vacante' : 'Ficha Integral del Servidor Público', content, actions);
  }

  async function openCreate() {
    await loadCatalogs();
    App.openModal('Nuevo Servidor Público', buildForm(), [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
      { text: 'Guardar Servidor', cls: 'btn-primary', id: 'emp-save-btn', action: saveCreate },
    ]);
    attachFormListeners();
  }

  async function openEdit(idOrCedula) {
    let emp = state.data.find(e => e.cedula === idOrCedula || e.id === idOrCedula);
    try {
      const full = await API.getEmployeeByCedula(idOrCedula);
      if (full) emp = full;
    } catch (_) {}

    if (!emp) return;
    await loadCatalogs();
    App.openModal('Editar Servidor Público', buildForm(emp), [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
      { text: 'Actualizar Servidor', cls: 'btn-gold', id: 'emp-save-btn', action: () => saveEdit(idOrCedula) },
    ]);
    attachFormListeners(emp);
  }

  function buildForm(emp = {}) {
    const isVacante = Boolean(emp.es_vacante || emp.situacion === 'VACANTE' || (emp.nombreCompleto && emp.nombreCompleto.startsWith('PLAZA VACANTE')));
    const cats = state.catalogs;

    if (isVacante) {
      return `
        <div style="background: rgba(254, 240, 138, 0.16); border: 1px solid #fde047; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
          <div style="font-weight: 700; color: #854d0e; font-size: 13px; margin-bottom: 4px;">🏛 Plaza Vacante — Planta de Personal</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Para las plazas vacantes, solo se definen la dependencia y el cargo correspondiente.</div>
        </div>
        <div class="form-grid">
          <div class="form-group span-2">
            <label class="form-label">Denominación de la Plaza *</label>
            <input id="ef-nombre" class="form-input" value="${escHtml(emp.nombreCompleto || 'PLAZA VACANTE')}" required />
          </div>
          <input type="hidden" id="ef-cedula" value="" />
          <div class="form-group span-2">
            <label class="form-label">Dependencia *</label>
            <select id="ef-dep" class="filter-select">
              <option value="">Seleccionar Dependencia...</option>
              ${cats.dependencias.map(d => `<option value="${escHtml(d)}" ${d === emp.dependencia ? 'selected' : ''}>${escHtml(d)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group span-2">
            <label class="form-label">Cargo *</label>
            <select id="ef-cargo" class="filter-select">
              <option value="${escHtml(emp.cargoActual || '')}">${escHtml(emp.cargoActual || 'Seleccionar Cargo...')}</option>
            </select>
          </div>
        </div>`;
    }

    // Celulares existentes
    const celularesList = (Array.isArray(emp.celulares) && emp.celulares.length)
      ? emp.celulares
      : (emp.celular ? [emp.celular] : ['']);

    // Periodos de experiencia previa en la Gobernación
    const periodosList = (Array.isArray(emp.otroTiempoPeriodos) && emp.otroTiempoPeriodos.length)
      ? emp.otroTiempoPeriodos
      : [];

    return `
      <div style="max-height: 72vh; overflow-y: auto; padding-right: 6px;">

        <!-- SECCIÓN 1: DATOS PERSONALES Y DOCUMENTOS -->
        <div style="margin-bottom: 20px;">
          <div style="font-weight: 700; font-size: 13px; color: var(--color-gold); text-transform: uppercase; border-bottom: 1px solid var(--color-border); padding-bottom: 6px; margin-bottom: 14px; display:flex; align-items:center; gap:6px;">
            <span>👤</span> 1. Datos Personales y Documentos
          </div>
          <div class="form-grid">
            <div class="form-group span-2">
              <label class="form-label" for="ef-nombre">Nombres y Apellidos * <span style="font-size:11px; color:var(--text-muted);">(Solo admite letras y espacios)</span></label>
              <input id="ef-nombre" class="form-input" placeholder="Ej: PEREZ RODRIGUEZ JUAN CARLOS" value="${escHtml(emp.nombreCompleto || '')}" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-cedula">Cédula de Ciudadanía * <span style="font-size:11px; color:var(--text-muted);">(Solo números)</span></label>
              <input id="ef-cedula" class="form-input font-mono" placeholder="Ej: 1049603050" value="${escHtml(emp.cedula || '')}" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-sexo">Sexo <span style="font-size:11px; color:var(--text-muted);">(Opcional)</span></label>
              <select id="ef-sexo" class="filter-select">
                <option value="">(Sin especificar / Vacío)</option>
                ${cats.sexos.map(s => `<option value="${escHtml(s)}" ${emp.sexo && emp.sexo.toUpperCase().includes(s.substring(0,3).toUpperCase()) ? 'selected' : ''}>${escHtml(s)}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-depto-exp">Depto. de Expedición Cédula</label>
              <select id="ef-depto-exp" class="filter-select">
                <option value="">Seleccionar Departamento...</option>
                ${cats.divipola.departamentos.map(dep => `<option value="${escHtml(dep)}" ${(emp.departamentoExpedicion || 'BOYACÁ') === dep ? 'selected' : ''}>${escHtml(dep)}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-municipio-exp">Municipio de Expedición Cédula</label>
              <select id="ef-municipio-exp" class="filter-select">
                <option value="${escHtml(emp.municipioExpedicion || emp.ciudadExpedicion || '')}">${escHtml(emp.municipioExpedicion || emp.ciudadExpedicion || '(Sin seleccionar / Vacío)')}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-tipo-sangre">Tipo de Sangre <span style="font-size:11px; color:var(--text-muted);">(Opcional)</span></label>
              <select id="ef-tipo-sangre" class="filter-select">
                <option value="">(Sin especificar / Vacío)</option>
                ${['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(ts => `<option value="${ts}" ${(emp.tipoSangre || '').toUpperCase() === ts ? 'selected' : ''}>${ts}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-fecha-nac">Fecha de Nacimiento</label>
              <input id="ef-fecha-nac" type="date" class="form-input" value="${escHtml(emp.fechaNacimiento || '')}" />
              <div id="ef-edad-calc-display" style="font-size:12px; color:var(--color-green-bright); font-weight:600; margin-top:4px;">
                ${emp.edadCalculada ? `Edad: ${escHtml(emp.edadCalculada)}` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 2: UBICACIÓN, CARGOS Y ESTADO -->
        <div style="margin-bottom: 20px;">
          <div style="font-weight: 700; font-size: 13px; color: var(--color-gold); text-transform: uppercase; border-bottom: 1px solid var(--color-border); padding-bottom: 6px; margin-bottom: 14px; display:flex; align-items:center; gap:6px;">
            <span>🏛</span> 2. Ubicación, Cargos y Estado
          </div>
          <div class="form-grid">
            <div class="form-group span-2">
              <label class="form-label" for="ef-dep">Dependencia <span style="font-size:11px; color:var(--text-muted);">(Opcional)</span></label>
              <select id="ef-dep" class="filter-select">
                <option value="">(Sin seleccionar / Vacío)</option>
                ${cats.dependencias.map(d => `<option value="${escHtml(d)}" ${d === emp.dependencia ? 'selected' : ''}>${escHtml(d)}</option>`).join('')}
              </select>
            </div>

            <div class="form-group span-2">
              <label class="form-label" for="ef-cargo">Denominación del Cargo <span style="font-size:11px; color:var(--text-muted);">(Opcional, carga dinámica según dependencia)</span></label>
              <select id="ef-cargo" class="filter-select">
                <option value="${escHtml(emp.cargoActual || '')}">${escHtml(emp.cargoActual || '(Sin seleccionar / Vacío)')}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-codigo-cargo">Código de Cargo <span style="font-size:11px; color:var(--text-muted);">(Opcional, números ≤ 1000)</span></label>
              <input id="ef-codigo-cargo" class="form-input font-mono" placeholder="Ej: 219 (Opcional)" value="${escHtml(emp.codigoActual || '')}" />
              <small id="ef-codigo-hint" style="font-size:11px; color:var(--text-muted);">Solo números entre 0 y 1000 (puede quedar vacío).</small>
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-grado">Grado <span style="font-size:11px; color:var(--text-muted);">(Opcional)</span></label>
              <select id="ef-grado" class="filter-select">
                <option value="">(Sin Grado / Vacío)</option>
                ${cats.grados.map(g => `<option value="${escHtml(g)}" ${String(emp.gradoActual || '').toLowerCase() === String(g).toLowerCase() ? 'selected' : ''}>${escHtml(g)}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-clasificacion">Clasificación de Empleo</label>
              <select id="ef-clasificacion" class="filter-select">
                ${cats.clasificaciones.map(c => `<option value="${escHtml(c)}" ${c === emp.clasificacionEmpleo ? 'selected' : ''}>${escHtml(c)}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-estado-servidor">Estado del Servidor</label>
              <select id="ef-estado-servidor" class="filter-select">
                ${cats.estadosServidor.map(es => `<option value="${escHtml(es)}" ${es.toLowerCase() === (emp.estadoServidor || 'Activo').toLowerCase() ? 'selected' : ''}>${escHtml(es)}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-opec">OPEC <span style="font-size:11px; color:var(--text-muted);">(Texto o número)</span></label>
              <input id="ef-opec" class="form-input font-mono" placeholder="Número u OPEC" value="${escHtml(emp.opec || '')}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-situacion">Situación Administrativa</label>
              <select id="ef-situacion" class="filter-select">
                <option value="ACTIVO" ${emp.situacion === 'ACTIVO' ? 'selected' : ''}>ACTIVO</option>
                <option value="ENCARGO" ${emp.situacion === 'ENCARGO' ? 'selected' : ''}>ENCARGO</option>
                <option value="COMISIÓN" ${emp.situacion === 'COMISIÓN' ? 'selected' : ''}>COMISIÓN</option>
                <option value="LICENCIA" ${emp.situacion === 'LICENCIA' ? 'selected' : ''}>LICENCIA</option>
                <option value="VACACIONES" ${emp.situacion === 'VACACIONES' ? 'selected' : ''}>VACACIONES</option>
                <option value="DISCAPACIDAD" ${emp.situacion === 'DISCAPACIDAD' ? 'selected' : ''}>DISCAPACIDAD</option>
                <option value="RETIRADO" ${emp.situacion === 'RETIRADO' ? 'selected' : ''}>RETIRADO</option>
              </select>
            </div>

            <!-- Regla 12: Campo condicional de Discapacidad -->
            <div class="form-group span-2" id="ef-discapacidad-group" style="${emp.situacion === 'DISCAPACIDAD' ? '' : 'display:none;'}">
              <label class="form-label" for="ef-tipo-discapacidad" style="color:var(--color-gold); font-weight:700;">Tipo de Discapacidad <span style="font-size:11px; color:var(--text-muted);">(Opcional)</span></label>
              <select id="ef-tipo-discapacidad" class="filter-select">
                <option value="">(Sin especificar / Vacío)</option>
                ${cats.discapacidades.map(d => `<option value="${escHtml(d)}" ${emp.tipoDiscapacidad === d ? 'selected' : ''}>${escHtml(d)}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 3: FECHAS Y CÁLCULOS DINÁMICOS -->
        <div style="margin-bottom: 20px;">
          <div style="font-weight: 700; font-size: 13px; color: var(--color-gold); text-transform: uppercase; border-bottom: 1px solid var(--color-border); padding-bottom: 6px; margin-bottom: 14px; display:flex; align-items:center; gap:6px;">
            <span>📅</span> 3. Fechas y Tiempos de Servicio
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="ef-fecha-ingreso">Fecha de Ingreso</label>
              <input id="ef-fecha-ingreso" type="date" class="form-input" value="${escHtml(emp.fechaIngreso || '')}" />
              <div id="ef-tiempo-calc-display" style="font-size:12px; color:var(--color-green-bright); font-weight:600; margin-top:4px;">
                ${emp.tiempoServicioCalculado ? `Tiempo: ${escHtml(emp.tiempoServicioCalculado)}` : ''}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-fecha-encargo">Fecha de Encargo</label>
              <input id="ef-fecha-encargo" type="date" class="form-input" value="${escHtml(emp.fechaEncargo || '')}" />
            </div>

            <div class="form-group span-2">
              <label class="form-label">Otro Tiempo con la Gobernación (Experiencia Múltiple) <span style="font-size:11px; color:var(--text-muted);">(Opcional, agregue periodos con fecha desde y hasta)</span></label>
              <div id="ef-periodos-container" style="display:flex; flex-direction:column; gap:8px;">
                ${periodosList.map((p, idx) => `
                  <div class="periodo-row" style="display:grid; grid-template-columns: 1fr 1fr 1.2fr auto; gap:8px; align-items:center; background:var(--color-bg-secondary); padding:8px 12px; border-radius:6px; border:1px solid var(--color-border);">
                    <div>
                      <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:2px;">Desde *</label>
                      <input type="date" class="form-input ef-periodo-desde" value="${escHtml(p.desde || '')}" required />
                    </div>
                    <div>
                      <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:2px;">Hasta *</label>
                      <input type="date" class="form-input ef-periodo-hasta" value="${escHtml(p.hasta || '')}" required />
                    </div>
                    <div style="font-size:12px; color:var(--color-green-bright); font-weight:600; padding-top:14px;" class="ef-periodo-duracion">
                      ${escHtml(p.duracionTexto || '')}
                    </div>
                    <div style="padding-top:14px;">
                      <button type="button" class="btn btn-secondary btn-sm btn-del-periodo" style="padding:4px 8px; color:#ef4444;" title="Eliminar periodo">🗑️</button>
                    </div>
                  </div>
                `).join('')}
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-add-periodo" style="font-size:11px;">+ Agregar Periodo Histórico</button>
                <div id="ef-periodos-total-display" style="font-size:12px; font-weight:700; color:var(--color-green-bright);"></div>
              </div>
              <div id="ef-tiempo-total-display" style="display:none; font-size:12px; font-weight:700; color:#1d4ed8; margin-top:6px; padding:6px 10px; background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); border-radius:6px;"></div>
              ${(emp.otroTiempoGobernacion && (!periodosList || periodosList.length === 0)) ? `
                <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">
                  Nota histórica anterior: <em>${escHtml(emp.otroTiempoGobernacion)}</em>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- SECCIÓN 4: FORMACIÓN, NOVEDADES Y CONTACTO -->
        <div style="margin-bottom: 20px;">
          <div style="font-weight: 700; font-size: 13px; color: var(--color-gold); text-transform: uppercase; border-bottom: 1px solid var(--color-border); padding-bottom: 6px; margin-bottom: 14px; display:flex; align-items:center; gap:6px;">
            <span>🎓</span> 4. Formación, Novedades y Contacto
          </div>
          <div class="form-grid">
            <div class="form-group span-2">
              <label class="form-label" for="ef-funciones">Funciones <span style="font-size:11px; color:var(--text-muted);">(00 a 999 o texto explicativo / decreto)</span></label>
              <input id="ef-funciones" class="form-input" placeholder="Ej: 01 o DECRETO 145 DE 2024" value="${escHtml(emp.funciones || '')}" />
            </div>

            <div class="form-group span-2">
              <label class="form-label" for="ef-novedades">Novedades <span style="font-size:11px; color:var(--text-muted);">(Texto libre)</span></label>
              <input id="ef-novedades" class="form-input" placeholder="Novedades del servidor" value="${escHtml(emp.novedades || '')}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-estudios">Estudios (Pregrado)</label>
              <input id="ef-estudios" class="form-input" placeholder="Carrera o Título" value="${escHtml(emp.estudios || '')}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-inst-estudios">Institución de Estudios</label>
              <input id="ef-inst-estudios" class="form-input" placeholder="Universidad / Institución" value="${escHtml(emp.institucionEstudios || '')}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-matricula">Matrícula Profesional <span style="font-size:11px; color:var(--text-muted);">(Solo números)</span></label>
              <input id="ef-matricula" class="form-input font-mono" placeholder="Solo dígitos" value="${escHtml(emp.matriculaProfesional || '')}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-diplomado-toggle">Diplomado / Cap. SENA</label>
              <select id="ef-diplomado-toggle" class="filter-select">
                <option value="NO" ${emp.tieneDiplomado ? '' : 'selected'}>No tiene</option>
                <option value="SI" ${emp.tieneDiplomado ? 'selected' : ''}>Sí tiene</option>
              </select>
            </div>

            <!-- Regla 19: Desplegable de diplomados condicional -->
            <div class="form-group span-2" id="ef-diplomado-group" style="${emp.tieneDiplomado ? '' : 'display:none;'}">
              <label class="form-label" for="ef-diplomado-opt">Opciones de Diplomado / Capacitación</label>
              <select id="ef-diplomado-opt" class="filter-select">
                <option value="">Seleccionar Diplomado...</option>
                ${cats.diplomados.map(dip => `<option value="${escHtml(dip)}" ${emp.diplomadoCapSena === dip ? 'selected' : ''}>${escHtml(dip)}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-telefono-fijo">Teléfono Fijo <span style="font-size:11px; color:var(--text-muted);">(6 a 12 dígitos)</span></label>
              <input id="ef-telefono-fijo" class="form-input font-mono" placeholder="Ej: 7401234" value="${escHtml(emp.telefonoFijo || '')}" />
            </div>

            <div class="form-group span-2">
              <label class="form-label">Teléfonos Celulares <span style="font-size:11px; color:var(--text-muted);">(Hasta 3 números, 9-10 dígitos c/u)</span></label>
              <div id="ef-celulares-container" style="display:flex; flex-direction:column; gap:8px;">
                ${celularesList.map((cel, idx) => `
                  <div class="celular-row" style="display:flex; align-items:center; gap:8px;">
                    <input class="form-input ef-celular-input font-mono" placeholder="Celular ${idx+1} (9 o 10 dígitos)" value="${escHtml(cel)}" maxlength="10" />
                    ${idx > 0 ? `<button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()" style="padding:4px 8px;">✕</button>` : ''}
                  </div>
                `).join('')}
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-add-celular" style="margin-top:6px; font-size:11px;">+ Agregar otro celular</button>
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-correo-inst">Correo Institucional <span style="font-size:11px; color:var(--text-muted);">(Opcional, exige @ si se ingresa)</span></label>
              <input id="ef-correo-inst" type="email" class="form-input font-mono" placeholder="usuario@boyaca.gov.co" value="${escHtml(emp.correo || '')}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="ef-correo-pers">Correo Personal <span style="font-size:11px; color:var(--text-muted);">(Exige @)</span></label>
              <input id="ef-correo-pers" type="email" class="form-input font-mono" placeholder="usuario@gmail.com" value="${escHtml(emp.correoPersonal || '')}" />
            </div>

            <div class="form-group span-2">
              <label class="form-label" for="ef-direccion">Dirección de Residencia</label>
              <input id="ef-direccion" class="form-input" placeholder="Dirección completa" value="${escHtml(emp.direccion || '')}" />
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Conecta los listeners y comportamientos dinámicos e interactivos en el formulario
   */
  function attachFormListeners(emp = {}) {
    const cats = state.catalogs;

    // 1. Regla 7: Restricción en Nombres y Apellidos (Solo letras y espacios)
    const nombreInput = document.getElementById('ef-nombre');
    if (nombreInput) {
      nombreInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
      });
    }

    // 2. Regla 8: Restricción en Cédula (Solo números)
    const cedulaInput = document.getElementById('ef-cedula');
    if (cedulaInput) {
      cedulaInput.addEventListener('input', (e) => {
        // Permitir prefijo PROV si ya lo tenía
        if (e.target.value.startsWith('PROV-')) return;
        e.target.value = e.target.value.replace(/[^\d]/g, '');
      });
    }

    // 3. Regla 1: Dependencia y Cargo (Carga dinámica de cargos por dependencia)
    const depSelect = document.getElementById('ef-dep');
    const cargoSelect = document.getElementById('ef-cargo');
    const codigoInput = document.getElementById('ef-codigo-cargo');
    const gradoSelect = document.getElementById('ef-grado');

    const updateCargosForDep = (selectedDep, currentCargo = '') => {
      if (!cargoSelect) return;
      const cleanDep = (selectedDep || '').trim().toUpperCase();
      const availableCargos = cats.cargosPorDependencia[cleanDep] || cats.cargos || [];

      cargoSelect.innerHTML = '<option value="">Seleccionar Cargo...</option>' +
        availableCargos.map(c => `<option value="${escHtml(c.cargo)}" data-codigo="${escHtml(c.codigo || '')}" data-grado="${escHtml(c.grado || '')}" ${c.cargo === currentCargo ? 'selected' : ''}>${escHtml(c.cargo)}</option>`).join('');

      // Si el cargo actual no estaba en la lista de esa dependencia, agregarlo como opción
      if (currentCargo && !availableCargos.some(c => c.cargo === currentCargo)) {
        const opt = document.createElement('option');
        opt.value = currentCargo;
        opt.textContent = currentCargo;
        opt.selected = true;
        cargoSelect.appendChild(opt);
      }
    };

    if (depSelect) {
      depSelect.addEventListener('change', (e) => {
        updateCargosForDep(e.target.value);
      });
      if (emp.dependencia) {
        updateCargosForDep(emp.dependencia, emp.cargoActual || '');
      }
    }

    // 4. Regla 2: Al seleccionar el cargo, el código se autorrellena (validando números y <= 1000)
    if (cargoSelect) {
      cargoSelect.addEventListener('change', (e) => {
        const selOpt = cargoSelect.selectedOptions[0];
        if (selOpt && codigoInput) {
          const defaultCode = selOpt.getAttribute('data-codigo');
          if (defaultCode && /^\d+$/.test(defaultCode) && parseInt(defaultCode, 10) <= 1000) {
            codigoInput.value = defaultCode;
          }
          const defaultGrado = selOpt.getAttribute('data-grado');
          if (defaultGrado && gradoSelect) {
            const match = cats.grados.find(g => g.toLowerCase() === defaultGrado.toLowerCase());
            if (match) gradoSelect.value = match;
          }
        }
      });
    }

    if (codigoInput) {
      codigoInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^\d]/g, '');
        if (e.target.value && parseInt(e.target.value, 10) > 1000) {
          const hint = document.getElementById('ef-codigo-hint');
          if (hint) { hint.style.color = '#ef4444'; hint.textContent = '¡Atención! El código no puede superar el número 1000.'; }
        } else {
          const hint = document.getElementById('ef-codigo-hint');
          if (hint) { hint.style.color = 'var(--text-muted)'; hint.textContent = 'Solo números entre 0 y 1000.'; }
        }
      });
    }

    // 5. Regla 10: Expedición de Cédula (Departamento -> Municipio dinámico vía DIVIPOLA)
    const deptoExpSelect = document.getElementById('ef-depto-exp');
    const mpioExpSelect = document.getElementById('ef-municipio-exp') || document.getElementById('ef-ciudad-exp');

    const updateMunicipiosForDepto = (selectedDepto, currentMpio = '') => {
      if (!mpioExpSelect) return;
      const cleanDepto = (selectedDepto || '').trim().toUpperCase();
      const mpios = cats.divipola.municipiosPorDepto[cleanDepto] || [];
      mpioExpSelect.innerHTML = '<option value="">Seleccionar Municipio...</option>' +
        mpios.map(c => `<option value="${escHtml(c)}" ${c === currentMpio ? 'selected' : ''}>${escHtml(c)}</option>`).join('');

      if (currentMpio && !mpios.includes(currentMpio)) {
        const opt = document.createElement('option');
        opt.value = currentMpio;
        opt.textContent = currentMpio;
        opt.selected = true;
        mpioExpSelect.appendChild(opt);
      }
    };

    if (deptoExpSelect) {
      deptoExpSelect.addEventListener('change', (e) => {
        updateMunicipiosForDepto(e.target.value);
      });
      const initDepto = emp.departamentoExpedicion || 'BOYACÁ';
      updateMunicipiosForDepto(initDepto, emp.municipioExpedicion || emp.ciudadExpedicion || 'TUNJA');
    }

    // 6. Regla 12: Situación y Discapacidad
    const situacionSelect = document.getElementById('ef-situacion');
    const discGroup = document.getElementById('ef-discapacidad-group');
    if (situacionSelect && discGroup) {
      situacionSelect.addEventListener('change', (e) => {
        if (e.target.value === 'DISCAPACIDAD') {
          discGroup.style.display = 'block';
        } else {
          discGroup.style.display = 'none';
        }
      });
    }

    // 7. Regla 19: Diplomado / Capacitación SENA
    const diplomadoToggle = document.getElementById('ef-diplomado-toggle');
    const diplomadoGroup = document.getElementById('ef-diplomado-group');
    if (diplomadoToggle && diplomadoGroup) {
      diplomadoToggle.addEventListener('change', (e) => {
        diplomadoGroup.style.display = e.target.value === 'SI' ? 'block' : 'none';
      });
    }

    // 8. Reglas 13 y 14: Cálculo en tiempo real de Edad y Tiempo de Servicio
    const fechaNacInput = document.getElementById('ef-fecha-nac');
    const edadDisplay = document.getElementById('ef-edad-calc-display');
    if (fechaNacInput && edadDisplay) {
      fechaNacInput.addEventListener('change', (e) => {
        edadDisplay.textContent = e.target.value ? `Edad: ${calcDateDiffExact(e.target.value)}` : '';
      });
    }

    const fechaIngInput = document.getElementById('ef-fecha-ingreso');
    const tiempoDisplay = document.getElementById('ef-tiempo-calc-display');
    if (fechaIngInput && tiempoDisplay) {
      fechaIngInput.addEventListener('change', (e) => {
        tiempoDisplay.textContent = e.target.value ? `Tiempo de Servicio: ${calcDateDiffExact(e.target.value)}` : '';
      });
    }

    // Manejo dinámico de Otro Tiempo con la Gobernación (Experiencia Múltiple)
    const periodosContainer = document.getElementById('ef-periodos-container');
    const btnAddPeriodo = document.getElementById('btn-add-periodo');
    const periodosTotalDisplay = document.getElementById('ef-periodos-total-display');

    const updatePeriodosTotal = () => {
      if (!periodosContainer || !periodosTotalDisplay) return;
      const rows = periodosContainer.querySelectorAll('.periodo-row');
      let totalAnios = 0, totalMeses = 0, totalDias = 0;
      let validCount = 0;

      rows.forEach(row => {
        const desde = row.querySelector('.ef-periodo-desde')?.value;
        const hasta = row.querySelector('.ef-periodo-hasta')?.value;
        const durDisplay = row.querySelector('.ef-periodo-duracion');

        if (desde && hasta) {
          const diff = calcExactDiffBetween(desde, hasta);
          if (diff) {
            if (durDisplay) {
              durDisplay.style.color = 'var(--color-green-bright)';
              durDisplay.textContent = diff.texto;
            }
            totalAnios += diff.anios;
            totalMeses += diff.meses;
            totalDias += diff.dias;
            validCount++;
          } else {
            if (durDisplay) {
              durDisplay.style.color = '#ef4444';
              durDisplay.textContent = 'Hasta debe ser ≥ Desde';
            }
          }
        } else {
          if (durDisplay) durDisplay.textContent = '';
        }
      });

      if (totalDias >= 30) {
        totalMeses += Math.floor(totalDias / 30);
        totalDias = totalDias % 30;
      }
      if (totalMeses >= 12) {
        totalAnios += Math.floor(totalMeses / 12);
        totalMeses = totalMeses % 12;
      }

      if (validCount > 0) {
        periodosTotalDisplay.textContent = `Otro Tiempo acumulado: ${totalAnios} años, ${totalMeses} meses, ${totalDias} días`;
      } else {
        periodosTotalDisplay.textContent = '';
      }

      // Cálculo dinámico de Tiempo Total en la Gobernación
      const tiempoTotalDisplay = document.getElementById('ef-tiempo-total-display');
      const fechaIngresoVal = document.getElementById('ef-fecha-ingreso')?.value;
      if (tiempoTotalDisplay) {
        let diffIngreso = null;
        if (fechaIngresoVal) {
          const diffStr = calcDateDiffExact(fechaIngresoVal);
          if (diffStr && diffStr !== 'No disponible') diffIngreso = diffStr;
        }
        const acumuladoOtro = validCount > 0 ? { anios: totalAnios, meses: totalMeses, dias: totalDias } : null;
        const totalCombined = sumExactDurations(diffIngreso, acumuladoOtro);

        if (totalCombined) {
          tiempoTotalDisplay.style.display = 'block';
          tiempoTotalDisplay.innerHTML = `🏆 <strong>Tiempo Total en la Gobernación Estimado:</strong> ${totalCombined.texto} <span style="font-size:11px; font-weight:normal; opacity:0.85;">(Servicio + Otro Tiempo)</span>`;
        } else {
          tiempoTotalDisplay.style.display = 'none';
        }
      }
    };

    const fechaIngresoInput = document.getElementById('ef-fecha-ingreso');
    if (fechaIngresoInput) {
      fechaIngresoInput.addEventListener('change', updatePeriodosTotal);
    }

    const bindPeriodoRow = (row) => {
      const desdeInp = row.querySelector('.ef-periodo-desde');
      const hastaInp = row.querySelector('.ef-periodo-hasta');
      const delBtn = row.querySelector('.btn-del-periodo');

      if (desdeInp) desdeInp.addEventListener('change', updatePeriodosTotal);
      if (hastaInp) hastaInp.addEventListener('change', updatePeriodosTotal);
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          row.remove();
          updatePeriodosTotal();
        });
      }
    };

    if (periodosContainer) {
      periodosContainer.querySelectorAll('.periodo-row').forEach(bindPeriodoRow);
      updatePeriodosTotal();
    }

    if (btnAddPeriodo && periodosContainer) {
      btnAddPeriodo.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'periodo-row';
        div.style = 'display:grid; grid-template-columns: 1fr 1fr 1.2fr auto; gap:8px; align-items:center; background:var(--color-bg-secondary); padding:8px 12px; border-radius:6px; border:1px solid var(--color-border);';
        div.innerHTML = `
          <div>
            <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:2px;">Desde *</label>
            <input type="date" class="form-input ef-periodo-desde" required />
          </div>
          <div>
            <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:2px;">Hasta *</label>
            <input type="date" class="form-input ef-periodo-hasta" required />
          </div>
          <div style="font-size:12px; color:var(--color-green-bright); font-weight:600; padding-top:14px;" class="ef-periodo-duracion"></div>
          <div style="padding-top:14px;">
            <button type="button" class="btn btn-secondary btn-sm btn-del-periodo" style="padding:4px 8px; color:#ef4444;" title="Eliminar periodo">🗑️</button>
          </div>
        `;
        periodosContainer.appendChild(div);
        bindPeriodoRow(div);
      });
    }

    // 9. Regla 18: Matrícula profesional solo números
    const matInput = document.getElementById('ef-matricula');
    if (matInput) {
      matInput.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^\d]/g, ''); });
    }

    // 10. Regla 20: Teléfono fijo (solo dígitos)
    const telFijoInput = document.getElementById('ef-telefono-fijo');
    if (telFijoInput) {
      telFijoInput.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^\d]/g, ''); });
    }

    // 11. Regla 21: Celular dinámico (hasta 3 números independientes de 9-10 dígitos)
    const btnAddCel = document.getElementById('btn-add-celular');
    const celContainer = document.getElementById('ef-celulares-container');

    const bindCelInput = (inp) => {
      inp.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^\d]/g, '');
      });
    };

    if (celContainer) {
      celContainer.querySelectorAll('.ef-celular-input').forEach(bindCelInput);
    }

    if (btnAddCel && celContainer) {
      btnAddCel.addEventListener('click', () => {
        const rows = celContainer.querySelectorAll('.celular-row');
        if (rows.length >= 3) {
          App.showToast('Solo se permite registrar hasta 3 números celulares independientes.', 'warning');
          return;
        }
        const div = document.createElement('div');
        div.className = 'celular-row';
        div.style = 'display:flex; align-items:center; gap:8px;';
        div.innerHTML = `
          <input class="form-input ef-celular-input font-mono" placeholder="Celular ${rows.length + 1} (9 o 10 dígitos)" maxlength="10" />
          <button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()" style="padding:4px 8px;">✕</button>
        `;
        celContainer.appendChild(div);
        bindCelInput(div.querySelector('.ef-celular-input'));
      });
    }
  }

  async function loadCatalogs() {
    try {
      const cats = await API.getEmployeeCatalogs();
      if (cats) {
        state.catalogs.dependencias = cats.dependencias || [];
        state.catalogs.cargos = cats.cargos || [];
        state.catalogs.cargosPorDependencia = cats.cargosPorDependencia || {};
        state.catalogs.divipola = cats.divipola || state.catalogs.divipola;
        state.catalogs.grados = cats.grados || state.catalogs.grados;
        state.catalogs.clasificaciones = cats.clasificaciones || state.catalogs.clasificaciones;
        state.catalogs.estadosServidor = cats.estadosServidor || state.catalogs.estadosServidor;
        state.catalogs.sexos = cats.sexos || state.catalogs.sexos;
        state.catalogs.discapacidades = cats.discapacidades || state.catalogs.discapacidades;
        state.catalogs.diplomados = cats.diplomados || state.catalogs.diplomados;
      }
    } catch (err) {
      console.warn('Error al cargar catálogos completos:', err);
    }
  }

  function readForm(isEdit = false) {
    const nombre = document.getElementById('ef-nombre')?.value.trim();
    const cedula = document.getElementById('ef-cedula')?.value.trim();

    // 1. Validar Nombres y Apellidos (OBLIGATORIO: solo letras y espacios)
    if (!nombre) {
      App.showToast('Nombres y Apellidos son obligatorios.', 'warning');
      return null;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombre)) {
      App.showToast('Nombres y Apellidos solo admiten letras y espacios.', 'error');
      return null;
    }

    // 2. Validar Cédula de Ciudadanía (OBLIGATORIA: solo números, salvo en edición de vacantes)
    const isVacanteForm = document.getElementById('ef-cedula')?.type === 'hidden' || (nombre && nombre.startsWith('PLAZA VACANTE'));
    if (!isVacanteForm) {
      if (!cedula) {
        App.showToast('La Cédula de Ciudadanía es obligatoria.', 'warning');
        return null;
      }
      if (!/^\d+$/.test(cedula) && !/^PROV-\d+$/i.test(cedula)) {
        App.showToast('La Cédula debe contener únicamente números.', 'error');
        return null;
      }
    }

    // 3. Tipo de Sangre (Opcional; si tiene valor valida entre las 8 opciones permitidas)
    const tipoSangreRaw = document.getElementById('ef-tipo-sangre')?.value.trim().toUpperCase();
    let tipoSangre = null;
    if (tipoSangreRaw) {
      if (!['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(tipoSangreRaw)) {
        App.showToast('Tipo de Sangre inválido. Seleccione una opción válida (A+, A-, B+, B-, AB+, AB-, O+, O-).', 'warning');
        return null;
      }
      tipoSangre = tipoSangreRaw;
    }

    // 4. Código de cargo (Opcional; si tiene valor: sólo números y <= 1000)
    const codigoCargo = document.getElementById('ef-codigo-cargo')?.value.trim();
    if (codigoCargo) {
      if (!/^\d+$/.test(codigoCargo) || parseInt(codigoCargo, 10) > 1000) {
        App.showToast('El código de cargo debe ser numérico y no mayor a 1000.', 'error');
        return null;
      }
    }

    // 5. Grado (Opcional)
    const grado = document.getElementById('ef-grado')?.value || null;

    // 6. Sexo (Opcional)
    const sexo = document.getElementById('ef-sexo')?.value || null;

    // 7. Situación y Discapacidad (Opcionales)
    const situacion = document.getElementById('ef-situacion')?.value || 'ACTIVO';
    let tipoDiscapacidad = null;
    if (situacion === 'DISCAPACIDAD') {
      tipoDiscapacidad = document.getElementById('ef-tipo-discapacidad')?.value || null;
    }

    // 8. Periodos de Otro Tiempo con la Gobernación (Experiencia Múltiple, Opcional)
    const periodoRows = document.querySelectorAll('.periodo-row');
    const otroTiempoPeriodos = [];
    for (let i = 0; i < periodoRows.length; i++) {
      const row = periodoRows[i];
      const desde = row.querySelector('.ef-periodo-desde')?.value.trim();
      const hasta = row.querySelector('.ef-periodo-hasta')?.value.trim();

      if (!desde && !hasta) continue; // Fila vacía se ignora

      if (!desde || !hasta) {
        App.showToast(`En el periodo #${i + 1}, tanto la fecha inicial (desde) como la final (hasta) son obligatorias si ingresa un periodo.`, 'warning');
        return null;
      }

      if (hasta < desde) {
        App.showToast(`En el periodo #${i + 1}, la fecha final (${hasta}) debe ser mayor o igual a la fecha inicial (${desde}).`, 'error');
        return null;
      }

      otroTiempoPeriodos.push({ desde, hasta });
    }

    // 9. Celulares (Opcionales, hasta 3 números independientes de 9-10 dígitos)
    const celularInputs = document.querySelectorAll('.ef-celular-input');
    const celulares = [];
    for (const inp of celularInputs) {
      const val = inp.value.trim().replace(/[^\d]/g, '');
      if (val) {
        if (val.length < 9 || val.length > 10) {
          App.showToast(`El celular "${val}" debe tener entre 9 y 10 dígitos.`, 'error');
          return null;
        }
        celulares.push(val);
      }
    }

    // 10. Teléfono fijo (Opcional, 6 a 12 dígitos)
    const telefonoFijo = document.getElementById('ef-telefono-fijo')?.value.trim().replace(/[^\d]/g, '');
    if (telefonoFijo && (telefonoFijo.length < 6 || telefonoFijo.length > 12)) {
      App.showToast('El teléfono fijo debe contener entre 6 y 12 dígitos numéricos.', 'error');
      return null;
    }

    // 11. Correo institucional (Opcional, solo valida @ si se ingresa)
    const correo = document.getElementById('ef-correo-inst')?.value.trim();
    if (correo && !correo.includes('@')) {
      App.showToast('El Correo Institucional debe contener "@".', 'error');
      return null;
    }

    // 12. Correo personal (Opcional, solo valida @ si se ingresa)
    const correoPersonal = document.getElementById('ef-correo-pers')?.value.trim();
    if (correoPersonal && !correoPersonal.includes('@')) {
      App.showToast('El Correo Personal debe contener "@".', 'error');
      return null;
    }

    const tieneDiplomado = document.getElementById('ef-diplomado-toggle')?.value === 'SI';
    const diplomadoCapSena = tieneDiplomado ? (document.getElementById('ef-diplomado-opt')?.value || 'Diplomado Registrado') : null;

    const mpioVal = document.getElementById('ef-municipio-exp')?.value || document.getElementById('ef-ciudad-exp')?.value || null;

    return {
      nombreCompleto: nombre,
      cedula: cedula || '',
      nuevaCedula: cedula || '',
      departamentoExpedicion: document.getElementById('ef-depto-exp')?.value || null,
      municipioExpedicion: mpioVal,
      ciudadExpedicion: mpioVal,
      sexo,
      tipoSangre,
      fechaNacimiento: document.getElementById('ef-fecha-nac')?.value || null,
      dependencia: document.getElementById('ef-dep')?.value || null,
      cargoActual: document.getElementById('ef-cargo')?.value || null,
      codigoCargo: codigoCargo || null,
      grado: grado || null,
      clasificacionEmpleo: document.getElementById('ef-clasificacion')?.value || 'CARRERA ADMINISTRATIVA',
      estadoServidor: document.getElementById('ef-estado-servidor')?.value || 'Activo',
      opec: document.getElementById('ef-opec')?.value.trim() || null,
      situacion,
      tipoDiscapacidad,
      fechaIngreso: document.getElementById('ef-fecha-ingreso')?.value || null,
      fechaEncargo: document.getElementById('ef-fecha-encargo')?.value || null,
      otroTiempoPeriodos,
      otroTiempoGobernacion: document.getElementById('ef-periodos-total-display')?.textContent.replace('Tiempo total acumulado: ', '') || null,
      funciones: document.getElementById('ef-funciones')?.value.trim() || null,
      novedades: document.getElementById('ef-novedades')?.value.trim() || null,
      estudios: document.getElementById('ef-estudios')?.value.trim() || null,
      institucionEstudios: document.getElementById('ef-inst-estudios')?.value.trim() || null,
      matriculaProfesional: document.getElementById('ef-matricula')?.value.trim() || null,
      tieneDiplomado,
      diplomadoCapSena,
      telefonoFijo: telefonoFijo || null,
      celular: celulares[0] || null,
      celulares,
      correo: correo || null,
      correoPersonal: correoPersonal || null,
      direccion: document.getElementById('ef-direccion')?.value.trim() || null
    };
  }

  async function saveCreate() {
    const body = readForm(false);
    if (!body) return;
    const btn = document.getElementById('emp-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
    try {
      const res = await API.createEmployee(body);
      App.closeModal();
      const msgCc = res.documento_pendiente ? ` (Se asignó ID Temporal ${res.cedula})` : '';
      App.showToast(`Servidor registrado exitosamente.${msgCc}`, 'success');
      await load();
    } catch (err) {
      App.showToast(err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Guardar Servidor'; }
    }
  }

  async function saveEdit(idOrCedula) {
    const body = readForm(true);
    if (!body) return;
    const btn = document.getElementById('emp-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Actualizando...'; }
    try {
      await API.updateEmployee(idOrCedula, body);
      App.closeModal();
      App.showToast('Servidor actualizado exitosamente.', 'success');
      await load();
    } catch (err) {
      App.showToast(err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Actualizar Servidor'; }
    }
  }

  function confirmDelete(idOrCedula, nombre) {
    App.openModal('Confirmar Eliminación', `<p style="color:var(--text-secondary)">¿Está seguro de eliminar al servidor <strong style="color:var(--text-primary)">${nombre}</strong>?<br><br>Esta acción no se puede deshacer.</p>`, [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
      { text: 'Eliminar', cls: 'btn-danger', action: async () => {
        try {
          await API.deleteEmployee(idOrCedula);
          App.closeModal();
          App.showToast('Servidor eliminado exitosamente.', 'success');
          await load();
        } catch (err) { App.showToast(err.message, 'error'); }
      }},
    ]);
  }

  function goPage(p) {
    if (p < 1 || p > state.totalPages) return;
    state.page = p;
    load();
  }

  /**
   * Regla 7: Para la función de descarga a Excel, el sistema debe exportarlo en dos columnas:
   * una casilla para los "Apellidos" (ambos) y otra casilla para los "Nombres" (ambos).
   */
  const EXCEL_COLUMNS = [
    { header: 'Apellidos', key: 'apellidos', width: 25, sample: 'PEREZ RODRIGUEZ' },
    { header: 'Nombres', key: 'nombres', width: 25, sample: 'JUAN CARLOS' },
    { header: 'Cédula', key: 'cedula', width: 16, sample: '1049601234' },
    { header: 'Estado Servidor', key: 'estadoServidor', width: 16, sample: 'Activo' },
    { header: 'Dependencia', key: 'dependencia', width: 30, sample: 'SECRETARÍA DE HACIENDA' },
    { header: 'Denominación Cargo', key: 'cargoActual', width: 28, sample: 'PROFESIONAL UNIVERSITARIO' },
    { header: 'Código Cargo', key: 'codigoActual', width: 14, sample: '219' },
    { header: 'Grado', key: 'gradoActual', width: 10, sample: '03' },
    { header: 'Municipio Expedición', key: 'municipioExpedicion', width: 22, sample: 'TUNJA' },
    { header: 'Depto. Expedición', key: 'departamentoExpedicion', width: 20, sample: 'BOYACÁ' },
    { header: 'Tipo de Sangre', key: 'tipoSangre', width: 14, sample: 'O+' },
    { header: 'Sexo', key: 'sexo', width: 14, sample: 'MASCULINO' },
    { header: 'Edad', key: 'edadCalculada', width: 24, sample: '32 años, 5 meses, 10 días' },
    { header: 'Tiempo de Servicio', key: 'tiempoServicioCalculado', width: 24, sample: '6 años, 2 meses, 4 días' },
    { header: 'Otro Tiempo con la Gobernación', key: 'otroTiempoGobernacion', width: 30, sample: '2 años, 1 meses, 15 días' },
    { header: 'Tiempo Total en la Gobernación', key: 'tiempoTotalGobernacion', width: 30, sample: '8 años, 3 meses, 19 días' },
    { header: 'Situación', key: 'situacion', width: 18, sample: 'ACTIVO' },
    { header: 'Funciones', key: 'funciones', width: 24, sample: '01' },
    { header: 'OPEC', key: 'opec', width: 14, sample: '12345' },
    { header: 'Celulares', key: 'celularesStr', width: 28, sample: '3101234567 / 3209876543' },
    { header: 'Teléfono Fijo', key: 'telefonoFijo', width: 16, sample: '7401234' },
    { header: 'Correo Institucional', key: 'correo', width: 28, sample: 'juan.perez@boyaca.gov.co' },
    { header: 'Correo Personal', key: 'correoPersonal', width: 28, sample: 'juanperez@gmail.com' }
  ];

  async function exportExcel() {
    try {
      App.showToast('Generando archivo Excel con las 22 reglas de negocio...', 'info');
      const res = await API.getEmployees({ q: state.q, page: 1, limit: 10000 });
      const recordsRaw = res.data || state.data;

      // Desagregación estricta de Apellidos y Nombres (Regla 7)
      const records = recordsRaw.map(e => {
        let apellidos = e.apellidos;
        let nombres = e.nombres;
        if (!apellidos && e.nombreCompleto) {
          const parts = e.nombreCompleto.split(' ');
          apellidos = parts.slice(0, 2).join(' ');
          nombres = parts.slice(2).join(' ') || parts[0];
        }
        const celularesStr = (Array.isArray(e.celulares) && e.celulares.length)
          ? e.celulares.join(' / ')
          : (e.celular || '');

        return {
          ...e,
          apellidos: apellidos || '—',
          nombres: nombres || '—',
          celularesStr
        };
      });

      ExcelService.exportToExcel({
        filename: 'Talento360_Servidores_Publicos',
        sheetName: 'Servidores Públicos',
        columns: EXCEL_COLUMNS,
        data: records
      });
      App.showToast(`Se exportaron ${records.length} servidores exitosamente con columnas desagregadas.`, 'success');
    } catch (err) {
      App.showToast('Error al exportar a Excel: ' + err.message, 'error');
    }
  }

  function openImportModal() {
    const existing = document.getElementById('excel-emp-modal-overlay');
    if (existing) existing.remove();

    let selectedFile = null;

    const overlay = document.createElement('div');
    overlay.id = 'excel-emp-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card" style="max-width: 720px; width: 95%;">
        <div class="modal-header">
          <div class="modal-header-info">
            <h2 class="modal-title" style="display:flex; align-items:center; gap:8px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-green-bright)" stroke-width="2" style="width:24px; height:24px;">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Carga Masiva — TIEMPO DE SERVICIO 2026.xlsx
            </h2>
            <p class="modal-desc">Importación con mapeo DIVIPOLA, celulares en arreglo, estados Activos por defecto y cálculo dinámico.</p>
          </div>
          <button class="modal-close" id="btn-close-emp-import">&times;</button>
        </div>

        <div class="modal-body" style="padding: 20px 24px; max-height: 75vh; overflow-y: auto;">
          <div style="background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25); border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; font-size: 13px; color: var(--text-main); line-height: 1.5;">
            <strong style="color: var(--color-green-bright); display: block; margin-bottom: 4px;">⚡ Reglas de Negocio Automatizadas en la Importación:</strong>
            <ul style="margin: 0; padding-left: 18px; color: var(--text-muted);">
              <li><strong>Estado Activo (Regla 6):</strong> Todos los servidores históricos quedan guardados con estado "Activo" por defecto.</li>
              <li><strong>Mapeo DIVIPOLA (Regla 10):</strong> Mapea automáticamente la ciudad de expedición con su departamento correspondiente.</li>
              <li><strong>Celulares en Arreglo (Regla 21):</strong> Celdas con varios números separados por <code>/</code> se convierten a arreglo de celulares limpios.</li>
              <li><strong>ID Temporal Secuencial (Regla 9):</strong> Asigna identificador <code>PROV-00001</code> correlativo a quienes no tengan cédula.</li>
              <li><strong>Plazas Vacantes:</strong> Identifica plazas vacantes y preserva la estructura de cargo y dependencia.</li>
            </ul>
          </div>

          <div class="excel-dropzone" id="emp-excel-dropzone" style="border: 2px dashed var(--color-border); border-radius: 10px; padding: 30px; text-align: center; cursor: pointer; transition: all 0.2s ease; background: var(--bg-surface);">
            <input type="file" id="emp-excel-file-input" accept=".xlsx, .xls" style="display:none;" />
            <div style="margin-bottom: 12px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-green-bright)" stroke-width="2" style="width:48px;height:48px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <p style="font-weight: 600; font-size: 15px; margin-bottom: 4px; color: var(--text-main);" id="dropzone-main-text">
              Haz clic para seleccionar o arrastra aquí tu archivo Excel
            </p>
            <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
              Soporta "TIEMPO DE SERVICIO 2026.xlsx" (.xlsx, .xls)
            </p>
            <div id="emp-file-tag" style="display:none; margin-top: 14px; padding: 8px 14px; background: var(--color-green-glow); border-radius: 6px; font-size: 13px; font-weight: 600; color: var(--color-green-bright); display: inline-flex; align-items: center; gap: 8px;">
            </div>
          </div>

          <div id="emp-import-result" style="display:none; margin-top: 20px;"></div>
        </div>

        <div class="modal-footer" style="padding: 16px 24px; display:flex; justify-content:flex-end; gap:12px; border-top: 1px solid var(--color-border);">
          <button type="button" class="btn btn-secondary" id="btn-cancel-emp-import">Cerrar</button>
          <button type="button" class="btn btn-primary" id="btn-start-emp-import" disabled style="display:inline-flex; align-items:center; gap:8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span id="btn-start-emp-text">Procesar e Importar</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#btn-close-emp-import');
    const cancelBtn = overlay.querySelector('#btn-cancel-emp-import');
    const dropzone = overlay.querySelector('#emp-excel-dropzone');
    const fileInput = overlay.querySelector('#emp-excel-file-input');
    const fileTag = overlay.querySelector('#emp-file-tag');
    const startBtn = overlay.querySelector('#btn-start-emp-import');
    const startText = overlay.querySelector('#btn-start-emp-text');
    const resultDiv = overlay.querySelector('#emp-import-result');

    const closeModal = () => overlay.remove();
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    const selectFile = (file) => {
      if (!file) return;
      if (file.name.startsWith('~$')) {
        App.showToast('Archivo temporal de bloqueo (~$). Cierra Excel y selecciona el original.', 'error');
        fileInput.value = '';
        return;
      }
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        App.showToast('Por favor selecciona un archivo Excel (.xlsx o .xls).', 'error');
        fileInput.value = '';
        return;
      }
      selectedFile = file;
      fileTag.style.display = 'inline-flex';
      fileTag.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        ${file.name} (${(file.size / 1024).toFixed(1)} KB)
      `;
      startBtn.disabled = false;
      resultDiv.style.display = 'none';
    };

    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length) selectFile(e.target.files[0]);
    });
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--color-green-bright)'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = 'var(--color-border)'; });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--color-border)';
      if (e.dataTransfer.files && e.dataTransfer.files.length) selectFile(e.dataTransfer.files[0]);
    });

    startBtn.addEventListener('click', async () => {
      if (!selectedFile) return;
      startBtn.disabled = true;
      startText.textContent = 'Procesando en servidor...';
      App.showToast('Procesando archivo con reglas de negocio...', 'info');

      try {
        const res = await API.uploadEmployeesExcel(selectedFile);
        if (typeof Fx !== 'undefined' && Fx.play) Fx.play('success');

        const { resumen = {}, errores = [], hojasProcesadas = [] } = res;

        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--color-border); border-radius: 8px; padding: 16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; border-bottom: 1px solid var(--color-border); padding-bottom: 8px;">
              <strong style="color:var(--color-green-bright); font-size: 15px;">✅ Importación Completada</strong>
              <span class="badge badge--info" style="font-size:11px;">${hojasProcesadas.length} Hoja(s) Procesada(s)</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; text-align: center; margin-bottom: 14px;">
              <div style="background: var(--bg-surface); padding: 10px; border-radius: 6px; border: 1px solid var(--color-border);">
                <span style="font-size: 11px; color: var(--text-muted); display: block;">Total Filas</span>
                <span style="font-size: 18px; font-weight: 700;">${resumen.totalFilas || 0}</span>
              </div>
              <div style="background: rgba(34,197,94,0.1); padding: 10px; border-radius: 6px; border: 1px solid rgba(34,197,94,0.25);">
                <span style="font-size: 11px; color: var(--color-green-bright); display: block;">Nuevos (Insert)</span>
                <span style="font-size: 18px; font-weight: 700; color: var(--color-green-bright);">${resumen.insertados || 0}</span>
              </div>
              <div style="background: rgba(234,179,8,0.1); padding: 10px; border-radius: 6px; border: 1px solid rgba(234,179,8,0.25);">
                <span style="font-size: 11px; color: var(--color-gold); display: block;">Actualizados</span>
                <span style="font-size: 18px; font-weight: 700; color: var(--color-gold);">${resumen.actualizados || 0}</span>
              </div>
              <div style="background: rgba(59,130,246,0.1); padding: 10px; border-radius: 6px; border: 1px solid rgba(59,130,246,0.25);">
                <span style="font-size: 11px; color: #3b82f6; display: block;">ID Temporal PROV-</span>
                <span style="font-size: 18px; font-weight: 700; color: #3b82f6;">${resumen.provisionales || 0}</span>
              </div>
              <div style="background: rgba(254, 240, 138, 0.15); padding: 10px; border-radius: 6px; border: 1px solid rgba(250, 204, 21, 0.35);">
                <span style="font-size: 11px; color: #a16207; display: block;">Plazas Vacantes</span>
                <span style="font-size: 18px; font-weight: 700; color: #eab308;">${resumen.vacantes || 0}</span>
              </div>
            </div>

            ${errores.length > 0 ? `
              <div style="margin-top: 10px; max-height: 160px; overflow-y: auto; background: var(--bg-surface); border: 1px solid #ef4444; border-radius: 6px; padding: 10px;">
                <strong style="color:#ef4444; font-size:12px; display:block; margin-bottom: 6px;">Errores (${errores.length}):</strong>
                <ul style="margin:0; padding-left: 16px; font-size: 11px;">
                  ${errores.slice(0, 30).map(e => `<li>Fila ${e.fila} (CC: ${escHtml(e.cedula)}): ${escHtml(e.error)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `;

        startText.textContent = 'Procesado Exitosamente';
        App.showToast(`Importación completada: ${resumen.insertados} creados, ${resumen.actualizados} actualizados.`, 'success');
        await load();

      } catch (err) {
        App.showToast('Error al importar: ' + err.message, 'error');
        startBtn.disabled = false;
        startText.textContent = 'Reintentar';
      }
    });
  }

  async function render(container) {
    container.innerHTML = `
      <div class="module-enter">
        <div class="page-header">
          <div class="page-header-info">
            <h1 class="page-heading">Servidores Públicos</h1>
            <p class="page-desc">Módulo de gestión del talento humano con 22 reglas de negocio integradas</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary" onclick="EmployeesModule.exportExcel()" style="display:inline-flex; align-items:center; gap:6px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Exportar Excel
            </button>
            ${Auth.canEdit() ? `
            <button class="btn btn-secondary" onclick="EmployeesModule.openImportModal()" style="display:inline-flex; align-items:center; gap:6px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Carga Masiva Excel
            </button>
            <button class="btn btn-primary btn-liquid-create" onclick="EmployeesModule.openCreate()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo Servidor
            </button>` : ''}
          </div>
        </div>

        <div class="filters-card">
          <div class="filters-row">
            <div class="filter-group" style="flex:2;min-width:240px">
              <label class="filter-label">Buscar Servidor</label>
              <input id="emp-search" class="filter-input" placeholder="Buscar por nombre, cédula, dependencia, cargo..." />
            </div>
            <button class="btn btn-primary" onclick="EmployeesModule.search()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Buscar
            </button>
            <button class="btn btn-secondary" onclick="EmployeesModule.clearSearch()">Limpiar</button>
          </div>
        </div>

        <div class="table-card">
          <div class="table-header">
            <span class="table-title">Lista de Servidores Públicos</span>
            <span class="table-count" id="emp-count">Cargando...</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Servidor / Documento</th>
                  <th>Cargo & Código</th>
                  <th>Otro Tiempo Gobernación</th>
                  <th>Tiempo de Servicio</th>
                  <th>Tiempo Total Gobernación</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="emp-tbody">
                <tr><td colspan="7"><div class="empty-state loading-pulse">Cargando servidores...</div></td></tr>
              </tbody>
            </table>
          </div>
          <div class="pagination" id="emp-pagination"></div>
        </div>
      </div>`;

    const searchInput = document.getElementById('emp-search');
    if (searchInput) {
      searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') search(); });
    }

    state.page = 1; state.q = '';
    await load();
    const countEl = document.getElementById('emp-count');
    if (countEl) countEl.textContent = `${state.total.toLocaleString('es-CO')} registros`;
  }

  function search() {
    const q = document.getElementById('emp-search')?.value.trim() || '';
    state.q = q; state.page = 1;
    load();
  }
  function clearSearch() {
    const inp = document.getElementById('emp-search');
    if (inp) inp.value = '';
    state.q = ''; state.page = 1;
    load();
  }

  return {
    render,
    openCreate,
    openView,
    openEdit,
    confirmDelete,
    goPage,
    search,
    clearSearch,
    exportExcel,
    openImportModal,
    formatCedulaDots
  };
})();
