/* ═══════════════════════════════════════════════════════════════════════════
   viaticos.js — Viáticos module (NEW)
   ═══════════════════════════════════════════════════════════════════════════ */

const ViaticosModule = (() => {
  const ESTADOS = ['Todos', 'Pendiente', 'En revisión', 'Aprobada', 'Finalizada', 'Rechazada'];
  let state = { data: [], total: 0, page: 1, totalPages: 1, filters: {} };

  function badgeClass(estado) {
    const e = (estado || '').toLowerCase();
    if (e.includes('aprobad'))  return 'badge--aprobada';
    if (e.includes('finaliz'))  return 'badge--finalizada';
    if (e.includes('rechazad')) return 'badge--rechazada';
    if (e.includes('revis'))    return 'badge--revision';
    return 'badge--pendiente';
  }

  function formatCOP(n) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);
  }

  async function load() {
    try {
      const res = await API.getViaticos({ page: state.page, limit: 20, ...state.filters });
      state.data = res.data || [];
      state.total = res.total || 0;
      state.totalPages = res.totalPages || 1;
      renderTable();
      renderPagination();
      const countEl = document.getElementById('vit-count');
      if (countEl) countEl.textContent = `${state.total.toLocaleString('es-CO')} registros`;
    } catch (err) { App.showToast('Error al cargar viáticos: ' + err.message, 'error'); }
  }

  function renderTable() {
    const tbody = document.getElementById('vit-tbody');
    if (!tbody) return;
    if (!state.data.length) {
      tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span class="empty-state-title">No hay viáticos registrados</span>
        <span class="empty-state-desc">No se encontraron viáticos con los filtros aplicados.</span>
        </div></td></tr>`;
      return;
    }
    tbody.innerHTML = state.data.map(r => `
      <tr>
        <td class="td-radicado">${r.radicado}</td>
        <td class="td-primary" title="${r.persona}">${truncate(r.persona, 26) || '—'}</td>
        <td title="${r.dependencia}">${truncate(r.dependencia, 24) || '—'}</td>
        <td title="${r.destino}">${truncate(r.destino, 20) || '—'}</td>
        <td>${r.fechaInicio || '—'}</td>
        <td>${r.dias ?? '—'} días</td>
        <td class="td-currency">${formatCOP(r.valorTotal)}</td>
        <td>
          <button type="button" class="badge badge--interactive ${badgeClass(r.estado)}" onclick="ViaticosModule.openStatusPicker(${r.id})" title="Clic para cambiar estado de este viático" aria-label="Cambiar estado: ${r.estado}">
            <span>${r.estado}</span>
            <svg class="badge-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </td>
        <td class="td-actions">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="ViaticosModule.openEdit(${r.id})" title="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          ${Auth.canEdit() ? `<button class="btn btn-danger btn-sm btn-icon" onclick="ViaticosModule.confirmDelete(${r.id},'${escHtml(r.persona)}')" title="Eliminar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>` : ''}
        </td>
      </tr>`).join('');
  }

  function renderPagination() {
    const el = document.getElementById('vit-pagination');
    if (!el) return;
    el.innerHTML = `
      <span class="pagination-info">Mostrando ${state.data.length} de ${state.total.toLocaleString('es-CO')}</span>
      <div class="pagination-btns">
        <button class="page-btn" onclick="ViaticosModule.goPage(${state.page-1})" ${state.page<=1?'disabled':''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
        <span class="page-btn active">${state.page}</span>
        <span style="color:var(--text-muted);font-size:var(--text-sm)">/ ${state.totalPages}</span>
        <button class="page-btn" onclick="ViaticosModule.goPage(${state.page+1})" ${state.page>=state.totalPages?'disabled':''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
      </div>`;
  }

  function buildForm(r = {}) {
    const dis = Auth.canEdit() ? '' : 'disabled';
    return `
      <div class="form-grid">
        <div class="form-group span-2">
          <label class="form-label">Nombre Completo *</label>
          <input id="vf-nombre" class="form-input" placeholder="APELLIDO APELLIDO NOMBRE..." value="${escHtml(r.persona||'')}" ${dis} required />
        </div>
        <div class="form-group">
          <label class="form-label">Documento</label>
          <input id="vf-doc" class="form-input" placeholder="Número de cédula" value="${escHtml(r.documento||'')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Cargo</label>
          <input id="vf-cargo" class="form-input" placeholder="Cargo del servidor..." value="${escHtml(r.cargo||'')}" ${dis} />
        </div>
        <div class="form-group span-2">
          <label class="form-label">Dependencia</label>
          <input id="vf-dep" class="form-input" placeholder="Secretaría / Dependencia..." value="${escHtml(r.dependencia||'')}" ${dis} />
        </div>
        <div class="form-group span-2">
          <label class="form-label">Destino *</label>
          <input id="vf-destino" class="form-input" placeholder="Ciudad, Departamento del desplazamiento..." value="${escHtml(r.destino||'')}" ${dis} required />
        </div>
        <div class="form-group span-2">
          <label class="form-label">Motivo del Viático</label>
          <input id="vf-motivo" class="form-input" placeholder="Descripción del objetivo del viaje..." value="${escHtml(r.motivo||'')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Fecha Inicio</label>
          <input id="vf-fi" class="form-input" placeholder="DD/MM/AAAA" value="${escHtml(r.fechaInicio||'')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Fecha Fin</label>
          <input id="vf-ff" class="form-input" placeholder="DD/MM/AAAA" value="${escHtml(r.fechaFin||'')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Número de Días</label>
          <input id="vf-dias" class="form-input" type="number" min="1" value="${escHtml(r.dias||'1')}" oninput="ViaticosModule.calcTotal()" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Valor Diario ($)</label>
          <input id="vf-vdiario" class="form-input" type="number" min="0" step="1000" placeholder="0" value="${escHtml(r.valorDiario||'0')}" oninput="ViaticosModule.calcTotal()" ${dis} />
        </div>
        <div class="form-group span-2">
          <label class="form-label">Valor Total (calculado automáticamente)</label>
          <input id="vf-vtotal" class="form-input" placeholder="Calculado automáticamente" readonly style="background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.3);color:#34d399;font-weight:700;" value="${formatCOP(r.valorTotal||0)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select id="vf-estado" class="filter-select" ${dis}>
            ${ESTADOS.filter(s=>s!=='Todos').map(s=>`<option ${r.estado===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Aprobado Por</label>
          <input id="vf-aprobado" class="form-input" placeholder="Nombre del aprobador..." value="${escHtml(r.aprobadoPor||'')}" ${dis} />
        </div>
        <div class="form-group span-2">
          <label class="form-label">Observaciones</label>
          <input id="vf-obs" class="form-input" placeholder="Observaciones adicionales..." value="${escHtml(r.observaciones||'')}" ${dis} />
        </div>
      </div>`;
  }

  function calcTotal() {
    const dias = parseFloat(document.getElementById('vf-dias')?.value) || 0;
    const daily = parseFloat(document.getElementById('vf-vdiario')?.value) || 0;
    const total = dias * daily;
    const el = document.getElementById('vf-vtotal');
    if (el) el.value = formatCOP(total);
  }

  function openCreate() {
    App.openModal('Nuevo Viático', buildForm(), [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
      { text: 'Crear Viático', cls: 'btn-primary', id: 'vit-save-btn', action: saveCreate },
    ]);
  }

  function openEdit(id) {
    const r = state.data.find(x => x.id === id);
    if (!r) return;
    App.openModal('Editar Viático', buildForm(r), [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
      { text: 'Actualizar', cls: 'btn-gold', id: 'vit-save-btn', action: () => saveEdit(id) },
    ]);
  }

  async function saveCreate() {
    const body = readForm();
    if (!body) return;
    const btn = document.getElementById('vit-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
    try {
      const res = await API.createViatico(body);
      App.closeModal();
      App.showToast(`Viático creado. Radicado: ${res.radicado || ''}`, 'success');
      await load();
    } catch (err) { App.showToast(err.message, 'error'); }
    finally { if (btn) { btn.disabled = false; btn.textContent = 'Crear Viático'; } }
  }

  async function saveEdit(id) {
    const body = readForm();
    if (!body) return;
    const btn = document.getElementById('vit-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Actualizando...'; }
    try {
      await API.updateViatico(id, body);
      App.closeModal();
      App.showToast('Viático actualizado.', 'success');
      await load();
    } catch (err) { App.showToast(err.message, 'error'); }
    finally { if (btn) { btn.disabled = false; btn.textContent = 'Actualizar'; } }
  }

  function readForm() {
    const nombre  = document.getElementById('vf-nombre')?.value.trim();
    const destino = document.getElementById('vf-destino')?.value.trim();
    if (!nombre || !destino) { App.showToast('Nombre y destino son requeridos.', 'warning'); return null; }
    return {
      persona: nombre, documento: document.getElementById('vf-doc')?.value.trim(),
      dependencia: document.getElementById('vf-dep')?.value.trim(),
      cargo: document.getElementById('vf-cargo')?.value.trim(),
      destino,
      motivo: document.getElementById('vf-motivo')?.value.trim(),
      fechaInicio: document.getElementById('vf-fi')?.value.trim(),
      fechaFin: document.getElementById('vf-ff')?.value.trim(),
      dias: parseInt(document.getElementById('vf-dias')?.value) || 1,
      valorDiario: parseFloat(document.getElementById('vf-vdiario')?.value) || 0,
      estado: document.getElementById('vf-estado')?.value || 'Pendiente',
      observaciones: document.getElementById('vf-obs')?.value.trim(),
      aprobadoPor: document.getElementById('vf-aprobado')?.value.trim(),
    };
  }

  const STATUS_CONFIG = [
    {
      id: 'aprobada',
      name: 'Aprobada',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
      desc: 'Aprobar viático para trámite y desembolso',
      cls: 'status-card-opt--aprobada',
    },
    {
      id: 'rechazada',
      name: 'Rechazada',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      desc: 'Denegar o no autorizar la comisión de servicios',
      cls: 'status-card-opt--rechazada',
    },
    {
      id: 'revision',
      name: 'En revisión',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      desc: 'En verificación de soportes y disponibilidad presupuestal',
      cls: 'status-card-opt--revision',
    },
    {
      id: 'pendiente',
      name: 'Pendiente',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      desc: 'Registrado en espera de gestión o turno',
      cls: 'status-card-opt--pendiente',
    },
    {
      id: 'finalizada',
      name: 'Finalizada',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      desc: 'Comisión cumplida y legalizada formalmente',
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
        <button type="button" class="status-card-opt ${opt.cls} ${isCurrent ? 'is-current' : ''}" onclick="ViaticosModule.selectQuickStatus(${r.id}, '${opt.name}')" title="Marcar como ${opt.name}">
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
            <span class="status-picker-tag">📍 ${escHtml(r.destino || 'Destino no especificado')}</span>
            <span class="status-picker-tag">📅 ${escHtml(r.fechaInicio || '—')} (${r.dias || 1} días)</span>
            <span class="status-picker-tag">💰 ${formatCOP(r.valorTotal)}</span>
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
          <label class="form-label">Observación / Nota de Gestión (Opcional)</label>
          <input id="quick-status-obs" class="form-input form-input--no-icon" placeholder="Ej: Aprobado según soporte / resolución presentada..." value="${escHtml(r.observaciones || '')}" />
        </div>
      </div>`;

    App.openModal('Gestión Rápida de Estado', bodyHtml, [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
    ]);
  }

  async function selectQuickStatus(id, newStatus) {
    const obs = document.getElementById('quick-status-obs')?.value.trim();
    try {
      await API.updateViaticoStatus(id, newStatus, obs);
      App.closeModal();
      App.showToast(`Estado de viático actualizado a "${newStatus}".`, 'success');
      await load();
      loadStats();
    } catch (err) {
      App.showToast(err.message || 'Error al cambiar estado.', 'error');
    }
  }

  function loadStats() {
    API.getViaticosStats().then(s => {
      const strip = document.getElementById('vit-stats-strip');
      if (!strip) return;
      strip.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon stat-icon--gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="stat-info"><span class="stat-value">${parseInt(s.total)||0}</span><span class="stat-label">Viáticos Totales</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--orange"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="stat-info"><span class="stat-value">${parseInt(s.pendientes)||0}</span><span class="stat-label">Pendientes</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="stat-info"><span class="stat-value" style="font-size:var(--text-xl)">${formatCOP(s.valor_aprobado)}</span><span class="stat-label">Total Aprobado</span></div>
        </div>`;
    }).catch(() => {});
  }

  function confirmDelete(id, nombre) {
    App.openModal('Confirmar Eliminación', `<p style="color:var(--text-secondary)">¿Eliminar el viático de <strong style="color:var(--text-primary)">${nombre}</strong>?</p>`, [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
      { text: 'Eliminar', cls: 'btn-danger', action: async () => {
        try { await API.deleteViatico(id); App.closeModal(); App.showToast('Viático eliminado.','success'); await load(); loadStats(); }
        catch (err) { App.showToast(err.message,'error'); }
      }},
    ]);
  }

  function applyFilters() {
    state.page = 1;
    state.filters = {
      q: document.getElementById('vit-q')?.value.trim() || '',
      estado: document.getElementById('vit-estado')?.value || '',
    };
    load();
  }
  function clearFilters() {
    ['vit-q','vit-estado'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    state.filters = {}; state.page = 1; load();
  }
  function goPage(p) { if (p < 1 || p > state.totalPages) return; state.page = p; load(); }

  async function render(container) {
    container.innerHTML = `
      <div class="module-enter">
        <div class="page-header">
          <div class="page-header-info">
            <h1 class="page-heading">Viáticos</h1>
            <p class="page-desc">Gestión de solicitudes y aprobaciones de viáticos del personal institucional</p>
          </div>
          <div class="page-actions">
            ${Auth.canEdit() ? `<button class="btn btn-primary" onclick="ViaticosModule.openCreate()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo Viático
            </button>` : ''}
          </div>
        </div>

        <div id="vit-stats-strip" class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:var(--space-5)">
          <div class="stat-card skeleton" style="height:80px"></div>
          <div class="stat-card skeleton" style="height:80px"></div>
          <div class="stat-card skeleton" style="height:80px"></div>
        </div>

        <div class="filters-card">
          <div class="filters-row">
            <div class="filter-group" style="flex:2">
              <label class="filter-label">Buscar</label>
              <input id="vit-q" class="filter-input" placeholder="Nombre, cédula, destino..." />
            </div>
            <div class="filter-group">
              <label class="filter-label">Estado</label>
              <select id="vit-estado" class="filter-select">
                ${ESTADOS.map(s => `<option>${s}</option>`).join('')}
              </select>
            </div>
            <button class="btn btn-primary" onclick="ViaticosModule.applyFilters()">Filtrar</button>
            <button class="btn btn-secondary" onclick="ViaticosModule.clearFilters()">Limpiar</button>
          </div>
        </div>

        <div class="table-card">
          <div class="table-header">
            <span class="table-title">Registro de Viáticos</span>
            <span class="table-count" id="vit-count">Cargando...</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th>Radicado</th><th>Servidor</th><th>Dependencia</th><th>Destino</th>
                <th>Fecha Inicio</th><th>Días</th><th>Valor Total</th><th>Estado</th><th>Acciones</th>
              </tr></thead>
              <tbody id="vit-tbody"><tr><td colspan="9"><div class="empty-state loading-pulse">Cargando...</div></td></tr></tbody>
            </table>
          </div>
          <div class="pagination" id="vit-pagination"></div>
        </div>
      </div>`;

    document.getElementById('vit-q')?.addEventListener('keypress', e => { if (e.key === 'Enter') applyFilters(); });

    loadStats();
    state.page = 1; state.filters = {};
    await load();
  }

  return { render, openCreate, openEdit, openStatusPicker, selectQuickStatus, confirmDelete, applyFilters, clearFilters, goPage, calcTotal };
})();
