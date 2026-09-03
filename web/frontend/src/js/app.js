/* ═══════════════════════════════════════════════════════════════════════════
   app.js — SPA Router, Login handler, Global utilities
   ═══════════════════════════════════════════════════════════════════════════ */

const App = (() => {

  // ─── Toast System ──────────────────────────────────────────────────────────
  function showToast(message, type = 'info') {
    if (typeof Settings !== 'undefined' && !Settings.isNotificationTypeEnabled(type)) {
      return;
    }
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
    container.appendChild(toast);

    // FX: animate toast in with sound
    if (typeof FX !== 'undefined') FX.animateToastIn(toast, type);

    setTimeout(() => {
      if (typeof FX !== 'undefined') {
        FX.animateToastOut(toast, () => toast.remove());
      } else {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  }

  // ─── Modal System ──────────────────────────────────────────────────────────
  function openModal(title, bodyHtml, footerButtons = []) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');
    const box = document.querySelector('.modal-box');
    if (!overlay || !titleEl || !bodyEl || !footerEl) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    footerEl.innerHTML = '';
    footerButtons.forEach(btn => {
      const el = document.createElement('button');
      el.className = `btn ${btn.cls || 'btn-secondary'}`;
      if (btn.id) el.id = btn.id;
      el.textContent = btn.text;
      el.onclick = btn.action;
      footerEl.appendChild(el);
    });

    overlay.style.display = 'flex';
    overlay.style.opacity = '0';
    document.body.style.overflow = 'hidden';

    // FX: animated modal open
    if (typeof FX !== 'undefined') {
      FX.animateModalOpen(overlay, box);
    } else {
      overlay.style.opacity = '1';
    }
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    const box = document.querySelector('.modal-box');
    if (!overlay) return;

    if (typeof FX !== 'undefined') {
      FX.animateModalClose(overlay, box, () => {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
      });
    } else {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  // ─── Navigation ────────────────────────────────────────────────────────────
  const MODULE_TITLES = {
    dashboard: 'Dashboard',
    employees: 'Servidores Públicos',
    requests: 'Solicitudes de Vacaciones',
    'admin-requests': 'Gestión de Solicitudes Administrativas',
    viaticos: 'Viáticos',
    settings: 'Configuración',
  };

  async function navigate(module, options = {}) {
    const container = document.getElementById('module-container');
    const pageTitle = document.getElementById('page-title');
    if (!container) return;

    // Update active nav
    document.querySelectorAll('.nav-item:not(.nav-subitem), .sidebar-settings-btn').forEach(b => {
      b.classList.remove('active');
      b.removeAttribute('aria-current');
    });
    document.querySelectorAll('.nav-subitem').forEach(b => {
      b.classList.remove('active');
      b.removeAttribute('aria-current');
    });
    const navBtn = document.getElementById(`nav-${module}`);
    if (navBtn) {
      navBtn.classList.add('active');
      navBtn.setAttribute('aria-current', 'page');
    }

    if (pageTitle) pageTitle.textContent = MODULE_TITLES[module] || module;
    document.title = `${MODULE_TITLES[module] || module} — Talento 360`;

    // FX: page transition
    if (typeof FX !== 'undefined') {
      FX.animatePageTransition(container, async () => {
        switch (module) {
          case 'dashboard':      await DashboardModule.render(container); break;
          case 'employees':     await EmployeesModule.render(container); break;
          case 'requests':      await RequestsModule.render(container); break;
          case 'admin-requests': {
            const tipoKey = options.tipo || 'permisos';
            await AdminRequestsModule.render(container, tipoKey);
            const subnavMap = { permisos: 'nav-permisos', incapacidades: 'nav-incapacidades', licencias: 'nav-licencias' };
            const activeSubBtn = document.getElementById(subnavMap[tipoKey] || 'nav-permisos');
            if (activeSubBtn) activeSubBtn.classList.add('active');
            expandAdminGroup();
            break;
          }
          case 'viaticos':      await ViaticosModule.render(container); break;
          case 'settings':
            if (typeof SettingsModule !== 'undefined') await SettingsModule.render(container);
            break;
          default:
            container.innerHTML = `<div class="module-enter"><p style="color:var(--text-muted)">Módulo no encontrado.</p></div>`;
        }
        FX.onModuleRendered(container);
        container.scrollTop = 0;
      });
    } else {
      // Render module (no FX)
      switch (module) {
        case 'dashboard':      await DashboardModule.render(container); break;
        case 'employees':     await EmployeesModule.render(container); break;
        case 'requests':      await RequestsModule.render(container); break;
        case 'admin-requests': {
          const tipoKey = options.tipo || 'permisos';
          await AdminRequestsModule.render(container, tipoKey);
          const subnavMap = { permisos: 'nav-permisos', incapacidades: 'nav-incapacidades', licencias: 'nav-licencias' };
          const activeSubBtn = document.getElementById(subnavMap[tipoKey] || 'nav-permisos');
          if (activeSubBtn) activeSubBtn.classList.add('active');
          expandAdminGroup();
          break;
        }
        case 'viaticos':      await ViaticosModule.render(container); break;
        case 'settings':
          if (typeof SettingsModule !== 'undefined') await SettingsModule.render(container);
          break;
        default:
          container.innerHTML = `<div class="module-enter"><p style="color:var(--text-muted)">Módulo no encontrado.</p></div>`;
      }
      container.scrollTop = 0;
    }
  }

  function expandAdminGroup() {
    const toggle = document.getElementById('nav-admin-group');
    const menu = document.getElementById('admin-submenu');
    if (toggle && menu) {
      toggle.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
    }
  }

  // ─── Login & App Views ──────────────────────────────────────────────────────
  function showLogin() {
    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    const err = document.getElementById('login-error');
    if (uInput) uInput.value = '';
    if (pInput) pInput.value = '';
    if (err) {
      err.textContent = '';
      err.classList.remove('visible');
    }

    // Clean neutral theme on the public login page
    if (typeof Settings !== 'undefined') {
      Settings.resetToDefaults();
    }

    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    // Re-trigger login animation when returning to login
    requestAnimationFrame(() => {
      if (typeof FX !== 'undefined') FX.animateLoginIn();
    });
  }

  // ─── Avatar Palettes (Solid Colors) ──────────────────────────────────────────
  const AVATAR_PALETTES = [
    { id: 'red', name: 'Rojo Institucional', bg: '#E32431' },
    { id: 'blue', name: 'Azul Gobernación', bg: '#005387' },
    { id: 'cyan', name: 'Azul Claro', bg: '#007BC7' },
    { id: 'teal', name: 'Verde Azulado (Teal)', bg: '#1D8096' },
    { id: 'amber', name: 'Ámbar Cálido', bg: '#D97706' },
    { id: 'mustard', name: 'Amarillo Mostaza', bg: '#D1AD2A' },
    { id: 'pink', name: 'Fucsia Institucional', bg: '#CF3A78' },
    { id: 'purple', name: 'Púrpura Andino', bg: '#B84BA7' },
    { id: 'plum', name: 'Ciruela', bg: '#914169' },
    { id: 'forest', name: 'Verde Bosque', bg: '#287522' },
  ];

  let currentAvatarColor = null;

  function getAvatarColor(username) {
    const key = `talento360_avatar_color_${username || 'default'}`;
    const legacyKey = `humano360_avatar_color_${username || 'default'}`;
    let saved = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    if (saved) {
      if (saved.includes('linear-gradient')) {
        const hexMatch = saved.match(/#[0-9a-fA-F]{3,8}/);
        if (hexMatch && hexMatch[0].toLowerCase() !== '#1b5e20' && hexMatch[0].toLowerCase() !== '#287522') {
          saved = hexMatch[0];
        } else {
          saved = AVATAR_PALETTES[0].bg;
        }
        localStorage.setItem(key, saved);
      }
      return saved;
    }
    return AVATAR_PALETTES[0].bg;
  }

  function setAvatarColor(username, color) {
    const key = `talento360_avatar_color_${username || 'default'}`;
    localStorage.setItem(key, color);
  }

  function sanitizeRole(role) {
    if (!role) return 'Administrador';
    const r = String(role).trim();
    if (r.toLowerCase() === 'administradora' || r.toLowerCase() === 'administrador') {
      return 'Administrador';
    }
    return r;
  }

  function resolveJobTitle(user = {}) {
    if (user.jobTitle && String(user.jobTitle).trim()) {
      return String(user.jobTitle).trim();
    }
    const username = String(user.username || '').toLowerCase();
    const name = String(user.name || '').toLowerCase();
    if (username.includes('angela') || name.includes('angela') || name.includes('ussa')) {
      return 'Directora de Talento Humano';
    }
    if (username.includes('carlos') || name.includes('carlos')) {
      return 'Coordinador de Solicitudes';
    }
    if (username.includes('maria') || name.includes('maria')) {
      return 'Analista de Talento Humano';
    }
    return '';
  }

  function showApp() {
    const user = Auth.getUser();
    // Load per-user personalized preferences (theme, font, sound, etc.)
    if (typeof Settings !== 'undefined' && user && user.username) {
      Settings.loadForUser(user.username);
    }
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'grid';
    updateUserDisplay(user);
    // FX: animate app entry
    if (typeof FX !== 'undefined') {
      FX.animateAppEnter();
      setTimeout(() => FX.Sound.loginSuccess(), 100);
    }
  }

  function updateUserDisplay(user = {}) {
    const name = user.name || 'Angela Ussa';
    const role = sanitizeRole(user.role || 'Administrador');
    const jobTitle = resolveJobTitle(user);
    const initial = name.charAt(0).toUpperCase();
    const avatarColor = getAvatarColor(user.username);

    // Sidebar
    const nameEl = document.getElementById('user-name');
    const jobTitleEl = document.getElementById('user-job-title');
    const roleEl = document.getElementById('user-role');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = name;
    if (jobTitleEl) {
      if (jobTitle) {
        jobTitleEl.textContent = jobTitle;
        jobTitleEl.style.display = 'block';
      } else {
        jobTitleEl.textContent = '';
        jobTitleEl.style.display = 'none';
      }
    }
    if (roleEl) roleEl.textContent = role;
    if (avatarEl) {
      avatarEl.textContent = initial;
      avatarEl.style.background = avatarColor;
      // FX: avatar pop
      if (typeof FX !== 'undefined') FX.animateAvatarUpdate();
    }

    // Topbar
    const topNameEl = document.getElementById('topbar-user-name');
    const topRoleEl = document.getElementById('topbar-role-badge');
    const topAvatarEl = document.getElementById('topbar-avatar');
    if (topNameEl) topNameEl.textContent = name;
    if (topRoleEl) topRoleEl.textContent = role === 'Administrador' ? 'Admin' : role;
    if (topAvatarEl) {
      topAvatarEl.textContent = initial;
      topAvatarEl.style.background = avatarColor;
    }
  }

  // ─── User Profile Modal ────────────────────────────────────────────────────
  function openProfileModal() {
    const user = Auth.getUser();
    const initial = (user.name || 'A').charAt(0).toUpperCase();
    currentAvatarColor = getAvatarColor(user.username);

    const swatchesHtml = AVATAR_PALETTES.map(p => {
      const isSelected = p.bg === currentAvatarColor;
      return `
        <button type="button" class="avatar-swatch ${isSelected ? 'active' : ''}" style="background:${p.bg};" data-bg="${p.bg}" title="${p.name}" aria-label="${p.name}">
          ${isSelected ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
        </button>`;
    }).join('');

    const bodyHtml = `
      <div class="profile-card-header">
        <div class="profile-avatar-large" id="prof-avatar-preview" style="background:${currentAvatarColor};">${initial}</div>
        <div class="profile-header-info">
          <div class="profile-name-display">${escHtml(user.name || 'Angela Ussa')}</div>
          <div class="profile-job-title">${escHtml(resolveJobTitle(user))}</div>
          <span class="profile-role-pill">${escHtml(sanitizeRole(user.role || 'Administrador'))}</span>
          <p class="profile-dept-subtitle">Gobernación de Boyacá · Talento Humano</p>
        </div>
      </div>

      <form id="profile-form" autocomplete="off" onsubmit="return false;" style="display:flex;flex-direction:column;gap:var(--space-4);">
        <!-- Avatar Color Customization -->
        <div class="avatar-color-section">
          <div class="profile-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"/></svg>
            <span>Color del Avatar</span>
          </div>
          <p class="avatar-color-subtitle">Selecciona un color institucional sólido o elige un tono personalizado:</p>
          <div class="avatar-swatches-grid" id="avatar-swatches-container">
            ${swatchesHtml}
            <div class="avatar-color-custom-btn" title="Elegir color personalizado">
              <input type="color" id="prof-custom-color" value="${(currentAvatarColor && currentAvatarColor.startsWith('#')) ? currentAvatarColor : '#E32431'}" aria-label="Color personalizado" />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Correo Institucional (No modificable)</label>
          <input type="text" class="form-input form-input--no-icon profile-readonly-input" value="${escHtml(user.username || '')}" readonly disabled tabindex="-1" autocomplete="off" />
          <div class="profile-readonly-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>El correo institucional es asignado por el sistema y no puede ser alterado.</span>
          </div>
        </div>

        <div class="form-group">
          <label for="prof-name" class="form-label">Nombre Completo *</label>
          <input type="text" id="prof-name" class="form-input form-input--no-icon" value="${escHtml(user.name || '')}" placeholder="Tu nombre y apellidos" autocomplete="name" required />
        </div>

        <div class="profile-password-section">
          <label class="profile-password-toggle-card" for="prof-change-pass-toggle">
            <div class="profile-password-toggle-left">
              <div class="profile-password-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div>
                <div class="profile-password-toggle-title">Cambiar Contraseña</div>
                <div class="profile-password-toggle-desc">Activa esta opción únicamente si deseas renovar tu clave de acceso</div>
              </div>
            </div>
            <input type="checkbox" id="prof-change-pass-toggle" class="profile-password-checkbox" />
          </label>

          <div id="prof-password-fields" class="profile-password-fields-container" style="display:none;">
            <p style="font-size:var(--text-xs);color:var(--text-muted);margin:0 0 4px 0;">Ingresa tu clave actual y define la nueva contraseña para tu cuenta.</p>
            <div class="form-group">
              <label for="prof-cur-pass" class="form-label">Contraseña Actual *</label>
              <input type="password" id="prof-cur-pass" class="form-input form-input--no-icon" placeholder="Ingresa tu contraseña actual" autocomplete="new-password" data-lpignore="true" disabled value="" />
            </div>
            <div class="form-group">
              <label for="prof-new-pass" class="form-label">Nueva Contraseña *</label>
              <input type="password" id="prof-new-pass" class="form-input form-input--no-icon" placeholder="Mínimo 4 caracteres" autocomplete="new-password" data-lpignore="true" disabled value="" />
            </div>
            <div class="form-group">
              <label for="prof-conf-pass" class="form-label">Confirmar Nueva Contraseña *</label>
              <input type="password" id="prof-conf-pass" class="form-input form-input--no-icon" placeholder="Repite la nueva contraseña" autocomplete="new-password" data-lpignore="true" disabled value="" />
            </div>
          </div>
        </div>
      </form>`;

    openModal('Mi Perfil', bodyHtml, [
      { text: 'Configuración', cls: 'btn-secondary', id: 'prof-settings-btn', action: () => { closeModal(); navigate('settings'); } },
      { text: 'Cancelar', cls: 'btn-secondary', action: () => closeModal() },
      { text: 'Guardar Cambios', cls: 'btn-primary', id: 'prof-save-btn', action: saveProfile },
    ]);

    // Password toggle handler
    const togglePass = document.getElementById('prof-change-pass-toggle');
    const passFields = document.getElementById('prof-password-fields');
    const passInputs = [
      document.getElementById('prof-cur-pass'),
      document.getElementById('prof-new-pass'),
      document.getElementById('prof-conf-pass')
    ];

    if (togglePass && passFields) {
      togglePass.addEventListener('change', () => {
        const active = togglePass.checked;
        passFields.style.display = active ? 'flex' : 'none';
        passInputs.forEach(input => {
          if (input) {
            input.disabled = !active;
            input.value = '';
          }
        });
        if (active && passInputs[0]) {
          passInputs[0].focus();
        }
        if (typeof FX !== 'undefined') FX.Sound.navClick();
      });
    }

    // Force clear any delayed browser autofill
    setTimeout(() => {
      passInputs.forEach(input => {
        if (input && !togglePass?.checked) {
          input.value = '';
        }
      });
    }, 60);

    // Swatch click handlers
    const swatchesContainer = document.getElementById('avatar-swatches-container');
    const previewAvatar = document.getElementById('prof-avatar-preview');

    if (swatchesContainer && previewAvatar) {
      swatchesContainer.querySelectorAll('.avatar-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
          const bg = btn.dataset.bg;
          currentAvatarColor = bg;
          previewAvatar.style.background = bg;

          // Update active swatch state
          swatchesContainer.querySelectorAll('.avatar-swatch').forEach(s => {
            s.classList.remove('active');
            s.innerHTML = '';
          });
          btn.classList.add('active');
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
        });
      });

      // Custom color picker handler (pure solid color)
      const customColorInput = document.getElementById('prof-custom-color');
      if (customColorInput) {
        customColorInput.addEventListener('input', (e) => {
          const hex = e.target.value;
          currentAvatarColor = hex;
          previewAvatar.style.background = hex;

          swatchesContainer.querySelectorAll('.avatar-swatch').forEach(s => {
            s.classList.remove('active');
            s.innerHTML = '';
          });
        });
      }
    }
  }

  async function saveProfile() {
    const user = Auth.getUser();
    const nombre = document.getElementById('prof-name')?.value.trim();
    const wantsChangePass = document.getElementById('prof-change-pass-toggle')?.checked;
    const curPass = document.getElementById('prof-cur-pass')?.value.trim() || '';
    const newPass = document.getElementById('prof-new-pass')?.value.trim() || '';
    const confPass = document.getElementById('prof-conf-pass')?.value.trim() || '';

    if (!nombre) {
      showToast('El nombre es requerido.', 'warning');
      return;
    }

    const payload = { nombre };

    if (wantsChangePass) {
      if (!curPass) {
        showToast('Debes ingresar tu contraseña actual para cambiarla.', 'warning');
        document.getElementById('prof-cur-pass')?.focus();
        return;
      }
      if (newPass.length < 4) {
        showToast('La nueva contraseña debe tener al menos 4 caracteres.', 'warning');
        document.getElementById('prof-new-pass')?.focus();
        return;
      }
      if (newPass !== confPass) {
        showToast('La nueva contraseña y su confirmación no coinciden.', 'warning');
        document.getElementById('prof-conf-pass')?.focus();
        return;
      }
      payload.currentPassword = curPass;
      payload.newPassword = newPass;
    }

    const btn = document.getElementById('prof-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    try {
      const res = await API.updateProfile(payload);
      Auth.save(res.token, res.user);

      // Save custom avatar color
      if (currentAvatarColor) {
        setAvatarColor(res.user.username, currentAvatarColor);
      }

      updateUserDisplay(res.user);
      closeModal();
      showToast('Perfil actualizado exitosamente.', 'success');
      if (typeof FX !== 'undefined') FX.successBurst(btn);
    } catch (err) {
      showToast(err.message || 'Error al actualizar perfil.', 'error');
      if (typeof FX !== 'undefined') FX.shakeElement(document.querySelector('.modal-box'));
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Guardar Cambios'; }
    }
  }

  // ─── Live Topbar Date & Time ───────────────────────────────────────────────
  function updateTopbarDateTime() {
    const dateEl = document.getElementById('topbar-date-text');
    const timeEl = document.getElementById('topbar-time-text');
    if (!dateEl && !timeEl) return;

    const now = new Date();
    if (dateEl) {
      const dayName = now.toLocaleDateString('es-CO', { weekday: 'long' });
      const capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      const monthName = now.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
      const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      dateEl.textContent = `${capDay}, ${now.getDate()} ${capMonth} ${now.getFullYear()}`;
    }
    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString('es-CO', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
    }
  }

  // ─── Quick Access Controls (Theme & Sound) ─────────────────────────────────
  function updateTopbarQuickControls() {
    const themeBtn = document.getElementById('topbar-theme-toggle');
    const soundBtn = document.getElementById('topbar-sound-toggle');

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (typeof Settings !== 'undefined' && Settings.get('theme') === 'dark');

    if (themeBtn) {
      if (isDark) {
        themeBtn.setAttribute('title', 'Modo Oscuro activo (clic para Modo Claro)');
        themeBtn.setAttribute('aria-label', 'Cambiar a Modo Claro');
        themeBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#f59e0b;">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>`;
      } else {
        themeBtn.setAttribute('title', 'Modo Claro activo (clic para Modo Oscuro)');
        themeBtn.setAttribute('aria-label', 'Cambiar a Modo Oscuro');
        themeBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#005387;">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>`;
      }
    }

    const isSoundOn = typeof Settings !== 'undefined' ? Settings.get('soundEnabled') !== false : true;
    if (soundBtn) {
      if (isSoundOn) {
        soundBtn.setAttribute('title', 'Efectos de sonido: Activados (clic para silenciar)');
        soundBtn.setAttribute('aria-label', 'Silenciar efectos de sonido');
        soundBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-teal);">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>`;
      } else {
        soundBtn.setAttribute('title', 'Efectos de sonido: Silenciados (clic para activar)');
        soundBtn.setAttribute('aria-label', 'Activar efectos de sonido');
        soundBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-red);">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/>
            <line x1="17" y1="9" x2="23" y2="15"/>
          </svg>`;
      }
    }
  }

  // ─── Init ──────────────────────────────────────────────────────────────────
  function init() {
    // Initialize system settings & preferences
    if (typeof Settings !== 'undefined') {
      Settings.init();
    }

    // Restore sidebar preference
    const isCollapsed = (localStorage.getItem('talento360_sidebar_collapsed') ?? localStorage.getItem('humano360_sidebar_collapsed')) === 'true';
    if (isCollapsed) {
      document.getElementById('app')?.classList.add('sidebar-collapsed');
    }

    // Topbar live date/time & quick controls
    updateTopbarDateTime();
    setInterval(updateTopbarDateTime, 1000);
    updateTopbarQuickControls();

    // Password toggle
    const toggleBtn = document.getElementById('toggle-password');
    const passInput = document.getElementById('login-password');
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');
    if (toggleBtn && passInput) {
      toggleBtn.addEventListener('click', () => {
        const isText = passInput.type === 'text';
        passInput.type = isText ? 'password' : 'text';
        eyeOpen.style.display = isText ? 'block' : 'none';
        eyeClosed.style.display = isText ? 'none' : 'block';
      });
    }

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const errorEl = document.getElementById('login-error');
        const btnText = document.querySelector('#login-btn .btn-text');
        const btnLoader = document.querySelector('#login-btn .btn-loader');
        const btn = document.getElementById('login-btn');

        if (!username || !password) {
          errorEl.textContent = 'Por favor ingresa usuario y contraseña.';
          errorEl.classList.add('visible');
          return;
        }

        errorEl.classList.remove('visible');
        btn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'flex';

        try {
          const res = await API.login(username, password);
          if (res.user) {
            res.user.role = sanitizeRole(res.user.role);
            if (!res.user.jobTitle) {
              res.user.jobTitle = resolveJobTitle(res.user);
            }
          }
          Auth.save(res.token, res.user);
          // FX: success animation then transition
          if (typeof FX !== 'undefined') {
            FX.animateLoginSuccess(() => {
              showApp();
              navigate('dashboard');
            });
          } else {
            showApp();
            navigate('dashboard');
          }
        } catch (err) {
          errorEl.textContent = err.message || 'Credenciales inválidas.';
          errorEl.classList.add('visible');
          // FX: error shake + sound
          if (typeof FX !== 'undefined') FX.animateLoginError();
        } finally {
          btn.disabled = false;
          if (btnText) btnText.style.display = 'inline';
          if (btnLoader) btnLoader.style.display = 'none';
        }
      });
    }

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      // FX: logout sound
      if (typeof FX !== 'undefined') FX.Sound.logout();
      Auth.clear();
      if (typeof Settings !== 'undefined') {
        Settings.resetToDefaults();
      }
      showLogin();
      showToast('Sesión cerrada correctamente.', 'info');
    });

    // Profile modal openers
    document.getElementById('sidebar-user')?.addEventListener('click', (e) => {
      if (e.target.closest('#logout-btn')) return;
      openProfileModal();
    });
    document.getElementById('profile-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openProfileModal();
    });
    document.getElementById('topbar-profile-btn')?.addEventListener('click', () => {
      openProfileModal();
    });
    document.getElementById('topbar-settings-btn')?.addEventListener('click', () => {
      navigate('settings');
    });

    document.getElementById('topbar-theme-toggle')?.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
        (typeof Settings !== 'undefined' && Settings.get('theme') === 'dark');
      const nextTheme = isDark ? 'light' : 'dark';
      if (typeof Settings !== 'undefined') {
        Settings.set('theme', nextTheme);
      } else {
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('talento360_theme', nextTheme);
      }
      updateTopbarQuickControls();
      if (typeof FX !== 'undefined' && FX.Sound) FX.Sound.click();
    });

    document.getElementById('topbar-sound-toggle')?.addEventListener('click', () => {
      if (typeof Settings !== 'undefined') {
        const nextSound = !Settings.get('soundEnabled');
        Settings.set('soundEnabled', nextSound);
        updateTopbarQuickControls();
        showToast(nextSound ? 'Efectos de sonido activados' : 'Efectos de sonido silenciados', 'info');
        if (nextSound && typeof FX !== 'undefined' && FX.Sound) FX.Sound.click();
      }
    });

    // Sidebar toggle (both sidebar and topbar buttons)
    const toggleSidebar = () => {
      const app = document.getElementById('app');
      if (!app) return;
      const collapsed = app.classList.toggle('sidebar-collapsed');
      localStorage.setItem('talento360_sidebar_collapsed', String(collapsed));
      // FX: sidebar toggle animation
      if (typeof FX !== 'undefined') FX.animateSidebarToggle(collapsed);
    };

    document.getElementById('sidebar-toggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('topbar-sidebar-toggle')?.addEventListener('click', toggleSidebar);

    // Mobile menu
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('mobile-open');
    });

    // Modal close
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Nav items
    document.querySelectorAll('.nav-item[data-module]:not(.nav-group-toggle), .sidebar-settings-btn[data-module]').forEach(btn => {
      btn.addEventListener('click', () => {
        // FX: nav click animation
        if (typeof FX !== 'undefined') FX.animateNavClick(btn);
        const module = btn.dataset.module;
        const tipo = btn.dataset.tipo;
        if (module === 'admin-requests') {
          const tipoKey = { 'Permiso Laboral': 'permisos', 'Incapacidad': 'incapacidades', 'Licencia': 'licencias' }[tipo] || 'permisos';
          navigate('admin-requests', { tipo: tipoKey });
        } else {
          navigate(module);
        }
        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('mobile-open');
      });
    });

    // Admin group toggle
    document.getElementById('nav-admin-group')?.addEventListener('click', () => {
      const toggle = document.getElementById('nav-admin-group');
      const menu = document.getElementById('admin-submenu');
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      menu.setAttribute('aria-hidden', String(expanded));
      if (typeof FX !== 'undefined') FX.Sound.navClick();
    });

    // Check existing session and cleanse stored user data
    if (Auth.isLoggedIn()) {
      const storedUser = Auth.getUser();
      if (storedUser && typeof storedUser === 'object') {
        let changed = false;
        if (storedUser.role === 'Administradora') {
          storedUser.role = 'Administrador';
          changed = true;
        }
        if (!storedUser.jobTitle) {
          const title = resolveJobTitle(storedUser);
          if (title) {
            storedUser.jobTitle = title;
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem('h360_user', JSON.stringify(storedUser));
        }
      }
      if (typeof Settings !== 'undefined' && storedUser && storedUser.username) {
        Settings.loadForUser(storedUser.username);
      }
      showApp();
      navigate('dashboard');
    } else {
      if (typeof Settings !== 'undefined') {
        Settings.resetToDefaults();
      }
      showLogin();
    }

    // FX: init effects engine
    if (typeof FX !== 'undefined') FX.init();
  }

  return { init, navigate, showLogin, showApp, showToast, openModal, closeModal, openProfileModal, updateTopbarQuickControls, updateTopbarDateTime };
})();

// ─── Bootstrap ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
