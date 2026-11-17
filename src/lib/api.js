const configuredUrl = import.meta.env.VITE_API_URL || 'https://zride-texon.loca.lt';

export const API_BASE_URL = configuredUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
export const API_URL = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;
export const API_KEY = import.meta.env.VITE_API_KEY || 'ZRIDE-X9K2-M7Q8-P4V2-2026-SECURE';

// Key ko header me daalne ke liye
export function getHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  };
}

// Har request isi se jayegi, taake key har baar saath jaye
// Aur /api/api wala masla bhi khud hi fix ho jayega
export async function apiFetch(path, options = {}) {
  let cleanPath = path.replace(/^\/api/, '');
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

  const res = await fetch(`${API_URL}${cleanPath}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

// --- COUNTRIES ---
export const getCountries = () => apiFetch(`/countries`);

// --- SHOPS ---
export const getShops = () => apiFetch(`/shops`);
export const getPendingShops = () => apiFetch(`/shops?status=pending`);
export const getShopById = (id) => apiFetch(`/shops/${id}`);
export const approveShop = (id) => apiFetch(`/shops/${id}/approve`, { method: "POST" });
export const rejectShop = (id, reason) => apiFetch(`/shops/${id}/reject`, { method: "POST", body: JSON.stringify({ reason: reason || "Rejected by admin" }) });
export const updateShopStatus = (id, status) => apiFetch(`/shops/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });

// --- DRIVERS / RIDERS / USERS ---
export const getDrivers = () => apiFetch(`/drivers`);
export const getRiders = () => apiFetch(`/riders`);
export const getUsers = () => apiFetch(`/users`);

// --- DASHBOARD ---
export const getDashboardStats = () => apiFetch(`/super-admin/dashboard-stats`);
export const getAdminStats = () => apiFetch(`/super-admin/dashboard-stats`);

export default apiFetch;