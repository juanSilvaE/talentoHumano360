/* ═══════════════════════════════════════════════════════════════════════════
   api.js — HTTP Client and Global Utilities for all microservices
   ═══════════════════════════════════════════════════════════════════════════ */

function escHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function truncate(str, n = 30) {
  if (!str) return '';
  return str.length > n ? str.substring(0, n) + '…' : str;
}

const API = (() => {
  const BASE = '/api';

  async function request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(BASE + url, { ...options, headers });

    if (res.status === 401) {
      Auth.clear();
      App.showLogin();
      throw new Error('Sesión expirada. Por favor inicia sesión de nuevo.');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  }

  return {
    // Auth
    login: (username, password) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    updateProfile: (data) =>
      request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

    // Dashboard
    getDashboardStats: () => request('/dashboard/stats'),
    getDashboardChart: () => request('/dashboard/chart'),

    // Employees
    getEmployees: (params = {}) => request('/employees?' + new URLSearchParams(params)),
    getEmployeeCatalogs: () => request('/employees/catalogs'),
    createEmployee: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
    bulkCreateEmployees: (rows) => request('/employees/bulk', { method: 'POST', body: JSON.stringify({ rows }) }),
    updateEmployee: (cedula, data) => request(`/employees/${cedula}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEmployee: (cedula) => request(`/employees/${cedula}`, { method: 'DELETE' }),

    // Vacaciones
    getRequests: (params = {}) => request('/requests?' + new URLSearchParams(params)),
    getRequestCatalogs: () => request('/requests/catalogs'),
    createRequest: (data) => request('/requests', { method: 'POST', body: JSON.stringify(data) }),
    bulkCreateRequests: (rows) => request('/requests/bulk', { method: 'POST', body: JSON.stringify({ rows }) }),
    updateRequest: (id, data) => request(`/requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateRequestStatus: (id, estado, notaGestion = '') =>
      request(`/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ estado, notaGestion }) }),
    deleteRequest: (id) => request(`/requests/${id}`, { method: 'DELETE' }),

    // Solicitudes Administrativas
    getAdminRequests: (params = {}) => request('/admin-requests?' + new URLSearchParams(params)),
    getAdminRequestsStats: () => request('/admin-requests/stats'),
    createAdminRequest: (data) => request('/admin-requests', { method: 'POST', body: JSON.stringify(data) }),
    bulkCreateAdminRequests: (rows) => request('/admin-requests/bulk', { method: 'POST', body: JSON.stringify({ rows }) }),
    updateAdminRequest: (id, data) => request(`/admin-requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateAdminRequestStatus: (id, estado, notaGestion = '') =>
      request(`/admin-requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ estado, notaGestion }) }),
    deleteAdminRequest: (id) => request(`/admin-requests/${id}`, { method: 'DELETE' }),

    // Viáticos
    getViaticos: (params = {}) => request('/viaticos?' + new URLSearchParams(params)),
    getViaticosStats: () => request('/viaticos/stats'),
    createViatico: (data) => request('/viaticos', { method: 'POST', body: JSON.stringify(data) }),
    bulkCreateViaticos: (rows) => request('/viaticos/bulk', { method: 'POST', body: JSON.stringify({ rows }) }),
    updateViatico: (id, data) => request(`/viaticos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateViaticoStatus: (id, estado, observaciones = '') =>
      request(`/viaticos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ estado, observaciones }) }),
    deleteViatico: (id) => request(`/viaticos/${id}`, { method: 'DELETE' }),
  };
})();
