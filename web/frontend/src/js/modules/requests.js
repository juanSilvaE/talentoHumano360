/* ═══════════════════════════════════════════════════════════════════════════
   requests.js — Vacaciones module
   ═══════════════════════════════════════════════════════════════════════════ */

const RequestsModule = (() => {
  let state = { data: [], total: 0, page: 1, totalPages: 1, filters: {} };

  const ESTADOS = ['Todos', 'Pendiente', 'En revisión', 'Aprobada', 'Finalizada', 'Rechazada'];
  const TIPOS = ['Vacaciones', 'Permiso', 'Incapacidad', 'Licencia maternidad'];

  function badgeClass(estado) {
    const e = (estado || '').toLowerCase();
    if (e.includes('aprobad'))  return 'badge--aprobada';
    if (e.includes('finaliz'))  return 'badge--finalizada';
    if (e.includes('rechazad')) return 'badge--rechazada';
    if (e.includes('revis'))    return 'badge--revision';
    return 'badge--pendiente';
  }

  async function load() {
    try {
      const params = { page: state.page, limit: 20, ...state.filters };
      const res = await API.getRequests(params);
      state.data = res.data || [];
      state.total = res.total || 0;
      state.totalPages = res.totalPages || 1;
      renderTable();
      renderPagination();
    } catch (err) {
      App.showToast('Error al cargar solicitudes: ' + err.message, 'error');
    }
  }

  function renderTable() {
    const tbody = document.getElementById('req-tbody');
    if (!tbody) return;
    if (!state.data.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span class="empty-state-title">No hay solicitudes</span>
        <span class="empty-state-desc">No se encontraron solicitudes con los filtros aplicados.</span>
        </div></td></tr>`;
      return;
    }
    tbody.innerHTML = state.data.map(r => `
      <tr>
        <td class="td-radicado">${r.radicado}</td>
        <td class="td-primary" title="${r.persona}">${truncate(r.persona, 28) || '—'}</td>
        <td title="${r.dependencia}">${truncate(r.dependencia, 28) || '—'}</td>
        <td><span class="badge badge--revision">${r.tipo}</span></td>
        <td>${r.fechaInicio || '—'}</td>
        <td>${r.diasTotales || '—'}</td>
        <td><span class="badge ${badgeClass(r.estado)}">${r.estado}</span></td>
        <td class="td-actions">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="RequestsModule.openEdit(${r.id})" title="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          ${Auth.canEdit() ? `<button class="btn btn-danger btn-sm btn-icon" onclick="RequestsModule.confirmDelete(${r.id},'${escHtml(r.persona)}')" title="Eliminar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>` : ''}
        </td>
      </tr>`).join('');
  }

  function renderPagination() {
    const el = document.getElementById('req-pagination');
    if (!el) return;
    el.innerHTML = `
      <span class="pagination-info">Mostrando ${state.data.length} de ${state.total.toLocaleString('es-CO')} solicitudes</span>
      <div class="pagination-btns">
        <button class="page-btn" onclick="RequestsModule.goPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="page-btn active">${state.page}</span>
        <span style="color:var(--text-muted);font-size:var(--text-sm)">/ ${state.totalPages}</span>
        <button class="page-btn" onclick="RequestsModule.goPage(${state.page + 1})" ${state.page >= state.totalPages ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>`;
  }

  function openCreate() {
    App.openModal('Nueva Solicitud de Vacaciones', buildForm(), [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
      { text: 'Crear Solicitud', cls: 'btn-primary', id: 'req-save-btn', action: saveCreate },
    ]);
  }

  function openEdit(id) {
    const r = state.data.find(x => x.id === id);
    if (!r) return;
    App.openModal('Editar Solicitud', buildForm(r), [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
      { text: 'Actualizar', cls: 'btn-gold', id: 'req-save-btn', action: () => saveEdit(id) },
    ]);
  }

  function buildForm(r = {}) {
    const dis = Auth.canEdit() ? '' : 'disabled';
    return `
      <div class="form-grid">
        <div class="form-group span-2">
          <label class="form-label">Nombre Completo *</label>
          <input id="rf-nombre" class="form-input" placeholder="APELLIDO APELLIDO NOMBRE..." value="${escHtml(r.persona||'')}" ${dis} required />
        </div>
        <div class="form-group">
          <label class="form-label">Documento</label>
          <input id="rf-doc" class="form-input" placeholder="Número de cédula" value="${escHtml(r.documento||'')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select id="rf-tipo" class="filter-select" ${dis}>
            ${TIPOS.map(t => `<option ${r.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group span-2">
          <label class="form-label">Dependencia</label>
          <input id="rf-dep" class="form-input" placeholder="Secretaría / Dependencia..." value="${escHtml(r.dependencia||'')}" ${dis} />
        </div>
        <div class="form-group span-2">
          <label class="form-label">Cargo</label>
          <input id="rf-cargo" class="form-input" placeholder="Cargo del servidor..." value="${escHtml(r.cargo||'')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Fecha Inicio</label>
          <input id="rf-fecha" class="form-input" placeholder="DD/MM/AAAA" value="${escHtml(r.fechaInicio||'')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Días Totales</label>
          <input id="rf-dias" class="form-input" type="number" min="1" value="${escHtml(r.diasTotales||'1')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Periodos</label>
          <input id="rf-periodos" class="form-input" placeholder="Ej: 2024-2025" value="${escHtml(r.periodos||'')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select id="rf-estado" class="filter-select" ${dis}>
            ${ESTADOS.filter(s => s !== 'Todos').map(s => `<option ${r.estado === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group span-2">
          <label class="form-label">Observaciones</label>
          <input id="rf-obs" class="form-input" placeholder="Notas u observaciones..." value="${escHtml(r.observaciones||'')}" ${dis} />
        </div>
        ${r.id ? `<div class="form-group span-2">
          <label class="form-label">Nota de Gestión</label>
          <input id="rf-nota" class="form-input" placeholder="Nota del coordinador..." value="" ${dis} />
        </div>` : ''}
      </div>`;
  }

  async function saveCreate() {
    const body = readForm();
    if (!body) return;
    const btn = document.getElementById('req-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
    try {
      const res = await API.createRequest(body);
      App.closeModal();
      App.showToast(`Solicitud creada. Radicado: ${res.radicado || ''}`, 'success');
      await load();
    } catch (err) {
      App.showToast(err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Crear Solicitud'; }
    }
  }

  async function saveEdit(id) {
    const body = readForm(true);
    if (!body) return;
    const btn = document.getElementById('req-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Actualizando...'; }
    try {
      await API.updateRequest(id, body);
      App.closeModal();
      App.showToast('Solicitud actualizada.', 'success');
      await load();
    } catch (err) {
      App.showToast(err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Actualizar'; }
    }
  }

  function readForm(withNota = false) {
    const nombre = document.getElementById('rf-nombre')?.value.trim();
    const doc    = document.getElementById('rf-doc')?.value.trim();
    const dep    = document.getElementById('rf-dep')?.value.trim();
    const fecha  = document.getElementById('rf-fecha')?.value.trim();
    if (!nombre) { App.showToast('El nombre es requerido.', 'warning'); return null; }
    const body = {
      persona: nombre, documento: doc, dependencia: dep,
      cargo: document.getElementById('rf-cargo')?.value.trim(),
      fechaInicio: fecha, diasTotales: parseInt(document.getElementById('rf-dias')?.value) || 1,
      periodos: document.getElementById('rf-periodos')?.value.trim(),
      tipo: document.getElementById('rf-tipo')?.value,
      estado: document.getElementById('rf-estado')?.value || 'Pendiente',
      estadoInicial: document.getElementById('rf-estado')?.value || 'Pendiente',
      observaciones: document.getElementById('rf-obs')?.value.trim(),
    };
    if (withNota) body.notaGestion = document.getElementById('rf-nota')?.value.trim() || '';
    return body;
  }

  function confirmDelete(id, nombre) {
    App.openModal('Confirmar Eliminación', `<p style="color:var(--text-secondary)">¿Eliminar la solicitud de <strong style="color:var(--text-primary)">${nombre}</strong>?<br><br>Esta acción no se puede deshacer.</p>`, [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
      { text: 'Eliminar', cls: 'btn-danger', action: async () => {
        try {
          await API.deleteRequest(id);
          App.closeModal();
          App.showToast('Solicitud eliminada.', 'success');
          await load();
        } catch (err) { App.showToast(err.message, 'error'); }
      }},
    ]);
  }

  function applyFilters() {
    state.page = 1;
    state.filters = {
      q: document.getElementById('req-q')?.value.trim() || '',
      estado: document.getElementById('req-estado')?.value || '',
    };
    load();
  }
  function clearFilters() {
    ['req-q','req-estado'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    state.filters = {}; state.page = 1;
    load();
  }
  function goPage(p) { if (p < 1 || p > state.totalPages) return; state.page = p; load(); }

  async function render(container) {
    container.innerHTML = `
      <div class="module-enter">
        <div class="page-header">
          <div class="page-header-info">
            <h1 class="page-heading">Solicitudes de Vacaciones</h1>
            <p class="page-desc">Gestión de solicitudes de vacaciones del personal de la Gobernación de Boyacá</p>
          </div>
          <div class="page-actions">
            ${Auth.canEdit() ? `<button class="btn btn-primary" onclick="RequestsModule.openCreate()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nueva Solicitud
            </button>` : ''}
          </div>
        </div>

        <div class="filters-card">
          <div class="filters-row">
            <div class="filter-group" style="flex:2">
              <label class="filter-label">Buscar</label>
              <input id="req-q" class="filter-input" placeholder="Nombre, cédula, radicado..." />
            </div>
            <div class="filter-group">
              <label class="filter-label">Estado</label>
              <select id="req-estado" class="filter-select">
                ${ESTADOS.map(s => `<option>${s}</option>`).join('')}
              </select>
            </div>
            <button class="btn btn-primary" onclick="RequestsModule.applyFilters()">Filtrar</button>
            <button class="btn btn-secondary" onclick="RequestsModule.clearFilters()">Limpiar</button>
          </div>
        </div>

        <div class="table-card">
          <div class="table-header">
            <span class="table-title">Solicitudes de Vacaciones</span>
            <span class="table-count" id="req-count">Cargando...</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th>Radicado</th><th>Servidor</th><th>Dependencia</th>
                <th>Tipo</th><th>Fecha Inicio</th><th>Días</th><th>Estado</th><th>Acciones</th>
              </tr></thead>
              <tbody id="req-tbody"><tr><td colspan="8"><div class="empty-state loading-pulse">Cargando...</div></td></tr></tbody>
            </table>
          </div>
          <div class="pagination" id="req-pagination"></div>
        </div>
      </div>`;

    document.getElementById('req-q')?.addEventListener('keypress', e => { if (e.key === 'Enter') applyFilters(); });
    state.page = 1; state.filters = {};
    await load();
    const countEl = document.getElementById('req-count');
    if (countEl) countEl.textContent = `${state.total.toLocaleString('es-CO')} registros`;
  }

  return { render, openCreate, openEdit, confirmDelete, applyFilters, clearFilters, goPage };
})();
