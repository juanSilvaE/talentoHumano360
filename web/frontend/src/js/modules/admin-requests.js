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

  function setTipo(tipo, activeBtn) {
    state.tipo = tipo; state.page = 1; state.filters = {};
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
    // Update section heading
    const heading = document.getElementById('adm-heading');
    if (heading) heading.textContent = tipo + 's';
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
        <td><span class="badge ${badgeClass(r.estado)}">${r.estado}</span></td>
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
            <h1 class="page-heading" id="adm-heading">Gestión de Solicitudes Administrativas</h1>
            <p class="page-desc">Administre permisos laborales, incapacidades y licencias del personal</p>
          </div>
          <div class="page-actions">
            ${Auth.canEdit() ? `<button class="btn btn-primary" onclick="AdminRequestsModule.openCreate()">
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
            <span class="table-title" id="adm-table-title">${tipoLabel}s</span>
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

  return { render, openCreate, openEdit, confirmDelete, applyFilters, clearFilters, goPage, setTipo };
})();
