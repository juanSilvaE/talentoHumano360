/* ═══════════════════════════════════════════════════════════════════════════
   auth.js — Session and JWT management
   ═══════════════════════════════════════════════════════════════════════════ */

const Auth = (() => {
  const TOKEN_KEY = 'h360_token';
  const USER_KEY  = 'h360_user';

  function save(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }

  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || '{}'); }
    catch { return {}; }
  }

  function clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function isLoggedIn() {
    const token = getToken();
    if (!token) return false;
    try {
      // Decode JWT payload (no verification — that's the server's job)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch { return false; }
  }

  function canEdit() {
    const user = getUser();
    if (!user.role) return false;
    const r = user.role.toLowerCase();
    return r.includes('administrador') || r.includes('coordinador');
  }

  return { save, getToken, getUser, clear, isLoggedIn, canEdit };
})();
