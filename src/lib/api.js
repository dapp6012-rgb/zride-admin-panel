const configuredUrl = import.meta.env.VITE_API_URL || '';

export const API_BASE_URL = configuredUrl.replace(/\/api\/?$/i, '').replace(/\/+$/, '');
export const API_URL = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';
export const SOCKET_URL = API_BASE_URL;
export const API_KEY = import.meta.env.VITE_API_KEY || '';

function normalizeApiPath(path) {
  const pathWithQuery = String(path);
  const relativePath = pathWithQuery.replace(/^https?:\/\/[^/]+/i, '');
  const normalizedPath = relativePath
    .replace(/^(?:\/api)+(?=\/|$)/i, '')
    .replace(/^\/+/, '');

  return `${API_URL}/${normalizedPath}`;
}

export function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };
}

export async function apiFetch(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_URL is not configured. Set it in your local environment.');
  }
  if (!API_KEY) {
    throw new Error('VITE_API_KEY is not configured. Set it in your local environment.');
  }

  const headers = new Headers(options.headers || {});
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  headers.set('bypass-tunnel-reminder', 'true');
  if (isFormData) {
    headers.delete('Content-Type');
  } else if (typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('x-api-key', API_KEY);

  return fetch(normalizeApiPath(path), {
    ...options,
    headers,
  });
}

export const getCountries = () => apiFetch('/countries');
export const getShops = () => apiFetch('/shops');
export const getPendingShops = () => apiFetch('/shops?status=pending');
export const getShopById = id => apiFetch(`/shops/${id}`);
export const approveShop = id => apiFetch(`/shops/${id}/approve`, { method: 'POST' });
export const rejectShop = (id, reason) => apiFetch(`/shops/${id}/reject`, {
  method: 'POST',
  body: JSON.stringify({ reason: reason || 'Rejected by admin' }),
});
export const updateShopStatus = (id, status) => apiFetch(`/shops/${id}/status`, {
  method: 'PUT',
  body: JSON.stringify({ status }),
});

export const getDrivers = () => apiFetch('/drivers');
export const getRiders = () => apiFetch('/riders');
export const getUsers = () => apiFetch('/users');

export const getDashboardStats = () => apiFetch('/super-admin/dashboard-stats');
export const getAdminStats = () => apiFetch('/super-admin/dashboard-stats');

export default apiFetch;
