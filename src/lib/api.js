const configuredUrl = import.meta.env.VITE_API_URL || 'https://zride-texon.loca.lt';

export const API_BASE_URL = configuredUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
export const API_URL = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;

// API KEY - Yahi wali key backend ko jayegi
export const API_KEY = import.meta.env.VITE_API_KEY || 'ZRIDE-X9K2-M7Q8-P4V2-2026-SECURE';

export function getHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  };
}

// Har fetch isi se hoga, taake key har baar jaye
export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

// --- SHOPS ---
export const getShops = () => apiFetch(`/shops`);
export const getPendingShops = () => apiFetch(`/shops?status=pending`);
export const getShopById = (id) => apiFetch(`/shops/${id}`);
export const approveShop = (id) => apiFetch(`/shops/${id}/approve`, { method: "POST" });
export const rejectShop = (id, reason) => apiFetch(`/shops/${id}/reject`, { method: "POST", body: JSON.stringify({ reason: reason || "Rejected by admin" }) });
export const updateShopStatus = (id, status) => apiFetch(`/shops/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });

// --- DRIVERS / RIDERS ---
export const getDrivers = () => apiFetch(`/drivers`);
export const getRiders = () => apiFetch(`/riders`);
export const getUsers = () => apiFetch(`/users`);

// --- DASHBOARD ---
export const getDashboardStats = () => apiFetch(`/admin/stats`);
export const getAdminStats = () => apiFetch(`/admin/stats`);

export default apiFetch;