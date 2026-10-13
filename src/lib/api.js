const configuredUrl = import.meta.env.VITE_API_URL || 'https://zride-texon.loca.lt';

export const API_BASE_URL = configuredUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
export const API_URL = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;