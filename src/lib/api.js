const configuredUrl = import.meta.env.VITE_API_URL || 'https://zride-texon.loca.lt';

export const API_BASE_URL = configuredUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
export const API_URL = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;
export const API_KEY = import.meta.env.VITE_API_KEY || 'ZRIDE-X9K2-M7Q8-P4V2-2026-SECURE';