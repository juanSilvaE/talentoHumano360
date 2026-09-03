/* ═══════════════════════════════════════════════════════════════════════════
   admin-requests.js — Gestión de Solicitudes Administrativas
   (Permisos Laborales, Incapacidades, Licencias)
   ═══════════════════════════════════════════════════════════════════════════ */

const AdminRequestsModule = (() => {
  const TIPOS = { permisos: 'Permiso Laboral', incapacidades: 'Incapacidad', licencias: 'Licencia' };
  const ESTADOS = ['Todos', 'Pendiente', 'En revisión', 'Aprobada', 'Finalizada', 'Rechazada'];

  let state = { tipo: 'Permiso Laboral', data: [], total: 0, page: 1, totalPages: 1, filters: {} };

  function badgeClass(estado) {
    const e = (estado || '').toLowerCase();
    if (e.includes('aprobad'))  return 'badge--aprobada';
    if (e.includes('finaliz'))  return 'badge--finalizada';
    if (e.includes('rechazad')) return 'badge--rechazada';
    if (e.includes('revis'))    return 'badge--revision';
    return 'badge--pendiente';
  }
  function tipoBadge(tipo) {
    if (tipo === 'Permiso Laboral') return 'badge--permiso';
    if (tipo === 'Incapacidad')     return 'badge--incapacidad';
    return 'badge--licencia';
  }

  function tipoPlural(tipo) {
    if (tipo === 'Permiso Laboral' || tipo === 'permisos') return 'Permisos Laborales';
    if (tipo === 'Incapacidad' || tipo === 'incapacidades') return 'Incapacidades';
    if (tipo === 'Licencia' || tipo === 'licencias') return 'Licencias';
    return tipo || 'Permisos Laborales';
  }

  function setTipo(tipo, activeBtn) {
    state.tipo = tipo; state.page = 1; state.filters = {};
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
    // Update section heading and table title correctly with plural forms
    const heading = document.getElementById('adm-heading');
    if (heading) heading.textContent = tipoPlural(tipo);
    const tableTitle = document.getElementById('adm-table-title');
    if (tableTitle) tableTitle.textContent = tipoPlural(tipo);
    // Sync sidebar
    const sideMap = {
      'Permiso Laboral': 'nav-permisos',
      'Incapacidad': 'nav-incapacidades',
      'Licencia': 'nav-licencias',
    };
    document.querySelectorAll('.nav-subitem').forEach(b => b.classList.remove('active'));
    const sideBtn = document.getElementById(sideMap[tipo]);
    if (sideBtn) sideBtn.classList.add('active');
    load();
  }

  async function load() {
    try {
      const params = { tipo: state.tipo, page: state.page, limit: 20, ...state.filters };
      const res = await API.getAdminRequests(params);
      state.data = res.data || [];
      state.total = res.total || 0;
      state.totalPages = res.totalPages || 1;
      renderTable();
      renderPagination();
      const countEl = document.getElementById('adm-count');
      if (countEl) countEl.textContent = `${state.total.toLocaleString('es-CO')} registros`;
    } catch (err) { App.showToast('Error al cargar solicitudes: ' + err.message, 'error'); }
  }

  function renderTable() {
    const tbody = document.getElementById('adm-tbody');
    if (!tbody) return;
    if (!state.data.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span class="empty-state-title">No hay solicitudes de ${state.tipo}</span>
        <span class="empty-state-desc">No se encontraron registros.</span>
        </div></td></tr>`;
      return;
    }
    tbody.innerHTML = state.data.map(r => `
      <tr>
        <td class="td-radicado">${r.radicado}</td>
        <td class="td-primary" title="${r.persona}">${truncate(r.persona, 28) || '—'}</td>
        <td title="${r.dependencia}">${truncate(r.dependencia, 26) || '—'}</td>
        <td><span class="badge ${tipoBadge(r.tipo)}">${r.tipo}</span></td>
        <td>${r.fechaInicio || '—'}</td>
        <td>${r.diasSolicitados ?? '—'}</td>
        <td>
          <button type="button" class="badge badge--interactive ${badgeClass(r.estado)}" onclick="AdminRequestsModule.openStatusPicker(${r.id})" title="Clic para cambiar estado de esta solicitud" aria-label="Cambiar estado: ${r.estado}">
            <span>${r.estado}</span>
            <svg class="badge-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </td>
        <td class="td-actions">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="AdminRequestsModule.openEdit(${r.id})" title="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          ${Auth.canEdit() ? `<button class="btn btn-danger btn-sm btn-icon" onclick="AdminRequestsModule.confirmDelete(${r.id},'${escHtml(r.persona)}')" title="Eliminar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>` : ''}
        </td>
      </tr>`).join('');
  }

  function renderPagination() {
    const el = document.getElementById('adm-pagination');
    if (!el) return;
    el.innerHTML = `
      <span class="pagination-info">Mostrando ${state.data.length} de ${state.total.toLocaleString('es-CO')}</span>
      <div class="pagination-btns">
        <button class="page-btn" onclick="AdminRequestsModule.goPage(${state.page-1})" ${state.page<=1?'disabled':''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
        <span class="page-btn active">${state.page}</span>
        <span style="color:var(--text-muted);font-size:var(--text-sm)">/ ${state.totalPages}</span>
        <button class="page-btn" onclick="AdminRequestsModule.goPage(${state.page+1})" ${state.page>=state.totalPages?'disabled':''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
      </div>`;
  }

  function buildForm(r = {}) {
    const dis = Auth.canEdit() ? '' : 'disabled';
    const tipos = Object.values(TIPOS);
    return `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Tipo *</label>
          <select id="af-tipo" class="filter-select" ${dis}>
            ${tipos.map(t => `<option ${(r.tipo||state.tipo) === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select id="af-estado" class="filter-select" ${dis}>
            ${ESTADOS.filter(s=>s!=='Todos').map(s=>`<option ${r.estado===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group span-2">
          <label class="form-label">Nombre Completo *</label>
          <input id="af-nombre" class="form-input" placeholder="APELLIDO APELLIDO NOMBRE..." value="${escHtml(r.persona||'')}" ${dis} required />
        </div>
        <div class="form-group">
          <label class="form-label">Documento</label>
          <input id="af-doc" class="form-input" placeholder="Número de cédula" value="${escHtml(r.documento||'')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Cargo</label>
          <input id="af-cargo" class="form-input" placeholder="Cargo del servidor..." value="${escHtml(r.cargo||'')}" ${dis} />
        </div>
        <div class="form-group span-2">
          <label class="form-label">Dependencia</label>
          <input id="af-dep" class="form-input" placeholder="Secretaría / Dependencia..." value="${escHtml(r.dependencia||'')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Fecha Inicio</label>
          <input id="af-fi" class="form-input" placeholder="DD/MM/AAAA" value="${escHtml(r.fechaInicio||'')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Fecha Fin</label>
          <input id="af-ff" class="form-input" placeholder="DD/MM/AAAA" value="${escHtml(r.fechaFin||'')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Días Solicitados</label>
          <input id="af-dias" class="form-input" type="number" min="1" value="${escHtml(r.diasSolicitados||'1')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Aprobado Por</label>
          <input id="af-aprobado" class="form-input" placeholder="Nombre del aprobador..." value="${escHtml(r.aprobadoPor||'')}" ${dis} />
        </div>
        <div class="form-group span-2">
          <label class="form-label">Motivo</label>
          <input id="af-motivo" class="form-input" placeholder="Motivo de la solicitud..." value="${escHtml(r.motivo||'')}" ${dis} />
        </div>
        <div class="form-group span-2">
          <label class="form-label">Observaciones / Nota de Gestión</label>
          <input id="af-obs" class="form-input" placeholder="Observaciones o nota del coordinador..." value="${escHtml(r.observaciones||'')}" ${dis} />
        </div>
      </div>`;
  }

  function openCreate() {
    App.openModal(`Nueva Solicitud — ${state.tipo}`, buildForm(), [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
      { text: 'Crear Solicitud', cls: 'btn-primary', id: 'adm-save-btn', action: saveCreate },
    ]);
  }
  function openEdit(id) {
    const r = state.data.find(x => x.id === id);
    if (!r) return;
    App.openModal('Editar Solicitud', buildForm(r), [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
      { text: 'Actualizar', cls: 'btn-gold', id: 'adm-save-btn', action: () => saveEdit(id) },
    ]);
  }

  async function saveCreate() {
    const body = readForm();
    if (!body) return;
    const btn = document.getElementById('adm-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
    try {
      const res = await API.createAdminRequest(body);
      App.closeModal();
      App.showToast(`Solicitud creada. Radicado: ${res.radicado || ''}`, 'success');
      await load();
    } catch (err) { App.showToast(err.message, 'error'); }
    finally { if (btn) { btn.disabled = false; btn.textContent = 'Crear Solicitud'; } }
  }

  async function saveEdit(id) {
    const body = readForm();
    if (!body) return;
    const btn = document.getElementById('adm-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Actualizando...'; }
    try {
      await API.updateAdminRequest(id, body);
      App.closeModal();
      App.showToast('Solicitud actualizada.', 'success');
      await load();
    } catch (err) { App.showToast(err.message, 'error'); }
    finally { if (btn) { btn.disabled = false; btn.textContent = 'Actualizar'; } }
  }

  function readForm() {
    const nombre = document.getElementById('af-nombre')?.value.trim();
    if (!nombre) { App.showToast('El nombre es requerido.', 'warning'); return null; }
    return {
      tipo: document.getElementById('af-tipo')?.value,
      persona: nombre,
      documento: document.getElementById('af-doc')?.value.trim(),
      dependencia: document.getElementById('af-dep')?.value.trim(),
      cargo: document.getElementById('af-cargo')?.value.trim(),
      fechaInicio: document.getElementById('af-fi')?.value.trim(),
      fechaFin: document.getElementById('af-ff')?.value.trim(),
      diasSolicitados: parseInt(document.getElementById('af-dias')?.value) || 1,
      motivo: document.getElementById('af-motivo')?.value.trim(),
      estado: document.getElementById('af-estado')?.value || 'Pendiente',
      observaciones: document.getElementById('af-obs')?.value.trim(),
      aprobadoPor: document.getElementById('af-aprobado')?.value.trim(),
      notaGestion: document.getElementById('af-obs')?.value.trim(),
    };
  }

  function confirmDelete(id, nombre) {
    App.openModal('Confirmar Eliminación', `<p style="color:var(--text-secondary)">¿Eliminar la solicitud de <strong style="color:var(--text-primary)">${nombre}</strong>?</p>`, [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
      { text: 'Eliminar', cls: 'btn-danger', action: async () => {
        try { await API.deleteAdminRequest(id); App.closeModal(); App.showToast('Solicitud eliminada.','success'); await load(); }
        catch(err) { App.showToast(err.message,'error'); }
      }},
    ]);
  }

  function applyFilters() {
    state.page = 1;
    state.filters = {
      q: document.getElementById('adm-q')?.value.trim() || '',
      estado: document.getElementById('adm-estado')?.value || '',
    };
    load();
  }
  function clearFilters() {
    ['adm-q','adm-estado'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    state.filters = {}; state.page = 1; load();
  }
  function goPage(p) { if (p < 1 || p > state.totalPages) return; state.page = p; load(); }

  async function render(container, tipoKey, navItem) {
    const tipoLabel = TIPOS[tipoKey] || 'Permiso Laboral';

    container.innerHTML = `
      <div class="module-enter">
        <div class="page-header">
          <div class="page-header-info">
            <h1 class="page-heading" id="adm-heading">${tipoPlural(tipoLabel)}</h1>
            <p class="page-desc">Administre permisos laborales, incapacidades y licencias del personal</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary" onclick="AdminRequestsModule.exportExcel()" style="display:inline-flex; align-items:center; gap:6px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Exportar Excel
            </button>
            ${Auth.canEdit() ? `
            <button class="btn btn-secondary" onclick="AdminRequestsModule.openImportModal()" style="display:inline-flex; align-items:center; gap:6px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Carga Masiva Excel
            </button>
            <button class="btn btn-primary" onclick="AdminRequestsModule.openCreate()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nueva Solicitud
            </button>` : ''}
          </div>
        </div>

        <div class="module-tabs">
          <button class="tab-btn ${tipoLabel==='Permiso Laboral'?'active':''}" onclick="AdminRequestsModule.setTipo('Permiso Laboral',this)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Permisos Laborales
          </button>
          <button class="tab-btn ${tipoLabel==='Incapacidad'?'active':''}" onclick="AdminRequestsModule.setTipo('Incapacidad',this)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Incapacidades
          </button>
          <button class="tab-btn ${tipoLabel==='Licencia'?'active':''}" onclick="AdminRequestsModule.setTipo('Licencia',this)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            Licencias
          </button>
        </div>

        <div class="filters-card">
          <div class="filters-row">
            <div class="filter-group" style="flex:2">
              <label class="filter-label">Buscar</label>
              <input id="adm-q" class="filter-input" placeholder="Nombre, cédula, dependencia..." />
            </div>
            <div class="filter-group">
              <label class="filter-label">Estado</label>
              <select id="adm-estado" class="filter-select">
                ${ESTADOS.map(s => `<option>${s}</option>`).join('')}
              </select>
            </div>
            <button class="btn btn-primary" onclick="AdminRequestsModule.applyFilters()">Filtrar</button>
            <button class="btn btn-secondary" onclick="AdminRequestsModule.clearFilters()">Limpiar</button>
          </div>
        </div>

        <div class="table-card">
          <div class="table-header">
            <span class="table-title" id="adm-table-title">${tipoPlural(tipoLabel)}</span>
            <span class="table-count" id="adm-count">Cargando...</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th>Radicado</th><th>Servidor</th><th>Dependencia</th>
                <th>Tipo</th><th>Fecha Inicio</th><th>Días</th><th>Estado</th><th>Acciones</th>
              </tr></thead>
              <tbody id="adm-tbody"><tr><td colspan="8"><div class="empty-state loading-pulse">Cargando...</div></td></tr></tbody>
            </table>
          </div>
          <div class="pagination" id="adm-pagination"></div>
        </div>
      </div>`;

    document.getElementById('adm-q')?.addEventListener('keypress', e => { if (e.key === 'Enter') applyFilters(); });

    state.tipo = tipoLabel; state.page = 1; state.filters = {};
    await load();
  }

  const STATUS_CONFIG = [
    {
      id: 'aprobada',
      name: 'Aprobada',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
      desc: 'Aprobar solicitud institucional',
      cls: 'status-card-opt--aprobada',
    },
    {
      id: 'rechazada',
      name: 'Rechazada',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      desc: 'Denegar o rechazar trámite',
      cls: 'status-card-opt--rechazada',
    },
    {
      id: 'revision',
      name: 'En revisión',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      desc: 'En verificación médica o validación jurídica de soportes',
      cls: 'status-card-opt--revision',
    },
    {
      id: 'pendiente',
      name: 'Pendiente',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      desc: 'En espera de visto bueno o turno de trámite',
      cls: 'status-card-opt--pendiente',
    },
    {
      id: 'finalizada',
      name: 'Finalizada',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      desc: 'Trámite culminado y archivado en hoja de vida',
      cls: 'status-card-opt--finalizada',
    },
  ];

  function openStatusPicker(id) {
    if (!Auth.canEdit()) {
      App.showToast('No tienes permisos de edición para cambiar estados.', 'warning');
      return;
    }
    const r = state.data.find(x => x.id === id);
    if (!r) return;

    const cardsHtml = STATUS_CONFIG.map(opt => {
      const isCurrent = r.estado === opt.name;
      return `
        <button type="button" class="status-card-opt ${opt.cls} ${isCurrent ? 'is-current' : ''}" onclick="AdminRequestsModule.selectQuickStatus(${r.id}, '${opt.name}')" title="Marcar como ${opt.name}">
          <div class="status-opt-icon">${opt.icon}</div>
          <div class="status-opt-info">
            <div class="status-opt-title-row">
              <span class="status-opt-name">${opt.name}</span>
              ${isCurrent ? '<span class="status-current-badge">Estado actual</span>' : ''}
            </div>
            <span class="status-opt-desc">${opt.desc}</span>
          </div>
          <div class="status-opt-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </button>`;
    }).join('');

    const bodyHtml = `
      <div class="status-picker-container">
        <div class="status-picker-hero">
          <div class="status-picker-rad">${escHtml(r.radicado)}</div>
          <div class="status-picker-person">${escHtml(r.persona)}</div>
          <div class="status-picker-tags">
            <span class="status-picker-tag">📋 ${escHtml(r.tipo)}</span>
            <span class="status-picker-tag">📅 ${escHtml(r.fechaInicio || '—')} (${r.diasSolicitados || 1} días)</span>
            <span class="status-picker-tag">Estado actual: <strong class="badge ${badgeClass(r.estado)}" style="margin-left:4px">${r.estado}</strong></span>
          </div>
        </div>

        <div class="status-picker-section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <span>Selecciona el nuevo estado para esta solicitud:</span>
        </div>

        <div class="status-cards-grid">
          ${cardsHtml}
        </div>

        <div class="form-group" style="margin-top:var(--space-2);">
          <label class="form-label">Nota de Gestión / Concepto (Opcional)</label>
          <input id="adm-quick-status-note" class="form-input form-input--no-icon" placeholder="Ej: Aprobado según soporte médico presentado..." value="${escHtml(r.observaciones || '')}" />
        </div>
      </div>`;

    App.openModal('Gestión Rápida de Estado', bodyHtml, [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
    ]);
  }

  async function selectQuickStatus(id, newStatus) {
    const note = document.getElementById('adm-quick-status-note')?.value.trim();
    try {
      await API.updateAdminRequestStatus(id, newStatus, note);
      App.closeModal();
      App.showToast(`Estado actualizado a "${newStatus}".`, 'success');
      await load();
    } catch (err) {
      App.showToast(err.message || 'Error al cambiar estado.', 'error');
    }
  }

  const EXCEL_COLUMNS = [
    { header: 'Radicado', key: 'radicado', width: 18, sample: 'PL-2026-00045' },
    { header: 'Tipo', key: 'tipo', width: 18, sample: 'Permiso Laboral' },
    { header: 'Cédula', key: 'documento', width: 15, sample: '1049601234' },
    { header: 'Servidor Público', key: 'persona', width: 32, sample: 'GARCIA MARTINEZ LUIS FERNANDO' },
    { header: 'Dependencia', key: 'dependencia', width: 30, sample: 'SECRETARÍA DE HACIENDA' },
    { header: 'Cargo', key: 'cargo', width: 26, sample: 'PROFESIONAL UNIVERSITARIO' },
    { header: 'Fecha Inicio', key: 'fechaInicio', width: 16, sample: '15/05/2026' },
    { header: 'Fecha Fin', key: 'fechaFin', width: 16, sample: '15/05/2026' },
    { header: 'Días', key: 'dias', width: 10, sample: '1' },
    { header: 'Motivo o Diagnóstico', key: 'motivo', width: 32, sample: 'Diligencia personal urgente' },
    { header: 'Estado', key: 'estado', width: 16, sample: 'Aprobada' },
    { header: 'Observaciones', key: 'observaciones', width: 30, sample: 'Soporte recibido' },
  ];

  async function exportExcel() {
    try {
      App.showToast('Generando archivo Excel...', 'info');
      const res = await API.getAdminRequests({ tipo: state.tipo, ...state.filters, page: 1, limit: 10000 });
      const records = res.data || state.data;
      ExcelService.exportToExcel({
        filename: `Talento360_${(state.tipo || 'Solicitudes_Admin').replace(/\s+/g, '_')}`,
        sheetName: tipoPlural(state.tipo),
        columns: EXCEL_COLUMNS,
        data: records
      });
      App.showToast(`Se exportaron ${records.length} registros de ${tipoPlural(state.tipo)} exitosamente.`, 'success');
    } catch (err) {
      App.showToast('Error al exportar: ' + err.message, 'error');
    }
  }

  function openImportModal() {
    ExcelService.openImportModal({
      title: `Carga Masiva de Solicitudes Administrativas (${tipoPlural(state.tipo)})`,
      subtitle: `Importe registros masivos de ${tipoPlural(state.tipo).toLowerCase()} mediante un archivo Excel (.xlsx / .xls)`,
      moduleName: tipoPlural(state.tipo).toLowerCase(),
      columns: EXCEL_COLUMNS.filter(c => c.key !== 'radicado'),
      sampleRows: [
        {
          'Tipo': state.tipo || 'Permiso Laboral',
          'Cédula': '1049612345',
          'Servidor Público': 'GOMEZ PEREZ ANDREA PAOLA',
          'Dependencia': 'SECRETARÍA DE EDUCACIÓN',
          'Cargo': 'AUXILIAR ADMINISTRATIVO',
          'Fecha Inicio': '01/06/2026',
          'Fecha Fin': '01/06/2026',
          'Días': '1',
          'Motivo o Diagnóstico': 'Cita médica especializada EPS',
          'Estado': 'Pendiente',
          'Observaciones': 'Anexa orden médica'
        },
        {
          'Tipo': state.tipo || 'Permiso Laboral',
          'Cédula': '79850123',
          'Servidor Público': 'RODRIGUEZ MARTINEZ LUIS FERNANDO',
          'Dependencia': 'SECRETARÍA GENERAL',
          'Cargo': 'PROFESIONAL ESPECIALIZADO',
          'Fecha Inicio': '10/06/2026',
          'Fecha Fin': '12/06/2026',
          'Días': '3',
          'Motivo o Diagnóstico': 'Calamidad doméstica justificada',
          'Estado': 'Aprobada',
          'Observaciones': 'Autorizado por jefe inmediato'
        }
      ],
      validateRow: (row) => {
        const documento = (row['Cédula'] || row.documento || row.cedula || row['Documento'] || '').toString().trim();
        const persona = (row['Servidor Público'] || row.persona || row.nombreCompleto || row['Nombre Completo'] || '').toString().trim();
        const dependencia = (row['Dependencia'] || row.dependencia || '').toString().trim();
        if (!documento || !persona || !dependencia) {
          return { valid: false, error: 'Cédula, Servidor y Dependencia son requeridos.' };
        }
        return {
          valid: true,
          cleanRow: {
            tipo: (row['Tipo'] || row.tipo || state.tipo || 'Permiso Laboral').toString().trim(),
            documento,
            persona,
            dependencia,
            cargo: (row['Cargo'] || row.cargo || '').toString().trim(),
            fechaInicio: (row['Fecha Inicio'] || row.fechaInicio || '').toString().trim(),
            fechaFin: (row['Fecha Fin'] || row.fechaFin || '').toString().trim(),
            diasSolicitados: parseInt(row['Días'] || row.diasSolicitados || row.dias || 1) || 1,
            motivo: (row['Motivo o Diagnóstico'] || row.motivo || row.diagnostico || '').toString().trim(),
            estado: (row['Estado'] || row.estado || 'Pendiente').toString().trim(),
            observaciones: (row['Observaciones'] || row.observaciones || '').toString().trim()
          }
        };
      },
      onImport: async (rows) => {
        const res = await API.bulkCreateAdminRequests(rows);
        App.showToast(res.message || `${res.inserted} solicitudes importadas.`, 'success');
        await load();
      }
    });
  }

  return { render, openCreate, openEdit, openStatusPicker, selectQuickStatus, confirmDelete, applyFilters, clearFilters, goPage, setTipo, exportExcel, openImportModal };
})();
