/* ═══════════════════════════════════════════════════════════════════════════
   employees.js — Servidores / Perfiles module
   ═══════════════════════════════════════════════════════════════════════════ */

const EmployeesModule = (() => {
  let state = { data: [], total: 0, page: 1, totalPages: 1, q: '', departments: [], cargos: [] };

  function badgeSex(s) {
    if (!s) return '';
    const v = s.toUpperCase();
    if (v.includes('FEMEN') || v === 'F') return '<span class="badge badge--licencia">Femenino</span>';
    if (v.includes('MASCU') || v === 'M') return '<span class="badge badge--revision">Masculino</span>';
    return `<span class="badge badge--pendiente">${s}</span>`;
  }

  async function load() {
    try {
      const res = await API.getEmployees({ q: state.q, page: state.page, limit: 25 });
      state.data = res.data || [];
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
    tbody.innerHTML = state.data.map(e => `
      <tr>
        <td class="td-primary" title="${e.nombreCompleto}">${e.nombreCompleto || '—'}</td>
        <td>${e.cedula || '—'}</td>
        <td title="${e.dependencia}">${truncate(e.dependencia, 30) || '—'}</td>
        <td title="${e.cargoActual}">${truncate(e.cargoActual, 28) || '—'}</td>
        <td>${e.correo || '—'}</td>
        <td>${badgeSex(e.sexo)}</td>
        <td class="td-actions">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="EmployeesModule.openEdit('${e.cedula}')" title="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          ${Auth.canEdit() ? `<button class="btn btn-danger btn-sm btn-icon" onclick="EmployeesModule.confirmDelete('${e.cedula}','${escHtml(e.nombreCompleto)}')" title="Eliminar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>` : ''}
        </td>
      </tr>`).join('');
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

  function openCreate() {
    App.openModal('Nuevo Servidor', buildForm(), [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
      { text: 'Guardar', cls: 'btn-primary', id: 'emp-save-btn', action: saveCreate },
    ]);
    loadCatalogs();
  }

  async function openEdit(cedula) {
    const emp = state.data.find(e => e.cedula === cedula);
    if (!emp) return;
    App.openModal('Editar Servidor', buildForm(emp), [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
      { text: 'Actualizar', cls: 'btn-gold', id: 'emp-save-btn', action: () => saveEdit(cedula) },
    ]);
    await loadCatalogs();
    if (emp.dependencia) { const sel = document.getElementById('ef-dep'); if (sel) sel.value = emp.dependencia; }
    if (emp.cargoActual) { const sel = document.getElementById('ef-cargo'); if (sel) sel.value = emp.cargoActual; }
  }

  function buildForm(emp = {}) {
    const r = Auth.canEdit();
    const dis = r ? '' : 'disabled';
    return `
      <div class="form-grid">
        <div class="form-group span-2">
          <label class="form-label" for="ef-nombre">Nombre Completo *</label>
          <input id="ef-nombre" class="form-input" placeholder="APELLIDO1 APELLIDO2 NOMBRE1 NOMBRE2" value="${escHtml(emp.nombreCompleto||'')}" ${dis} required />
        </div>
        <div class="form-group">
          <label class="form-label" for="ef-cedula">Cédula *</label>
          <input id="ef-cedula" class="form-input" placeholder="Número de cédula" value="${escHtml(emp.cedula||'')}" ${emp.cedula ? 'disabled' : dis} required />
        </div>
        <div class="form-group">
          <label class="form-label">Sexo</label>
          <select id="ef-sexo" class="filter-select" ${dis}>
            <option value="">Seleccionar...</option>
            <option ${emp.sexo?.includes('FEMEN') ? 'selected' : ''}>FEMENINO</option>
            <option ${emp.sexo?.includes('MASCU') ? 'selected' : ''}>MASCULINO</option>
          </select>
        </div>
        <div class="form-group span-2">
          <label class="form-label">Dependencia</label>
          <select id="ef-dep" class="filter-select" ${dis}>
            <option value="${escHtml(emp.dependencia||'')}">${escHtml(emp.dependencia||'Cargando...')}</option>
          </select>
        </div>
        <div class="form-group span-2">
          <label class="form-label">Cargo Actual</label>
          <select id="ef-cargo" class="filter-select" ${dis}>
            <option value="${escHtml(emp.cargoActual||'')}">${escHtml(emp.cargoActual||'Cargando...')}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Correo Institucional</label>
          <input id="ef-correo" class="form-input" type="email" placeholder="correo@boyaca.gov.co" value="${escHtml(emp.correo||'')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Celular</label>
          <input id="ef-celular" class="form-input" placeholder="3XX XXX XXXX" value="${escHtml(emp.celular||'')}" ${dis} />
        </div>
        <div class="form-group">
          <label class="form-label">Fecha de Ingreso</label>
          <input id="ef-fecha" class="form-input" placeholder="DD/MM/AAAA" value="${escHtml(emp.fechaIngreso||'')}" ${dis} />
        </div>
      </div>`;
  }

  async function loadCatalogs() {
    if (state.departments.length && state.cargos.length) {
      populateCatalogs();
      return;
    }
    try {
      const cats = await API.getEmployeeCatalogs();
      state.departments = cats.departamentos || [];
      state.cargos = cats.cargos || [];
      populateCatalogs();
    } catch {}
  }

  function populateCatalogs() {
    const depSel = document.getElementById('ef-dep');
    const cargoSel = document.getElementById('ef-cargo');
    if (depSel && state.departments.length) {
      const curVal = depSel.value;
      depSel.innerHTML = '<option value="">Seleccionar dependencia...</option>' +
        state.departments.map(d => `<option ${d === curVal ? 'selected' : ''}>${escHtml(d)}</option>`).join('');
      if (curVal) depSel.value = curVal;
    }
    if (cargoSel && state.cargos.length) {
      const curVal = cargoSel.value;
      cargoSel.innerHTML = '<option value="">Seleccionar cargo...</option>' +
        state.cargos.map(c => `<option ${c === curVal ? 'selected' : ''}>${escHtml(c)}</option>`).join('');
      if (curVal) cargoSel.value = curVal;
    }
  }

  async function saveCreate() {
    const body = readForm();
    if (!body) return;
    const btn = document.getElementById('emp-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
    try {
      await API.createEmployee(body);
      App.closeModal();
      App.showToast('Servidor creado exitosamente.', 'success');
      await load();
    } catch (err) {
      App.showToast(err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Guardar'; }
    }
  }

  async function saveEdit(cedula) {
    const body = readForm();
    if (!body) return;
    const btn = document.getElementById('emp-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Actualizando...'; }
    try {
      await API.updateEmployee(cedula, body);
      App.closeModal();
      App.showToast('Servidor actualizado.', 'success');
      await load();
    } catch (err) {
      App.showToast(err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Actualizar'; }
    }
  }

  function readForm() {
    const nombre = document.getElementById('ef-nombre')?.value.trim();
    const cedula = document.getElementById('ef-cedula')?.value.trim();
    if (!nombre || !cedula) { App.showToast('Nombre y cédula son requeridos.', 'warning'); return null; }
    return {
      nombreCompleto: nombre, cedula,
      dependencia: document.getElementById('ef-dep')?.value || '',
      cargoActual: document.getElementById('ef-cargo')?.value || '',
      correo: document.getElementById('ef-correo')?.value.trim() || '',
      celular: document.getElementById('ef-celular')?.value.trim() || '',
      sexo: document.getElementById('ef-sexo')?.value || '',
      fechaIngreso: document.getElementById('ef-fecha')?.value.trim() || '',
    };
  }

  function confirmDelete(cedula, nombre) {
    App.openModal('Confirmar Eliminación', `<p style="color:var(--text-secondary)">¿Está seguro de eliminar al servidor <strong style="color:var(--text-primary)">${nombre}</strong>?<br><br>Esta acción no se puede deshacer.</p>`, [
      { text: 'Cancelar', cls: 'btn-secondary', action: () => App.closeModal() },
      { text: 'Eliminar', cls: 'btn-danger', action: async () => {
        try {
          await API.deleteEmployee(cedula);
          App.closeModal();
          App.showToast('Servidor eliminado.', 'success');
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

  async function render(container) {
    container.innerHTML = `
      <div class="module-enter">
        <div class="page-header">
          <div class="page-header-info">
            <h1 class="page-heading">Servidores Públicos</h1>
            <p class="page-desc">Gestión de perfiles del talento humano vinculado a la Gobernación de Boyacá</p>
          </div>
          <div class="page-actions">
            ${Auth.canEdit() ? `<button class="btn btn-primary" onclick="EmployeesModule.openCreate()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo Servidor
            </button>` : ''}
          </div>
        </div>

        <div class="filters-card">
          <div class="filters-row">
            <div class="filter-group" style="flex:2;min-width:240px">
              <label class="filter-label">Buscar</label>
              <input id="emp-search" class="filter-input" placeholder="Buscar por nombre, cédula, dependencia..." />
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
            <span class="table-title">Lista de Servidores</span>
            <span class="table-count" id="emp-count">Cargando...</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Cédula</th>
                  <th>Dependencia</th>
                  <th>Cargo Actual</th>
                  <th>Correo</th>
                  <th>Sexo</th>
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

  return { render, openCreate, openEdit, confirmDelete, goPage, search, clearSearch };
})();
