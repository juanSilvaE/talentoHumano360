/* ═══════════════════════════════════════════════════════════════════════════
   app.js — SPA Router, Login handler, Global utilities
   ═══════════════════════════════════════════════════════════════════════════ */

const App = (() => {

  // ─── Toast System ──────────────────────────────────────────────────────────
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ─── Modal System ──────────────────────────────────────────────────────────
  function openModal(title, bodyHtml, footerButtons = []) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl  = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');
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
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  // ─── Navigation ────────────────────────────────────────────────────────────
  const MODULE_TITLES = {
    dashboard:      'Dashboard',
    employees:      'Servidores Públicos',
    requests:       'Solicitudes de Vacaciones',
    'admin-requests': 'Gestión de Solicitudes Administrativas',
    viaticos:       'Viáticos',
  };

  async function navigate(module, options = {}) {
    const container = document.getElementById('module-container');
    const pageTitle = document.getElementById('page-title');
    if (!container) return;

    // Update active nav
    document.querySelectorAll('.nav-item:not(.nav-subitem)').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-subitem').forEach(b => b.classList.remove('active'));
    const navBtn = document.getElementById(`nav-${module}`);
    if (navBtn) {
      navBtn.classList.add('active');
      navBtn.setAttribute('aria-current', 'page');
    }

    if (pageTitle) pageTitle.textContent = MODULE_TITLES[module] || module;
    document.title = `${MODULE_TITLES[module] || module} — Humano 360`;

    // Render module
    switch (module) {
      case 'dashboard':
        await DashboardModule.render(container);
        break;
      case 'employees':
        await EmployeesModule.render(container);
        break;
      case 'requests':
        await RequestsModule.render(container);
        break;
      case 'admin-requests': {
        const tipoKey = options.tipo || 'permisos';
        await AdminRequestsModule.render(container, tipoKey);
        // Activate correct subitem
        const subnavMap = { permisos: 'nav-permisos', incapacidades: 'nav-incapacidades', licencias: 'nav-licencias' };
        const activeSubBtn = document.getElementById(subnavMap[tipoKey] || 'nav-permisos');
        if (activeSubBtn) activeSubBtn.classList.add('active');
        // Open submenu
        expandAdminGroup();
        break;
      }
      case 'viaticos':
        await ViaticosModule.render(container);
        break;
      default:
        container.innerHTML = `<div class="module-enter"><p style="color:var(--text-muted)">Módulo no encontrado.</p></div>`;
    }

    // Scroll to top
    container.scrollTop = 0;
  }

  function expandAdminGroup() {
    const toggle = document.getElementById('nav-admin-group');
    const menu   = document.getElementById('admin-submenu');
    if (toggle && menu) {
      toggle.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
    }
  }

  // ─── Login ─────────────────────────────────────────────────────────────────
  function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }

  function showApp() {
    const user = Auth.getUser();
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'grid';

    // Populate user info
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    const avatarEl = document.getElementById('user-avatar');
    const roleEl2 = document.getElementById('topbar-role-badge');
    if (nameEl) nameEl.textContent = user.name || 'Usuario';
    if (roleEl) roleEl.textContent = user.role || 'Sistema';
    if (roleEl2) roleEl2.textContent = user.role || 'Usuario';
    if (avatarEl) avatarEl.textContent = (user.name || 'A').charAt(0).toUpperCase();
  }

  // ─── Init ──────────────────────────────────────────────────────────────────
  function init() {
    // Topbar date
    const dateEl = document.getElementById('topbar-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('es-CO', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }

    // Password toggle
    const toggleBtn = document.getElementById('toggle-password');
    const passInput = document.getElementById('login-password');
    const eyeOpen   = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');
    if (toggleBtn && passInput) {
      toggleBtn.addEventListener('click', () => {
        const isText = passInput.type === 'text';
        passInput.type = isText ? 'password' : 'text';
        eyeOpen.style.display   = isText ? 'block' : 'none';
        eyeClosed.style.display = isText ? 'none'  : 'block';
      });
    }

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const errorEl  = document.getElementById('login-error');
        const btnText  = document.querySelector('#login-btn .btn-text');
        const btnLoader= document.querySelector('#login-btn .btn-loader');
        const btn      = document.getElementById('login-btn');

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
          Auth.save(res.token, res.user);
          showApp();
          await navigate('dashboard');
        } catch (err) {
          errorEl.textContent = err.message || 'Credenciales inválidas.';
          errorEl.classList.add('visible');
        } finally {
          btn.disabled = false;
          if (btnText)  btnText.style.display = 'inline';
          if (btnLoader) btnLoader.style.display = 'none';
        }
      });
    }

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      Auth.clear();
      showLogin();
      showToast('Sesión cerrada correctamente.', 'info');
    });

    // Sidebar toggle
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('app').classList.toggle('sidebar-collapsed');
    });

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
    document.querySelectorAll('.nav-item[data-module]:not(.nav-group-toggle)').forEach(btn => {
      btn.addEventListener('click', () => {
        const module = btn.dataset.module;
        const tipo   = btn.dataset.tipo;
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
      const menu   = document.getElementById('admin-submenu');
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      menu.setAttribute('aria-hidden', String(expanded));
    });

    // Check existing session
    if (Auth.isLoggedIn()) {
      showApp();
      navigate('dashboard');
    } else {
      showLogin();
    }
  }

  return { init, navigate, showLogin, showApp, showToast, openModal, closeModal };
})();

// ─── Bootstrap ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
